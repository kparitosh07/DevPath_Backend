import Repository from "../../models/repository.model.js";
import User from "../../models/user.model.js";
import { getGithubRepositories, getRepositoryDetails, } from "./github.service.js";
import { selectRepositoriesForAnalysis, } from "./repositorySelector.service.js";
import { analyzeRepository } from "../ml/ml.service.js";


export const syncUserRepositories = async (userId) => {
    const githubRepositories = await getGithubRepositories(userId);
    const selectedRepositories = selectRepositoriesForAnalysis(githubRepositories, 15);
    const syncedRepositories = [];
    const allSkillResults = [];

    for (const repo of selectedRepositories) {
        try {
            const owner = repo.owner.login;
            const repoName = repo.name;
            const details = await getRepositoryDetails(userId, owner, repoName);

            let mlResult = {
                skills: []
            };

            try {
                mlResult = await analyzeRepository({
                    name: repo.name,
                    languages: details.languages || {},
                    topics: details.topics || [],
                    readme: details.readme || "",
                    dependencies: details.dependencies || {},
                });
            } catch (error) {
                console.error(`ML analysis failed for ${repo.full_name}:`, error.message);
            }

            allSkillResults.push(
                ...(mlResult.skills || [])
            );

            const savedRepository = await Repository.findOneAndUpdate(
                {
                    user: userId,
                    githubId: repo.id,
                },
                {
                    user: userId,
                    githubId: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    owner: owner,
                    description: repo.description || "",
                    url: repo.html_url || "",
                    defaultBranch: repo.default_branch || "main",
                    stars: repo.stargazers_count || 0,
                    forks: repo.forks_count || 0,
                    openIssues: repo.open_issues_count || 0,
                    languages: details.languages || {},
                    topics: details.topics || [],
                    readme: details.readme || null,
                    dependencies:
                        details.dependencies || {
                            packageJson: [],
                            requirementsTxt: [],
                            pyprojectToml: [],
                        },
                    lastSyncedAt: new Date(),
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

            syncedRepositories.push(savedRepository);

        } catch (error) {
            console.error(`Failed to sync ${repo.full_name}:`, error.message);
            continue;
        }
    }

    const userSkills = aggregateUserSkills(allSkillResults);

    await User.findByIdAndUpdate(
        userId,
        {
            skills: userSkills,
            skillsAnalyzedAt: new Date(),
        },
        {
            returnDocument: "after",
        }
    );
    return syncedRepositories;
};

const aggregateUserSkills = (skillResults) => {
    const skillMap = new Map();
    for (const skill of skillResults) {
        if (!skill?.name) {
            continue;
        }

        const name = skill.name.trim();
        if (!name) {
            continue;
        }
        const confidence = Number(skill.confidence) || 0;

        const existing = skillMap.get(name);

        if (!existing) {
            skillMap.set(name, {
                name,
                confidence,
                source: skill.source || "hybrid",
                evidence: skill.evidence || [],
            });
            continue;
        }

        existing.confidence = Math.max(
            existing.confidence,
            confidence
        );

        const sources = new Set(
            [
                existing.source,
                skill.source || "hybrid",
            ].filter(Boolean)
        );

        existing.source = sources.size === 1 ? [...sources][0] : "hybrid";

        existing.evidence = [
            ...new Set([
                ...existing.evidence,
                ...(skill.evidence || []),
            ]),
        ];
    }

    return Array.from(
        skillMap.values()
    ).sort(
        (a, b) => b.confidence - a.confidence
    );
};
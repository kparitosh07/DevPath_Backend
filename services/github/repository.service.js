import Repository from "../../models/repository.model.js";
import { getGithubRepositories, getRepositoryDetails, } from "./github.service.js";
import {selectRepositoriesForAnalysis,} from "./repositorySelector.service.js";

export const syncUserRepositories = async (userId) => {
    const githubRepositories = await getGithubRepositories(userId);
    const selectedRepositories =selectRepositoriesForAnalysis(githubRepositories,15);
    const syncedRepositories = [];

    for (const repo of selectedRepositories) {
        try {
            const owner = repo.owner.login;
            const repoName = repo.name;
            const details = await getRepositoryDetails(userId, owner, repoName);

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
            console.error(`Failed to sync ${repo.full_name}:`,error.message);
            continue;
        }
    }
    return syncedRepositories;
};
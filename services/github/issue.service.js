import axios from "axios";
import Issue from "../../models/issue.model.js";
import User from "../../models/user.model.js";
import { getMLIssueRecommendations } from "../ml/ml.service.js";

const getGithubToken = async (userId) => {
    const user = await User.findById(userId)
        .select("+githubAccessToken");

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.githubAccessToken) {
        throw new Error(
            "GitHub access token not found"
        );
    }

    return user.githubAccessToken;
};

const githubIssueSearch = async (query, accessToken) => {
    const response = await axios.get(
        "https://api.github.com/search/issues",
        {
            params: {
                q: query,
                sort: "updated",
                order: "desc",
                per_page: 30,
            },

            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );
    return response.data.items || [];
};

const getRecentDate = (days = 30) => {
    const date = new Date();

    date.setDate(
        date.getDate() - days
    );

    return date
        .toISOString()
        .split("T")[0];
};

const getUserSkills = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    return user.skills || [];
};

export const searchRelevantIssues = async (
    userId
) => {

    const accessToken = await getGithubToken(userId);
    const skills = await getUserSkills(userId);
    if (!skills.length) {
        throw new Error("User skills not found. Analyze repositories first.");
    }

    const recentDate = getRecentDate(30);

    const topSkills = skills
        .filter(
            (skill) =>
                skill.confidence >= 0.5
        )
        .sort(
            (a, b) =>
                b.confidence -
                a.confidence
        )
        .slice(0, 5);

    const allIssues = [];

    for (const skill of topSkills) {
        const queries = [
            `"${skill.name}" is:issue is:open has:description created:>=${recentDate} label:"good first issue"`,
            `"${skill.name}" is:issue is:open has:description created:>=${recentDate} label:"help wanted"`,
        ];

        for (const query of queries) {
            try {
                const issues = await githubIssueSearch(query, accessToken);

                allIssues.push(
                    ...issues.map(
                        (issue) => ({
                            ...issue,
                            matchedSkills: [skill.name],
                            skillConfidence: skill.confidence,
                        })
                    )
                );
            } catch (error) {
                console.error("Issue search failed:", error.response?.data || error.message);
            }
        }
    }

    const issueMap = new Map();

    for (const issue of allIssues) {
        if (!issueMap.has(issue.id)) {
            issueMap.set(issue.id, {
                ...issue,
                matchedSkills: [...(issue.matchedSkills || [])],
            });
        } else {
            const existing = issueMap.get(issue.id);
            existing.matchedSkills = [
                ...new Set([
                    ...(existing.matchedSkills || []),
                    ...(issue.matchedSkills || []),
                ]),
            ];

            existing.skillConfidence = Math.max(
                existing.skillConfidence || 0,
                issue.skillConfidence || 0
            );
        }
    }

    const uniqueIssues = [...issueMap.values()];
    const candidates = uniqueIssues.slice(0, 50);

    if (!candidates.length) {
        return [];
    }

    const student = {
        skills: skills.map((skill) => ({
            name: skill.name,
            confidence: skill.confidence || 0,
            evidence: skill.evidence || [],
            source: skill.source || "",
        })),
    };

    const mlIssues = candidates.map((issue) => ({
        id: String(issue.id),
        title: issue.title || "",
        description: issue.body || "",
        labels: (issue.labels || []).map((label) =>
            typeof label === "string" ? label : label.name
        ),
        technologies: [],
        difficulty: "unknown",
        repository_language: "",
    }));

    const mlResult = await getMLIssueRecommendations({
        student,
        issues: mlIssues,
    });

    const recommendations = mlResult.recommendations || [];
    const candidateMap = new Map(
        candidates.map((issue) => [String(issue.id), issue])
    );

    const selectedRecommendations = recommendations
        .map((recommendation) => ({
            recommendation,
            issue: candidateMap.get(String(recommendation.issueId)),
        }))
        .filter((item) => item.issue)
        .slice(0, 15);

    const savedIssues = [];

    for (const { recommendation, issue } of selectedRecommendations) {
        try {
            const labels = (issue.labels || []).map((label) =>
                typeof label === "string" ? label : label.name
            );

            const savedIssue = await Issue.findOneAndUpdate(
                { githubId: issue.id },
                {
                    githubId: issue.id,
                    repositoryFullName:
                        issue.repository_url?.split("/repos/")[1] || "",
                    title: issue.title || "",
                    description: issue.body || "",
                    url: issue.html_url || "",
                    state: issue.state || "open",
                    labels,
                    language: "",
                    author: {
                        username: issue.user?.login || "",
                        avatar: issue.user?.avatar_url || "",
                    },
                    createdAtGithub: issue.created_at,
                    updatedAtGithub: issue.updated_at,
                    comments: issue.comments || 0,

                    relevanceScore: Math.round(
                        (recommendation.score || 0) * 100
                    ),
                    matchedSkills: recommendation.matchedSkills || [],
                    missingSkills: recommendation.missingSkills || [],
                    recommendationReason: recommendation.reason || "",
                    lastSyncedAt: new Date(),
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

            savedIssues.push(savedIssue);
        } catch (error) {
            console.error(
                `Failed to save issue ${issue.id}:`,
                error.message
            );
        }
    }

    return savedIssues;
};


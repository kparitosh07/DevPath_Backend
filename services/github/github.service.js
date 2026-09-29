import axios from "axios";
import User from "../../models/user.model.js";

const githubRequest = async (url, accessToken, params = {}) => {
    const response = await axios.get(url, {
        params,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    return response.data;
};

const getUserWithToken = async (userId) => {
    const user = await User.findById(userId).select(
        "+githubAccessToken"
    );

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.githubAccessToken) {
        throw new Error("GitHub access token not found");
    }

    return user;
};

export const getGithubProfile = async (userId) => {
    const user = await User.findById(userId).select("+githubAccessToken");

    return githubRequest(
        "https://api.github.com/user",
        user.githubAccessToken
    );
};

export const getGithubRepositories = async (userId) => {
    const user = await User.findById(userId).select("+githubAccessToken");

    return githubRequest(
        "https://api.github.com/user/repos",
        user.githubAccessToken,
        {
            visibility: "all",
            affiliation: "owner,collaborator,organization_member",
            sort: "updated",
            per_page: 100,
        }
    );
};

export const getRepositoryDetails = async (userId, owner, repo) => {
    const user = await getUserWithToken(userId);

    const headers = {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-Github-Api-Version": "2022-11-28",
    };

    const [repository, languages, topics, readmeResponse] = await Promise.all([
        axios.get(
            `https://api.github.com/repos/${owner}/${repo}`,
            { headers }
        ),
        axios.get(
            `https://api.github.com/repos/${owner}/${repo}/languages`,
            { headers }
        ),

        axios.get(
            `https://api.github.com/repos/${owner}/${repo}/topics`,
            { headers }
        ),

        axios.get(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            { headers }
        ),
    ]);

    let readme = "";

    if (readmeResponse.data?.content) {
        readme = Buffer.from(
            readmeResponse.data.content,
            "base64"
        ).toString("utf-8");
    }

    return {
        repository: repository.data,
        languages: languages.data,
        topics: topics.data.names || [],
        readme,
    };

}
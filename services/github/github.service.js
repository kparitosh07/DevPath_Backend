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
    const user = await User.findById(userId).select("+githubAccessToken");

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.githubAccessToken) {
        throw new Error("GitHub access token not found");
    }

    return user;
};

export const getGithubProfile = async (userId) => {
    const user = await getUserWithToken(userId);
    return githubRequest(
        "https://api.github.com/user",
        user.githubAccessToken
    );
};

export const getGithubRepositories = async (userId) => {
    const user = await getUserWithToken(userId);

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

const getFileFromGithub = async (owner, repo, filePath, accessToken) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );

        if (!response.data?.content) {
            return null;
        }

        return Buffer.from(
            response.data.content,
            "base64"
        ).toString("utf-8");
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }

        throw error;
    }
};

export const getRepositoryDetails = async (userId, owner, repo) => {
    const user = await getUserWithToken(userId);

    const headers = {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    const [repository, languages, topics, readmeResponse, packageJson, requirementsTxt, pyprojectToml] = await Promise.all([
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
        ).toString();
    }
    
    const dependencyFiles = await findDependencyFiles(owner,repo,user.githubAccessToken);
    const dependencies = await getDependencyFiles(owner,repo,user.githubAccessToken,dependencyFiles);

    return {
        repository: repository.data,
        languages: languages.data,
        topics: topics.data.names || [],
        readme,
        dependencies,
    };

}

const findDependencyFiles = async (owner, repo, accessToken) => {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    const repositoryResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
    );

    const defaultBranch = repositoryResponse.data.default_branch;

    const treeResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}`,
        {
            headers,
            params: {
                recursive: "true",
            },
        }
    );

    const files = treeResponse.data.tree || [];

    const dependencyFiles = files.filter(
        (file) =>
            file.type === "blob" &&
            [
                "package.json",
                "requirements.txt",
                "pyproject.toml",
            ].includes(file.path.split("/").pop())
    );

    return dependencyFiles.map((file) => ({
        path: file.path,
        name: file.path.split("/").pop(),
    }));
};

const getDependencyFiles = async (owner, repo, accessToken, files) => {
    const result = {
        packageJson: [],
        requirementsTxt: [],
        pyprojectToml: [],
    };

    for (const file of files) {
        const content = await getFileFromGithub(
            owner,
            repo,
            file.path,
            accessToken
        );

        if (file.name === "package.json") {
            let packageData = null;

            try {
                packageData = JSON.parse(content);
            } catch (error) {
                console.warn(
                    `Invalid package.json: ${file.path}`
                );
            }

            result.packageJson.push({
                path: file.path,
                data: packageData,
            });
        }

        if (file.name === "requirements.txt") {
            result.requirementsTxt.push({
                path: file.path,
                content,
            });
        }

        if (file.name === "pyproject.toml") {
            result.pyprojectToml.push({
                path: file.path,
                content,
            });
        }
    }

    return result;
};
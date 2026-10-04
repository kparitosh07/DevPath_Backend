import {getGithubProfile,getGithubRepositories,getRepositoryDetails} from "../services/github/github.service.js";
import {syncUserRepositories,} from "../services/github/repository.service.js";

export const getProfile = async (req, res) => {
  try {
    const profile = await getGithubProfile(req.user.userId);

    res.json({
      success: true,
      data: {
        githubId: profile.id,
        username: profile.login,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar_url,
        bio: profile.bio,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        profileUrl: profile.html_url,
      },
    });
  } catch (error) {
    console.error("GitHub profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch GitHub profile",
    });
  }
};

export const getRepositories = async (req, res) => {
  try {
    const repositories = await getGithubRepositories(
      req.user.userId
    );

    const formattedRepositories = repositories.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics || [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      url: repo.html_url,
      updatedAt: repo.updated_at,
    }));

    res.json({
      success: true,
      data: formattedRepositories,
    });
  } catch (error) {
    console.error("GitHub repositories error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch GitHub repositories",
    });
  }
};

export const getRepositoryAnalysisData = async (req, res) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: "Owner and repository are required",
      });
    }

    const data = await getRepositoryDetails(
      req.user.userId,
      owner,
      repo
    );

    res.json({
      success: true,
      data: {
        repository: {
          githubId: data.repository.id,
          name: data.repository.name,
          fullName: data.repository.full_name,
          description: data.repository.description,
          url: data.repository.html_url,
          stars: data.repository.stargazers_count,
          forks: data.repository.forks_count,
        },

        languages: data.languages,
        topics: data.topics,
        readme: data.readme,
        dependencies: data.dependencies,
      },
    });
  } catch (error) {
    console.error(
      "Repository analysis data error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch repository analysis data",
    });
  }
};

export const syncRepositories = async (req, res) => {
    try {
        const repositories = await syncUserRepositories(req.user.userId);

        return res.status(200).json({
            success: true,
            message: "Repositories synchronized successfully",
            data: {
                count: repositories.length,
                repositories,
            },
        });

    } catch (error) {
        console.error("Repository sync error:",error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to synchronize repositories",
        });
    }
};
export const selectRepositoriesForAnalysis = (repositories, limit = 15) => {
    const candidates = repositories.filter((repo) => {
        if (repo.archived) return false;
        if (repo.fork) return false;
        return true;
    }).map((repo) => {
        let score = 0;

        if (repo.updated_at) {
            const updatedAt = new Date(repo.updated_at);
            const daysSinceUpdate =
                (Date.now() - updatedAt.getTime()) /
                (1000 * 60 * 60 * 24);

            if (daysSinceUpdate <= 30) {
                score += 30;
            } else if (daysSinceUpdate <= 90) {
                score += 20;
            } else if (daysSinceUpdate <= 180) {
                score += 10;
            }
        }

        score += Math.min(repo.stargazers_count || 0, 20);

        if (repo.description) {
            score += 10;
        }

        if (repo.topics?.length) {
            score += 10;
        }

        if (repo.size > 0) {
            score += 10;
        }

        return {
            repo,
            score,
        };
    });

    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit).map((item) => item.repo);
};
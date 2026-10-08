export const rankIssues = (issues, skills) => {
    return issues
        .map((issue) => {
            const title = issue.title?.toLowerCase() || "";
            const body = issue.body?.toLowerCase() || "";
            const text = `${title} ${body}`;
            const labels = issue.labels?.map((label) =>
                label.name.toLowerCase()
            ) || [];
            let score = 0;
            const matchedSkills = [];
            for (const skill of skills) {
                const skillName = skill.name.toLowerCase();
                if (text.includes(skillName)) {
                    score += 40 * (skill.confidence || 0);
                    matchedSkills.push(skill.name);
                }
            }

            if (labels.includes("good first issue") || labels.includes("good-first-issue")) {
                score += 30;
            }

            if (labels.includes("help wanted")) {
                score += 20;
            }

            if (labels.includes("first-timers-only")) {
                score += 15;
            }

            if (labels.includes("up-for-grabs")) {
                score += 10;
            }

            if (body.length >= 200) {
                score += 10;
            }

            const noCodeKeywords = [
                "no code required",
                "no coding required",
                "no coding experience",
                "content contribution",
                "community contribution",
                "add quote",
                "add proverb",
                "add fact",
                "add trivia",
                "translation",
                "grammar",
                "json/data file edit"
            ];

            const codingKeywords = [
                "bug",
                "fix",
                "component",
                "function",
                "hook",
                "api",
                "frontend",
                "backend",
                "typescript",
                "javascript",
                "react",
                "node",
                "express",
                "css",
                "database",
                "test",
                "implement",
                "ref"
            ];

            for (const keyword of noCodeKeywords) {
                if (text.includes(keyword)) {
                    score -= 40;
                }
            }

            for (const keyword of codingKeywords) {
                if (text.includes(keyword)) {
                    score += 5;
                }
            }

            if (issue.assignees && issue.assignees.length > 0) {
                score -= 25;
            }

            if (issue.created_at) {
                const created =
                    new Date(
                        issue.created_at
                    );

                const daysOld =
                    (
                        Date.now() -
                        created.getTime()
                    ) /
                    (1000 * 60 * 60 * 24);

                if (daysOld <= 7) {
                    score += 15;
                } else if (daysOld <= 14) {
                    score += 10;
                } else if (daysOld <= 30) {
                    score += 5;
                }
            }

            const MAX_SCORE = 115;

            const matchScore = Math.max(
                0,
                Math.min(
                    100,
                    (score / MAX_SCORE) * 100
                )
            );

            return {
                ...issue,
                relevanceScore: Math.round(matchScore),
                matchedSkills: matchedSkills.length
                    ? matchedSkills
                    : issue.matchedSkills || [],
            };
        })
        .sort(
            (a, b) =>
                b.relevanceScore -
                a.relevanceScore
        );
};
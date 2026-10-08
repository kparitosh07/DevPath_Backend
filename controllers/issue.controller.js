import { searchRelevantIssues, } from "../services/github/issue.service.js";

export const getRecommendedIssues = async (req, res) => {
    try {
        const issues = await searchRelevantIssues(req.user.userId);

        return res.status(200).json({
            success: true,
            message: "Relevant issues fetched successfully",
            data: {
                count: issues.length,
                issues,
            },
        });

    } catch (error) {
        console.error("Issue recommendation error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch issues",
        });
    }
};
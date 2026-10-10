import axios from "axios";

const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://localhost:8000";


export const analyzeRepository = async (repositoryData) => {
    try {
        const response = await axios.post(
            `${ML_SERVICE_URL}/ml/analyze-repository`,
            repositoryData,
            {
                timeout: 120000,
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "ML repository analysis error:",
            error.response?.data || error.message
        );

        throw new Error("ML service unavailable");
    }
};


export const analyzeProfile = async (userId, repositories) => {
    try {
        const response = await axios.post(
            `${ML_SERVICE_URL}/ml/analyze-profile`,
            {
                userId,
                repositories,
            },
            {
                timeout: 120000,
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "ML profile analysis error:",
            error.response?.data || error.message
        );

        throw new Error("ML service unavailable");
    }
};


export const getMLIssueRecommendations = async (payload) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/ml/recommend`,
      payload,
      {
        timeout: 180000,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "ML issue recommendation error:",
      error.response?.data || error.message
    );

    throw new Error("ML issue recommendation service unavailable");
  }
};
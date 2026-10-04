import express from "express";

import {getProfile,getRepositories,getRepositoryAnalysisData,syncRepositories} from "../controllers/github.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);

router.get("/repositories", authMiddleware, getRepositories);

router.get("/repositories/:owner/:repo/analysis-data",authMiddleware, getRepositoryAnalysisData); 

router.post("/repositories/sync",authMiddleware,syncRepositories);

export default router;
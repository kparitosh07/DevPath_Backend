import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {getRecommendedIssues,} from "../controllers/issue.controller.js";

const router = express.Router();
router.get("/recommended",authMiddleware,getRecommendedIssues);
export default router;

import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";

import {
  getContributions,
  saveContribution,
  updateContributionStatus,
  deleteContribution,
} from "../controllers/contribution.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getContributions);
router.post("/", saveContribution);
router.patch("/:id/status", updateContributionStatus);
router.delete("/:id", deleteContribution);

export default router;

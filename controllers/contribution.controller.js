
import Contribution from "../models/contribution.model.js";

const validStatuses = [
  "saved",
  "working",
  "pr_submitted",
  "merged",
];

export const getContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({
      user: req.user.userId,
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { contributions },
    });
  } catch (error) {
    console.error("Get contributions:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load contributions",
    });
  }
};

export const saveContribution = async (req, res) => {
  try {
    const {
      githubId,
      repositoryFullName,
      title,
      description,
      url,
      labels = [],
      matchedSkills = [],
    } = req.body;

    if (
      !Number.isSafeInteger(Number(githubId)) ||
      !repositoryFullName ||
      !title ||
      !url
    ) {
      return res.status(400).json({
        success: false,
        message: "githubId, repositoryFullName, title, and url are required",
      });
    }

    const contribution = await Contribution.findOneAndUpdate(
      {
        user: req.user.userId,
        githubId: Number(githubId),
      },
      {
        $setOnInsert: {
          user: req.user.userId,
          githubId: Number(githubId),
          repositoryFullName,
          title,
          description,
          url,
          labels,
          matchedSkills,
          status: "saved",
          statusHistory: [
            { status: "saved", changedAt: new Date() },
          ],
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { contribution },
    });
  } catch (error) {
    console.error("Save contribution:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to save contribution",
    });
  }
};

export const updateContributionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contribution status",
      });
    }

    const contribution = await Contribution.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found",
      });
    }

    res.json({
      success: true,
      data: { contribution },
    });
  } catch (error) {
    console.error("Update contribution:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update contribution",
    });
  }
};

export const deleteContribution = async (req, res) => {
  try {
    const deleted = await Contribution.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found",
      });
    }

    res.json({ success: true, message: "Contribution removed" });
  } catch (error) {
    console.error("Delete contribution:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to remove contribution",
    });
  }
};

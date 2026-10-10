import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    githubId: {
      type: Number,
      required: true,
    },

    repositoryFullName: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    url: {
      type: String,
      required: true,
    },

    labels: {
      type: [String],
      default: [],
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["saved", "working", "pr_submitted", "merged"],
      default: "saved",
    },

    notes: {
      type: String,
      default: "",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: ["saved", "working", "pr_submitted", "merged"],
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

contributionSchema.index(
  { user: 1, githubId: 1 },
  { unique: true }
);

export default mongoose.model("Contribution", contributionSchema);

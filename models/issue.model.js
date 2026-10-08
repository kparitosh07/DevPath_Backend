import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
    {
        githubId: {
            type: Number,
            required: true,
            unique: true,
            index: true,
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

        state: {
            type: String,
            default: "open",
        },

        labels: {
            type: [String],
            default: [],
        },

        language: {
            type: String,
            default: "",
        },

        author: {
            username: {
                type: String,
                default: "",
            },
            avatar: {
                type: String,
                default: "",
            },
        },

        createdAtGithub: {
            type: Date,
            required: true,
        },

        updatedAtGithub: {
            type: Date,
            required: true,
        },

        comments: {
            type: Number,
            default: 0,
        },

        relevanceScore: {
            type: Number,
            default: 0,
        },

        matchedSkills: {
            type: [String],
            default: [],
        },

        lastSyncedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
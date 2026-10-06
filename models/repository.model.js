import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
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

        name: {
            type: String,
            required: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        owner: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        url: {
            type: String,
            default: "",
        },

        defaultBranch: {
            type: String,
            default: "main",
        },

        stars: {
            type: Number,
            default: 0,
        },

        forks: {
            type: Number,
            default: 0,
        },

        openIssues: {
            type: Number,
            default: 0,
        },

        languages: {
            type: Map,
            of: Number,
            default: {},
        },

        topics: {
            type: [String],
            default: [],
        },

        readme: {
            type: String,
            default: null,
        },

        dependencies: {
            packageJson: {
                type: [
                    {
                        path: String,
                        data: mongoose.Schema.Types.Mixed,
                    },
                ],
                default: [],
            },

            requirementsTxt: {
                type: [
                    {
                        path: String,
                        content: String,
                    },
                ],
                default: [],
            },

            pyprojectToml: {
                type: [
                    {
                        path: String,
                        content: String,
                    },
                ],
                default: [],
            },
        },

        lastSyncedAt: {
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

repositorySchema.index(
    {
        user: 1,
        githubId: 1,
    },
    {
        unique: true,
    }
);

const Repository = mongoose.model("Repository", repositorySchema);

export default Repository;
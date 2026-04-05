import mongoose, {Schema} from "mongoose";

const MatchSchema = new Schema(
    {
        sport:{
            type: String,
            required: true,
        },

        homeTeam: {
            type: String,
            required: true,
        },

        awayTeam: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["scheduled", "live", "finished"],
            default: "scheduled",
        },

        startTime: {
            type: Date,
            required: true,
        },

        endTime: {
            type: Date,
        },

        homeScore: {
            type: Number,
            default: 0,
            required: true,
        },

        awayScore: {
            type: Number,
            default: 0,
            required: true,
        },

    },
    {
        timestamps: true
    }
);

const CommentarySchema = new Schema(
    {
        matchId: {
            type: Schema.Types.ObjectId,
            reference: "Match",
            required: true,
        },

        minute: {
            type: Number,
            required: true,
        },

        sequence: {
            type: Number,
            required: true,
        },

        period: {
            type: String,
        },

        eventType: {
            type: String,
            required: true,
        },

        actor: {
            type: String,
            required: true,
        },

        team: {
            type: String,
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        metaData: {
            type: Schema.Types.Mixed,
        },

        tags: [String],

    },

    {
        timestamps: true,
    },
);

MatchSchema.index({ status: 1, startTime: 1 });
export const Match = mongoose.model("Match", MatchSchema);

CommentarySchema.index({ matchId: 1, sequence: 1 }, { unique: true });
export const Commentary = mongoose.model("Commentary", CommentarySchema);       

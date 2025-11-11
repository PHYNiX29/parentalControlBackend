import mongoose from "mongoose";

const dailySiteTimeSchema = new mongoose.Schema({
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    sites: [
        {
            domain: { type: String, required: true },
            lastActive: { type: Number, required: true },
            timeSpent: { type: Number, required: true, default: 0 },
        }
    ]
});

const analyticsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deviceId: { type: String, required: true },
    nsfwStats: {
        imagesBlocked: { type: Number, default: 0 },
        videosBlocked: { type: Number, default: 0 },
        isStopped: { type: Boolean, default: false },
        stoppedAt: { type: [Number], default: [] },
        tabs: { type: [String], default: [] },
    },
    siteTimes: [dailySiteTimeSchema], // History of site time per day
});

export const UserAnalytics = mongoose.model("UserAnalytics", analyticsSchema);

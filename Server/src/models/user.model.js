import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    devices: [
        {
            deviceId: { type: String, required: true },
            deviceName: { type: String, required: true },
            deviceType: { type: String, required: true },
            browserName: { type: String, required: true },  // Store browser info
            loginHistory: [{ type: Date, default: Date.now }] // Array of login timestamps
        }
    ]
});


export const User = mongoose.model("User", userSchema);

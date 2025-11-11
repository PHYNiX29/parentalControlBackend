import express from 'express';
import bodyParser from "body-parser";
// import { userRegistrationSchema } from '../schemas/user.schema.js';
import { User } from '../models/user.model.js';
import { UserAnalytics } from '../models/data.model.js';
// import sendMail from '../utils/email.js';
import dotenv from "dotenv";
import bcrypt from 'bcrypt';
import { generateJwtToken } from '../middleware/authMiddleware.js';
// import emailQueue from '../utils/email.js';
// import { logger } from '../../app.js';  // Adjust the path to app.js
// import axios from "axios";
import { authenticateToken } from '../middleware/authMiddleware.js';
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
const router = express.Router();
app.use(bodyParser.json());


// Test route
router.get("/abba", async (req, res) => {
    res.json("hahaha");
});

const signUpQue = [];
let signUpIsLocked = false;
let currentSignUp = [];

router.post('/signup', async (req, res) => {

    res.clearCookie("G_ENABLED_IDPS");
    const userReq = req.body
    console.log("request body: ", userReq.username,userReq.email,userReq.password);
    if (signUpIsLocked) {
            signUpQue.push(userReq);
    }
    else{
        signUpIsLocked = true;
        currentSignUp.push(userReq);
        const result = await signUp(userReq);
        res.json(result);
    }

    while (signUpQue.length > 0) {
        const next_data = signUpQue.shift();
        const result_qued = await signUp(next_data);
        res.json(result_qued);
    }

    signUpIsLocked = false;

    
    // console.log("request body: ", req.body);
    async function signUp(userData){
        try {
            const existingUser = await User.findOne({ username: userData.username, email: userData.email });
    
            if (Object.values(userData).includes("")) {
                return { err: "Fill all details" };
            }
    
            else if (existingUser) {
                return { err: 'Username already has an account associated with it, please login' };
            }
            
            else{
                console.log(userData);
                const hash = await bcrypt.hash(userData.password,10);
                const newUser = await User.create({
                    username: userData.username,
                    email: userData.email,
                    password: hash,
                });
    
                return { success: 'True' };
    
            }
    
        }
        catch (error) {
            console.error('Signup error:', error);
            res.status(400).json({ error: error.errors || 'Invalid data' });
        }
    }
});

router.post("/login", async (req, res) => {
    res.clearCookie("G_ENABLED_IDPS");

    try {
        const { userEmail, password, deviceName, browser } = req.body;
        console.log("Login Attempt:", { userEmail, password, deviceName, browser });

        if (!userEmail || !password || !deviceName || !browser) {
            console.log("Missing fields in login attempt");
            return res.json({ err: "Fill all details" });
        }

        const user = await User.findOne({ email:userEmail });

        if (!user) {
            console.log("User not found for email:", userEmail);
            return res.json({ err: "Invalid Details" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Password mismatch for user:", userEmail);
            return res.json({ err: "Invalid Details" });
        }

        // Generate JWT
        const accessToken = generateJwtToken({ _id: user.username });

        // Check if device already exists
        let existingDevice = user.devices.find(d => d.deviceName === deviceName && d.browserName === browser);

        if (existingDevice) {
            // If device exists, update login history
            existingDevice.loginHistory.push(new Date());
        } else {
            // If new device, generate a new device ID
            user.devices.push({
                deviceId: uuidv4(),
                deviceName,
                deviceType: "PC",  // Assuming it's a computer, change if needed
                browserName: browser,
                loginHistory: [new Date()]
            });
        }

        await user.save();

        // Return token and user ID
        res.json({ token: accessToken, userId: user._id });
    } catch (error) {
        console.error("Login Error:", error);
        res.json({ err: "Something went wrong" });
    }
});

router.get("/getData", authenticateToken, async (req, res) => {
    const userId = req.user._id;

    try {
        // Fetch user and their devices
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch all analytics entries for this user
        const analytics = await UserAnalytics.find({ userId }).sort({ date: -1 });

        res.json({
            user: {
                username: user.username,
                email: user.email,
                devices: user.devices,
            },
            analytics,
        });
    } catch (error) {
        console.error("Error fetching user analytics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/user/login', async (req, res) => {
    res.clearCookie("G_ENABLED_IDPS");

    try {
        // const zodCheck = userLoginSchema.parse(req.body);
        const userData = req.body;
        console.log(req.body)

        const user = await User.findOne({email:userData.email });
        // const team = await Team.findOne({ name: userData.teamName });


        
        // Empty field check
        if (Object.values(userData).includes("")) {
            return res.status(404).json({ err: "Fill all details" });
        }

        // No user or team found
        else if (!user) {
            return res.status(404).json({ err: "Invalid Details" });
        }

        else{

            bcrypt.compare(userData.password, user.password, (err, result) => {
                if (result) {
                    const accessToken = generateJwtToken({ _id: user._id });
                    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "lax" });
                    console.log("sab laga diya");
                    res.json({ success: true, message: 'Login successful. Please log in.' });
                } else {
                    console.error(err);
                    res.json({ err: "Invalid Details" });
                }
            });
        }

        // Password comparison
        
    } catch (error) {
        res.json({ err: "Invalid Details" });
    }
    
});


router.post("/datapost", async (req, res) => {
    try {
        const { userId, deviceId, nsfwStats, siteTimes } = req.body;

        if (!userId || !deviceId) {
            return res.status(400).json({ error: "Missing userId or deviceId" });
        }

        const today = new Date().toISOString().split("T")[0];

        let analytics = await UserAnalytics.findOne({ userId, deviceId });
        console.log(siteTimes)
        if (!analytics) {
            // Create a new analytics document
            analytics = new UserAnalytics({
                userId,
                deviceId,
                nsfwStats,
                siteTimes: [{
                    date: today,
                    sites: siteTimes,
                }],
            });
        } else {
            // Update NSFW stats
            analytics.nsfwStats.imagesBlocked += nsfwStats.imagesBlocked;
            analytics.nsfwStats.videosBlocked += nsfwStats.videosBlocked;
            analytics.nsfwStats.isStopped = nsfwStats.isStopped;
            analytics.nsfwStats.stoppedAt.push(...nsfwStats.stoppedAt);
            analytics.nsfwStats.tabs.push(...nsfwStats.tabs);

            // Check if today's siteTime already exists
            const todayEntry = analytics.siteTimes.find(entry => entry.date === today);

            if (todayEntry) {
                // Update existing site's timeSpent
                siteTimes.forEach((newSite) => {
                    const existingSite = todayEntry.sites.find(site => site.domain === newSite.domain);
                    if (existingSite) {
                        existingSite.timeSpent = newSite.timeSpent;
                        existingSite.lastActive = newSite.lastActive;
                    } else {
                        todayEntry.sites.push(newSite);
                    }
                });
            } else {
                // Push a new date entry
                analytics.siteTimes.push({
                    date: today,
                    sites: siteTimes,
                });
            }
        }

        await analytics.save();
        res.json({ success: true, message: "Analytics updated successfully" });
    } catch (error) {
        console.error("Error updating analytics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/checkAuth",authenticateToken, (req, res) => {
    console.log(req.user);
    res.status(200).json({ authenticated: true,role:req.user.role});
    const timestamp = new Date().toISOString();
    console.log(`Request from ${req.ip} on /checkAuth route at ${timestamp} on port ${req.socket.localPort}`);
    // logger.info(`Request from ${req.ip} on /checkAuth route at ${timestamp}`);
});

export default router;


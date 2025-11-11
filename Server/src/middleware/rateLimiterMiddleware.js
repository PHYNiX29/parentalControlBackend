import setRateLimit from "express-rate-limit";
import express from "express";
import { logger } from "../../app.js"
const app = express();
const rateLimiter = setRateLimit({
    windowMs:1*60*1000,
    max:30,
    statusCode:200,
    message:null,
    headers:true,
    handler:async(req,res,next)=>{
        res.redirect(307, "https://google.com");
	        const timestamp = new Date().toISOString(); // Get current timestam
	    	    logger.error(`IP  ${req.ip} has been ratelimited at ${timestamp}`);
	        console.log(`IP ${req.ip} has been ratelimited at ${timestamp} on port ${req.socket.localPort}`);
}});

export default rateLimiter;

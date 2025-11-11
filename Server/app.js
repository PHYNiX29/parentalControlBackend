import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoute from "./src/routes/authRoutes.js";
import connectDB from "./src/db/mongoose.js";
import rateLimiter from './src/middleware/rateLimiterMiddleware.js';
import mongoSanitize from 'express-mongo-sanitize';
import xss from "xss-clean";
import cors from "cors";
import client from "prom-client";

const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics({ register:client.register });
import { createLogger, transports } from "winston";
import LokiTransport from "winston-loki";

const options = {
  transports: [
    new LokiTransport({
      host: "http://35.154.199.137:3100"
    })
  ]
};
const logger = createLogger(options);
export { logger };

// const NUM_INSTANCES = 1;
// const START_PORT = 8000;

const app = express();
app.use(mongoSanitize());
app.use(xss());
app.use(cors(
   {
  origin:["http://localhost:5173","https://parental-control-frontend.vercel.app","https://parental-control-frontend-nine.vercel.app","https://parentalfrontend.backslashtiet.com"],
   methods:["POST","GET","PUT","DELETE","PATCH"],
   credentials: true // Allow cookies to be sent with the request
}
));
//
 app.set('trust proxy' ,20);
 app.get('/ip', (request, response) => response.send(request.ip));
 app.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']));
// app.use(rateLimiter)


//static files folders
connectDB();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
dotenv.config();

// app.use(express.static(__public));

app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));


app.use(authRoute);

app.get("/",(req,res)=>{
    const timestamp = new Date().toISOString(); // Get current timestam
	   // const ip = req.headers['x-forwarded-for'] || req.ip; 
//	console.log(ip);
    logger.info(`Req from ${req.ip} on / route at ${timestamp}`);
    console.log(`Req from ${req.ip} on / route at ${timestamp} on port ${req.socket.localPort}`);
    res.json({hi:"hi"});
})

app.get("/metrics",async(req,res)=>{
    res.setHeader("Content-Type",client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
})

// ------------------ SERVER STARTER ------------------
// ✅ Only start the server locally (not on Vercel)
if (process.env.VERCEL !== "1") {
  const NUM_INSTANCES = 1;
  const START_PORT = process.env.PORT || 8000;

  for (let i = 0; i < NUM_INSTANCES; i++) {
    const port = START_PORT + i;
    app.listen(port, () => {
      console.log(`Server running locally on http://localhost:${port}`);
    });
  }
}

// ✅ Export for Vercel serverless
export default app;



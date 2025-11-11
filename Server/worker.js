// worker.js
import emailQueue from "./src/utils/email.js";

console.log('Worker started');
emailQueue.process();

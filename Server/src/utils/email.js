import nodemailer from "nodemailer";
import Queue from "bull";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const emailQueue = new Queue('email', {
  redis: { port: 6379, host: '127.0.0.1' }
});

emailQueue.process(async (job) => {

  const templateFile = fs.readFileSync(__dirname+"/template.html","utf8")
  const { username, email } = job.data;


  const transporter = nodemailer.createTransport({
    service : "gmail",
    // host: 'smtp.thapar.edu', // Replace with SMTP server address
    // port: 465, // Replace with port number
    // secure: true,
    auth: { // Fixed the missing closing parenthesis here
      user : "backslash_sc@thapar.edu", //Add BCS Gmail ID
      pass: "bbwr dzyu dkpg byky" //BCS Gmail App password
    }
  });

  const mailOptions = {
    from:"backslash_sc@thapar.edu",
    to:email,
    subject : `Backslash Registered ${username}`,
    html: templateFile
  }

  try{
    const result = await transporter.sendMail(mailOptions);
    console.log("email sent successfully");
  }catch(err){
    console.log(err);
  }
});

export default emailQueue;
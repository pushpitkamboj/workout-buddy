import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { emailService } from '../utils/emailService';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies

// For testing only - remove in production
app.post("/test-email", async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log(`Sending test email to: ${email}`);

  try {
    await emailService.sendEmail({
      to: email,
      subject: "Email Test",
      html: "<h1>Email Service Test</h1><p>This is a test email to verify your configuration.</p>"
    });
    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send test email" });
  }
});
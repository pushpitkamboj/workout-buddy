import { Express, Request, Response } from "express";
import { Router } from "express";
import { emailService } from "../utils/emailService";
import crypto from "crypto";


const router = Router();

router.post("resend-email-verify", async (req: Request, res: Response) => {
try {
    console.log("Resending verification email");
    const email = req.body.email;

    const verifyEmailUrl = "http://localhost:3000/api/auth/verify-email";
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await emailService.sendVerificationEmail(email, verificationToken, verifyEmailUrl);

    res.json({ message: "Verification email resent successfully." });
} catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ message: "Failed to resend verification email" });
  }
});

export default router;
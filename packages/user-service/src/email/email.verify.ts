import { Express, Request, Response } from "express";
import { Router } from "express";
import { PrismaClient } from "@fitness-tracker2/shared";
import { emailService } from "../utils/emailService";
import crypto from "crypto";


const router = Router();
const prisma = new PrismaClient();

router.post("/testing", async (req: Request, res: Response) => {
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


router.get("/verify-email", async (req: Request, res: Response) => {
  const { token, email } = req.query;
  const user = await prisma.user.findUnique({ where: { email: String(email) } });
  if (!user || user.verificationToken !== token || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
    res.status(400).send("Invalid or expired verification link.");
    return;
  }

  await prisma.user.update({
    where: { email: String(email) },
    data: { isVerified: true, verificationToken: null, verificationTokenExpiry: null },
  });

  // Redirect to login page (frontend URL)
  res.redirect("/api/auth/login"); // Change to your frontend login page if needed
});


router.post("/resendEmail-verify", async (req: Request, res: Response) => {
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
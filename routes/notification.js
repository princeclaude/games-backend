
import express from "express";
import webpush from "web-push";
import User from "../models/User.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/subscribe", verifyToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ message: "No subscription provided" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      pushSubscription: subscription,
    });

    res.status(201).json({ message: "Push subscription saved successfully" });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    res.status(500).json({ message: "Failed to save subscription", error });
  }
});

export default router;

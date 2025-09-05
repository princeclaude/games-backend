import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/verifyToken.js";
import mongoose from "mongoose";

const router = express.Router();


router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); 
    if (!user) return res.status(404).json({message: "User not found" });

    res.json( user ); 
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error });
}
});



router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error });
}
});

// ✅ Get all users (public list)
router.get("/", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.Id;
    const users = await User.find({ _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } }).select("-password"); 
    console.log("current user exclude", currentUserId)
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
});

export default router;

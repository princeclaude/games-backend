import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { validateSignup, validateSignin } from "../middleware/validateRequest.js";
import { verifyToken } from "../middleware/verifyToken.js";
// import updateLastActive from "../middleware/updateLastActive.js";

const router = express.Router();


router.post("/signup", validateSignup, async (req, res) => {
  try {
    const { email, username, password } = req.body;

    
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    
   const saltRounds = 10;
   const hashedPassword = await bcrypt.hash(password, saltRounds);

   const newUser = new User({
     email,
     username,
     password: hashedPassword,
   });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

router.post("/signin", validateSignin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "No user found!" })
    }
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credential" })
    }
    user.online = true
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({
      id: user._id, email: user.email, username: user.username
    },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "1d" }
    )
    res.status(200).json({
      message: "Signed in successfully!",
      token,
      user: {
        id: user._id,
        profileImage: user.profileImage,
        username: user.username,
        email: user.email,
        star: user.star,
        online: user.online,
        isplaying: user.isplaying,
        lastLogin: user.lastLogin,
        
        
      },
      
    });

    
  } catch (error) {
    res.status(500).json({ message: "Error Signing in", error })
  }
});

router.post("/logout", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.online = false;
    await user.save();

    res.status(200).json({ message: "Logged out and set offline" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error });
  }
});






export default router;

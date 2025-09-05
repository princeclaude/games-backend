import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // 🔑 Look up user in DB to get username
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.userId = user._id;
    req.user = {
      id: user._id,
      username: user.username, // ✅ now available in your routes
      email: user.email,
    };

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(400).json({ message: "Invalid Token" });
  }
};

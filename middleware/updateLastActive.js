
import User from "../models/User.js";

const updateLastActive = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, { lastActive: Date.now() });
    }
  } catch (error) {
    console.error("Error updating lastActive:", error);
  }
  next();
};

export default updateLastActive;

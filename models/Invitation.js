
import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
  from: { type: String, required: true }, 
  to: { type: String, required: true }, 
  gameName: { type: String, required: true },
  type: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
    createdAt: { type: Date, default: Date.now },
  expiresAt: {type: Date, required: true},
});

export default mongoose.model("Invitation", invitationSchema);

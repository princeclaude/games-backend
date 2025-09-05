import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import { sendPushNotification } from "../utils/sendPushNotification.js";
import { io } from "../index.js";

const router = express.Router();

// ✅ Send an invite
router.post("/", verifyToken, async (req, res) => {
  try {
    const { toUsername, gameName, type } = req.body;
    const fromUsername = req.user.username; // ✅ now always set by verifyToken

    console.log("Invite request:", { fromUsername, toUsername, gameName, type });

    
    const invitedUser = await User.findOne({
      username: toUsername.toLowerCase(),
    });

    if (!invitedUser) {
      console.warn(`User "${toUsername}" not found`);
      return res.status(404).json({ message: "Invited user not found" });
    }

    //  Create invitation with expiry
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const invitation = await Invitation.create({
      from: fromUsername,
      to: invitedUser.username, // ✅ use canonical username from DB
      gameName,
      type,
      status: "pending",
      expiresAt: expiryTime,
    });

    console.log("Invitation created:", invitation._id);

    // ⿣ Emit real-time event to invited user
    io.to(invitedUser.username).emit("new-invite", {
      from: fromUsername,
      gameName,
      type,
    });

    // ⿤ Send push notification if subscribed
    if (invitedUser.PushSubscription) {
      await sendPushNotification(
        invitedUser.PushSubscription,
        "🎮 New Game Invite",
        `${fromUsername} invited you to play ${gameName}`
      );
    }

    return res.status(201).json({
      message: "Invitation sent successfully",
      data: invitation,
    });
  } catch (error) {
    console.error("Error sending invite:", error);
    return res.status(500).json({
      message: "Error sending invite",
      error: error.message,
    });
  }
});

// ✅ Get all pending invites for logged-in user
// ✅ Get all pending invites for logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("Fetching pending invites for:", req.user.username);

    const pendingInvites = await Invitation.find({
      to: req.user.username,
      status: "pending",
      expiresAt: { $gt: new Date() }, // only non-expired invites
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Pending invites fetched successfully",
      data: pendingInvites,
    });
  } catch (error) {
    console.error(" Error fetching invites:", error);
    return res.status(500).json({
      message: "Error fetching invites",
      error: error.message,
});
}
});
// ✅ Accept invite
router.post("/accept", verifyToken, async (req, res) => {
  try {
    const { invitationId } = req.body;
    const username = req.user.username;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation)
      return res.status(404).json({ message: "Invitation not found" });

    if (invitation.expiresAt < new Date() || invitation.status !== "pending") {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation has expired" });
    }

    invitation.status = "accepted";
    await invitation.save();

    io.to(invitation.from).emit("invite-accepted", {
      by: username,
      gameName: invitation.gameName,
      roomId: `lobby_${invitation._id}`,
    });

    return res.status(200).json({
      message: "Invitation accepted",
      data: invitation,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({
      message: "Error accepting invitation",
      error: error.message,
    });
  }
});



// ✅ Decline invite
router.post("/decline", verifyToken, async (req, res) => {
  try {
    const { invitationId } = req.body;
    const username = req.user.username;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation)
      return res.status(404).json({ message: "Invitation not found" });

    if (invitation.expiresAt < new Date() || invitation.status !== "pending") {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation has already expired" });
    }

    invitation.status = "declined";
    await invitation.save();

    io.to(invitation.from).emit("invite-accepted", {
      by: username,
      gameName: invitation.gameName,
      invitationId: invitation._id,
    });

    return res.status(200).json({
      message: "Invitation declined successfully",
      data: invitation,
    });
  } catch (error) {
    console.error("🔥 Error declining invitation:", error);
    return res.status(500).json({
      message: "Error declining invitation",
      error: error.message,
    });
  }
});

export default router;
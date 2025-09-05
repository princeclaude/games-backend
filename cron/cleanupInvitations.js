
import cron from "node-cron";
import Invitation from "../models/Invitation.js";

export const startInvitationCleanupJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const expiredInvites = await Invitation.updateMany(
        { status: "pending", expiresAt: { $lt: now } },
        { $set: { status: "expired" } }
      );

      if (expiredInvites.modifiedCount > 0) {
        console.log(`Cleaned up ${expiredInvites.modifiedCount} expired invitations`);
      }
    } catch (error) {
      console.error("Error cleaning up expired invitations:", error);
    }
  });

  console.log("✅ Invitation cleanup cron job started (runs every minute)");
};

import webpush from "web-push";
import User from "../models/User.js";

export const sendPushNotification = async (username, payload) => {
  try {
    const user = await User.findOne({ username });
    if (user?.pushSubscription) {
      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify(payload)
      );
    }
  } catch (error) {
    console.error("Push notification error:", error);
  }
};

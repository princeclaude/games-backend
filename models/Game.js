import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    gameName: { type: String, required: true },
    players: [
      {
        username: { type: String, required: true },
        profileImage: { type: String, default: "" }, // optional
        star: { type: String, default: "Debutant" }, // ⭐ Default rank
      },
    ],
    scores: [
      {
        username: { type: String, required: true },
        score: { type: Number, required: true },
      },
    ],
    winner: { type: String, default: null },
    duration: { type: Number, default: 0 }, // in seconds
    type: { type: String, enum: ["ranked", "casual", "pro"], default: "casual" },
    status: {
      type: String,
      enum: ["completed", "ongoing", "canceled"],
      default: "completed",
    },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);

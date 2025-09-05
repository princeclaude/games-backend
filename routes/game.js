// routes/game.js
import express from "express";
import Game from "../models/Game.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();


router.get("/recently-played", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    
    const games = await Game.find({ players: userId })
      .sort({ playedAt: -1 }) 
      .populate("players", "profileImage username star online isplaying");

    if (!games || games.length === 0) {
      return res
        .status(200)
        .json({ message: "No recently played games", data: [] });
    }

    
    const recentlyPlayedWith = [];
    const seen = new Set();

    games.forEach((game) => {
      game.players.forEach((player) => {
        if (
          player._id.toString() !== userId &&
          !seen.has(player._id.toString())
        ) {
          recentlyPlayedWith.push(player);
          seen.add(player._id.toString());
        }
      });
    });

    res
      .status(200)
      .json({ message: "Recently played users", data: recentlyPlayedWith });
  } catch (error) {
    console.error("Error fetching recently played users:", error);
    res
      .status(500)
      .json({ message: "Error fetching recently played users", error });
  }
});

router.post("/history", verifyToken, async (req, res) => {
  try {
    const { gameName, players, winner, scores, duration, type, status } =
      req.body;

    // Validate required fields
    if (!gameName || !players || players.length < 2) {
      return res
        .status(400)
        .json({ message: "Game name and at least 2 players are required." });
    }

    
    const foundPlayers = await User.find({ username: { $in: players } });

    if (foundPlayers.length !== players.length) {
      return res.status(404).json({
        message: "Some players not found. Ensure usernames are correct.",
      });
    }

    const winnerUser = winner ? await User.findOne({ username: winner }) : null;

    const newGame = new Game({
      gameName,
      players: foundPlayers.map((p) => p._id),
      winner: winnerUser ? winnerUser._id : null,
      scores,
      duration,
      type,
      status,
    });

    const savedGame = await newGame.save();

    res.status(201).json({
      message: "Game history created successfully",
      data: savedGame,
    });
  } catch (error) {
    console.error("Error creating game history:", error);
    res.status(500).json({ message: "Error creating game history", error });
  }
});



router.get("/history/:otherUserId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const games = await Game.find({
      players: { $all: [userId, otherUserId] },
    })
      .sort({ playedAt: -1 })
      .populate("players", "username profileImage")
      .populate("winner", "username profileImage");

    if (!games || games.length === 0) {
      return res.status(200).json({
        message: "No game history found with this user",
        data: [],
      });
    }

    const formattedGames = games.map((game) => ({
      gameName: game.gameName,
      type: game.type,
      status: game.status,
      duration: game.duration,
      playedAt: game.playedAt,
      winner: game.winner
        ? {
            id: game.winner._id,
            username: game.winner.username,
            profileImage: game.winner.profileImage,
          }
        : null,
      scores: game.scores.map((s) => ({
        player: s.player,
        score: s.score,
      })),
    }));

    res.status(200).json({
      message: "Game history fetched successfully",
      data: formattedGames,
    });
  } catch (error) {
    console.error("Error fetching game history:", error);
    res.status(500).json({ message: "Error fetching game history", error });
  }
});

export default router;

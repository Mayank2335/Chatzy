import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId,
    })
      .populate("participants", "username email avatar lastSeen")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    if (recipientId === req.user.userId) {
      return res.status(400).json({ message: "Cannot start chat with yourself" });
    }

    const recipientExists = await User.exists({ _id: recipientId });
    if (!recipientExists) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, recipientId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    }).populate("participants", "username email avatar lastSeen");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.userId, recipientId],
      });

      conversation = await conversation.populate(
        "participants",
        "username email avatar lastSeen"
      );
    }

    const recentMessages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username avatar")
      .populate("recipient", "username avatar")
      .lean();

    res.status(201).json({
      conversation,
      messages: recentMessages.reverse(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to start conversation" });
  }
});

router.get("/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (
      !conversation ||
      !conversation.participants.some((p) => p.toString() === req.user.userId)
    ) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "username avatar")
      .populate("recipient", "username avatar");

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

export default router;


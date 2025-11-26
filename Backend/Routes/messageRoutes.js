import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", async (req, res) => {
  try {
    const { conversationId, text, mediaUrl, mediaType = "text" } = req.body;

    if (!conversationId || (!text && !mediaUrl)) {
      return res.status(400).json({ message: "Missing message content" });
    }

    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "_id"
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p._id.equals(req.user.userId))) {
      return res.status(403).json({ message: "Not part of this conversation" });
    }

    const recipient = conversation.participants.find(
      (p) => !p._id.equals(req.user.userId)
    );
    const recipientId = recipient?._id?.toString();

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.userId,
      recipient: recipient?._id,
      text,
      mediaUrl,
      mediaType,
      status: "sent",
    });

    const populatedMessage = await message
      .populate("sender", "username avatar")
      .populate("recipient", "username avatar");

    conversation.lastMessage = {
      text: text || "Photo",
      mediaType,
      mediaUrl,
      sender: req.user.userId,
      createdAt: populatedMessage.createdAt,
    };
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      io.to(conversationId.toString()).emit("newMessage", populatedMessage);
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("conversationUpdated", {
          conversationId,
          lastMessage: conversation.lastMessage,
        });
      }
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;


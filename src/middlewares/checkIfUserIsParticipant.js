import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";

const checkIfUserIsParticipant = asyncHandler(async (req, res, next) => {
  const chatId = req.body?.chatId || req.params.chatId;

  if (!chatId)
    return res.status(400).json({ message: "'chat ID' is required!" });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat)
      return res
        .status(404)
        .json({ message: `Chat with id ${chatId} not found!` });

    if (!chat.users.includes(req.user._id.toString()))
      return res
        .status(403)
        .json({ message: "You are not a participant of this chat!" });

    next();
  } catch (error) {
    next(error);
  }
});

export default checkIfUserIsParticipant;

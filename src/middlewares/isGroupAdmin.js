import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";

export const verifyWithoutChatId = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const chats = await Chat.find({
    users: { $elemMatch: { $eq: userId } },
    isGroupChat: true,
  }).exec();

  if (!chats || chats.length === 0)
    return res.status(400).json({
      message: "Group chats not found!.",
    });

  const isAdmin = chats.some((chat) =>
    chat.groupAdmins.some((admin) => admin._id.toString() === userId.toString())
  );

  const isUserInChat = chats.some((chat) => chat.users.includes(req.user._id));

  if (!isUserInChat)
    return res.status(403).json({
      message: "You are not in this chat group to perform this action.",
    });

  if (!isAdmin)
    return res
      .status(403)
      .json({ message: "Only the group admin can perform this action." });

  next();
});

export const verifyWithChatId = asyncHandler(async (req, res, next) => {
  const { chatId } = req.body;

  if (!chatId)
    return res.status(400).json({ message: "'chatId' is required." });

  const chat = await Chat.findById(chatId)
    .populate(
      "groupAdmins",
      "-roles -password -refreshToken -createdAt -updatedAt -__v"
    )
    .exec();

  if (!chat || chat.isGroup === false)
    return res.status(chat ? 400 : 404).json({
      message: chat
        ? `Chat with chat ID: ${chatId} is not a group chat.`
        : `Chat not found with chat ID: ${chatId}`,
    });

  const isAdmin = chat.groupAdmins.some(
    (admin) => admin._id.toString() === req.user._id.toString()
  );

  if (!chat.groupAdmins || !isAdmin)
    return res
      .status(403)
      .json({ message: "Only the group admin can perform this action." });

  next();
});

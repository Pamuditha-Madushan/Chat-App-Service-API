import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";

const allMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId)
    return res
      .status(400)
      .json({ message: "'chat ID' parameter not sent with the request." });

  try {
    const messages = await Message.find({ chat: chatId })
      .select("-__v")
      .populate("sender", "name pics email")
      .populate("chat", "-__v")
      .exec();

    if (!messages || messages.length === 0)
      return res.status(404).json({
        message: `No messages found for this chat of "chat ID": ${chatId}`,
      });

    res.status(200).json({
      message: `All messages fetched successfully.`,
      data: messages,
    });
  } catch (error) {
    next(new Error("An unexpected error occurred while fetching messages"));
  }
});

const sendMessage = asyncHandler(async (req, res, next) => {
  const { chatId, content } = req.body;

  if (!chatId || !content) {
    return res
      .status(400)
      .json({ message: "Please provide both chat ID and content!" });
  }

  let newMessage = {
    sender: req.user._id,
    chat: chatId,
    content: content,
  };

  try {
    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name pics");
    message = await message.populate("chat", "-__v");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json(message);
  } catch (error) {
    next(new Error("Failed to send the message. Please try again."), error);
  }
});

const markMessageAsRead = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.body;

  if (!chatId || !messageId)
    return res
      .status(400)
      .json({ message: "Both 'chat ID' and 'message Id' are required!" });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat)
      return res
        .status(404)
        .json({ message: `Chat for 'chat ID': ${chatId} not found!` });

    const message = await Message.findById(messageId).exec();

    if (!message)
      return res
        .status(404)
        .json({ message: `Message for 'message ID': ${messageId} not found!` });

    // const readTime = new Date();

    if (!message.readBy) message.readBy = [];
    // if (!message.readTimes) message.readTimes = [];

    if (req.user._id === message.sender.toString())
      return res
        .status(400)
        .json({ message: "You cannot mark your own message as read!" });

    if (
      !message.readBy.includes(req.user._id) &&
      req.user._id !== message.sender.toString()
    ) {
      message.readBy.push(req.user._id);

      // message.readTimes.push({
      //   user: req.user._id,
      //   readTime,
      // });
    }

    const updatedMessage = await message.save();

    if (req.user._id !== updatedMessage.sender.toString())
      updatedMessage.readBy = undefined;

    return res.status(200).json({
      message: "Message marked as read",
      updatedMessageId: updatedMessage._id,
      chatId: updatedMessage.chat,
      sender: updatedMessage.sender,
    });
  } catch (error) {
    next(error);
  }
});

const getMessageReadByList = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  if (!messageId)
    return res.status(400).json({ message: "'Message Id' is required!" });

  try {
    const message = await Message.findById(messageId).exec();

    if (!message)
      return res
        .status(404)
        .json({ message: `Message for 'message ID': ${messageId} not found!` });

    res.status(200).json({
      message: "ReadBy list fetched successfully",
      "readBy List": message.readBy,
    });
  } catch (error) {
    next(error);
  }
});

const pinMessage = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.body;

  if (!chatId || !messageId)
    return res
      .status(400)
      .json({ message: "'chat ID' and 'message Id' are required!" });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat)
      return res
        .status(404)
        .json({ message: `Chat for 'chat ID': ${chatId} not found!` });

    const pinnedMessage = await Message.findByIdAndUpdate(
      messageId,
      { pinned: true },
      { new: true }
    ).exec();

    if (!pinnedMessage)
      return res
        .status(404)
        .json({ message: `Message for 'message ID': ${messageId} not found!` });

    res.status(200).json({
      message: "Message pinned successfully.",
      pinnedMessage: {
        "pinned Message Id": pinnedMessage._id,
        sender: pinnedMessage.sender,
        "pinned Message content": pinnedMessage.content,
        "chat Id": pinnedMessage.chat,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getAllPinnedMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId)
    return res.status(400).json({ message: "'chat ID' is required!" });

  try {
    const pinnedMessages = await Message.find({ chat: chatId, pinned: true })
      .select("-readBy -__v")
      .populate("sender", "name pics email")
      .populate("chat", "chatName")
      .exec();

    if (!pinnedMessages || pinnedMessages.length === 0)
      return res.status(404).json({
        message: `No pinned messages found for this chat of "chat ID": ${chatId}`,
      });

    res.status(200).json({
      message: `All pinned messages fetched successfully.`,
      data: pinnedMessages,
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
});

const removeMessage = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params;

  if (!chatId || !messageId)
    return res
      .status(400)
      .json({ message: "Both 'chat ID' and 'message ID' are required!" });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat)
      return res
        .status(404)
        .json({ message: `Chat for 'chat ID': ${chatId} not found!` });

    const message = await Message.findByIdAndDelete(messageId).exec();

    if (!message)
      return res
        .status(404)
        .json({ message: `Message for 'message ID': ${messageId} not found!` });

    res.status(200).json({
      message: `Message of 'message ID': ${messageId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

export {
  allMessages,
  sendMessage,
  markMessageAsRead,
  getMessageReadByList,
  pinMessage,
  getAllPinnedMessages,
  removeMessage,
};

import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";

const checkIfSender = asyncHandler(async (req, res, next) => {
  const messageId = req.params?.messageId || req.body.messageId;

  try {
    const message = await Message.findById(messageId).exec();

    if (!message)
      return res
        .status(404)
        .json({ message: `Message for 'message ID': ${messageId} not found!` });

    if (req.user._id !== message.sender.toString())
      return res
        .status(403)
        .json({ message: "You are not authorized to perform this action!" });
    next();
  } catch (error) {
    next(error);
  }
});

export default checkIfSender;

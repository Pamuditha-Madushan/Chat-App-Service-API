import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import CustomError from "../utils/customError.js";

const accessChat = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(400).json({ message: "'User ID' is required!." });

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .select("-createdAt -updatedAt -__v")
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate("latestMessage");

    if (req.user._id === userId)
      return res
        .status(400)
        .json({ message: "You cannot start a chat with yourself." });

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    if (isChat.length > 0) {
      res.status(403).json({
        message: `Default chat is already exists between ${req.user._id} and ${userId}`,
        data: isChat[0],
      });
    } else {
      let chatData = {
        chatName: "default chat",
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const entireChat = await Chat.findOne({ _id: createdChat._id })
        .populate("-roles -password -refreshToken -createdAt -updatedAt -__v")
        .exec();
      res.status(200).json(entireChat);
    }
  } catch (error) {
    next(error);
  }
});

const fetchChats = asyncHandler(async (req, res, next) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .select("-__v")
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate(
        "groupAdmins",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate("latestMessage", "-__v")
      .sort({ updatedAt: -1 });

    if (!chats || chats.length === 0)
      return res.status(404).json({ message: "No chats found!" });

    const populatedChats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).json(populatedChats);
  } catch (error) {
    next(error);
  }
});

const createGroupChat = asyncHandler(async (req, res, next) => {
  const { users: usersField, name } = req.body;

  if (!usersField || !name)
    return res
      .status(400)
      .json({ message: "Please fill all the required fields!" });

  let users;

  try {
    users =
      typeof usersField === "string" ? JSON.parse(usersField) : usersField;

    if (!Array.isArray(users))
      return res.status(400).json({ message: "Users must be an array!" });

    if (users.length < 2)
      return res.status(400).json({
        message: "More than 2 users are required to form a group chat!",
      });

    if (!users.includes(req.user._id)) users.push(req.user._id);
  } catch (error) {
    return next(
      new CustomError(
        "Invalid 'users' field. It must be a valid JSON array.",
        400
      )
    );
  }

  const groupAdmins = [req.user._id];

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      isGroupChat: true,
      users: [...users],
      groupAdmins,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .select("-__v")
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate(
        "groupAdmins",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .exec();

    res.status(201).json(fullGroupChat);
  } catch (error) {
    if (error.statusCode === 409)
      return res.status(409).json({ message: error.message });
    next(error);
  }
});

const renameChat = asyncHandler(async (req, res, next) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !chatName)
    return res
      .status(400)
      .json({ message: "Both 'chatId' and 'chatName' are required." });

  try {
    const chat = await Chat.findById(chatId)
      .select("-__v")
      .populate(
        "groupAdmins",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat.`
          : `Chat not found with chat ID: ${chatId}`,
      });

    const isUserExistsInChat = chat.users.some(
      (user) => user._id.toString() === req.user._id.toString()
    );

    if (!isUserExistsInChat)
      return res.status(404).json({
        message: `"Chat ID of: ${chatId} is not exists in this chat!`,
      });

    if (chat.isGroupChat) {
      if (chat.groupAdmins._id.toString() !== req.user._id)
        return res.status(403).json({
          message: "Only a 'group admin' can rename the group chat! ",
        });
    }

    if (chatName === chat.chatName)
      return res.status(400).json({
        message: `The chat name is already '${chatName}', so no update needed.`,
      });

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true, runValidators: true }
    )
      .select("-createdAt -__v")
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate(
        "groupAdmins",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .exec();

    if (!updatedChat)
      return res.status(404).json({ message: "Failed to update the chat!" });

    res.status(200).json({
      chatId: updatedChat._id,
      chatName: updatedChat.chatName,
      message: "Chat name updated successfully.",
    });
  } catch (error) {
    if (error.name === "ValidationError")
      return next(new CustomError(`Invalid data: ${error.message}`));
    next(error);
  }
});

const addUserToGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId)
    return res
      .status(400)
      .json({ message: "Both 'chatId' and 'user ID' are required." });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat.`
          : `Chat not found with chat ID: ${chatId}`,
      });

    if (chat.users.includes(userId))
      return res.status(403).json({
        message: `User of "user ID": ${userId} is already in the group chat!`,
      });

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate(
        "groupAdmins",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .exec();

    if (!updatedChat)
      return res.status(404).json({ message: "Failed to update the chat." });
    res.status(200).json({
      chatId: updatedChat._id,
      userId: updatedChat.users._id,
      message: "New user added to the chat group successfully.",
    });
  } catch (error) {
    next(error);
  }
});

const removeUserFromGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId)
    return res
      .status(400)
      .json({ message: "Both 'chat ID' and 'user ID' are required." });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat.`
          : `Chat not found with chat ID: ${chatId}`,
      });

    if (!chat.users.includes(userId))
      return res.status(403).json({
        message: `User of "userId": ${userId}  is not a member of this group chat!`,
      });

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "users",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      )
      .populate(
        "groupAdmins",
        "-roles -password -refreshToken -createdAt -updatedAt -__v"
      );

    if (!updatedChat)
      return res.status(404).json({
        message: "Failed to update the chat or user was not removed.",
      });
    res
      .status(200)
      .json({ message: "User removed from chat group successfully." });
  } catch (error) {
    next(error);
  }
});

const addAdminToGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId)
    return res
      .status(400)
      .json({ message: "Both 'chatId' and 'user ID' are required." });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat.`
          : `Chat not found with chat ID: ${chatId}`,
      });

    if (chat.groupAdmins.includes(userId))
      return res.status(400).json({
        message: `User of "userId": ${userId}  is already a group admin!`,
      });

    if (!chat.users.includes(userId))
      return res.status(403).json({
        message: `User of "userId": ${userId}  is not a member of this group chat!`,
      });

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { groupAdmins: userId } },
      { new: true, runValidators: true }
    ).exec();

    res.status(200).json({
      message: `User of "user ID": ${userId} added as a group admin of the group chat of "chat ID": ${chatId}.`,
      data: updatedChat,
    });
  } catch (error) {
    next(error);
  }
});

const removeAdminFromGroup = asyncHandler(async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId)
    return res
      .status(400)
      .json({ message: "Both 'chatId' and 'user ID' are required." });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat!`
          : `Chat not found with chat ID: ${chatId}`,
      });

    if (userId.toString() === req.user._id.toString())
      return res.status(403).json({
        message:
          "A group admin is not permitted to remove themselves from the group admin position!",
      });

    if (!chat.groupAdmins.includes(userId))
      return res.status(400).json({
        message: `User of "userId": ${userId}  is not a group admin of this group chat!`,
      });

    if (!chat.users.includes(userId))
      return res.status(403).json({
        message: `User of "userId": ${userId}  is not a member of this group chat!`,
      });

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { groupAdmins: userId } },
      { new: true, runValidators: true }
    ).exec();

    res.status(200).json({
      message: `User of "user ID": ${userId} removed from group admin of group chat of "chat ID": ${chatId}.`,
    });
  } catch (error) {
    next(error);
  }
});

const leaveGroupChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.body;
  const userId = req.user._id;

  if (!chatId)
    return res.status(400).json({ message: "'chatId' is required." });

  try {
    const chat = await Chat.findById(chatId).exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat!`
          : `Chat not found with chat ID: ${chatId}`,
      });

    const isAdmin = chat.groupAdmins.includes(userId);
    const isSingleUser = chat.users.length === 1;
    const isOnlyAdmin = chat.groupAdmins.length === 1;

    if (isAdmin) {
      if (isSingleUser) {
        await Chat.findByIdAndDelete(chatId).exec();
        return res.status(200).json({
          message:
            "You were the last member and you left the group chat and the group chat has been deleted!",
        });
      }

      if (isOnlyAdmin)
        return res.status(400).json({
          message:
            "You cannot leave the group as the only group admin. Please transfer group admin rights to another user before leaving!",
        });

      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { users: userId, groupAdmins: userId } },
        { new: true, runValidators: true }
      ).exec();
      res.status(200).json({
        message: "You have left this group chat as a group admin",
        chatId: chatId,
      });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true, runValidators: true }
    ).exec();
    res.status(200).json({
      message: "You have left this group chat",
      chatId: chatId,
    });
  } catch (error) {
    next(error);
  }
});

const retrieveGroupMembers = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId)
    return res.status(400).json({ message: "'chatId' is required." });

  try {
    const chat = await Chat.findById(chatId)
      // .select()
      .populate("users", "name email")
      .populate("groupAdmins", "name")
      .exec();

    if (!chat || chat.isGroupChat === false)
      return res.status(chat ? 400 : 404).json({
        message: chat
          ? `Chat with chat ID: ${chatId} is not a group chat!`
          : `Chat not found with chat ID: ${chatId}`,
      });

    res.status(200).json({
      message: "Fetched all the users from the group chat successfully.",
      data: {
        users: chat.users,
        "group admins": chat.groupAdmins,
      },
    });
  } catch (error) {
    next(error);
  }
});

export {
  accessChat,
  fetchChats,
  createGroupChat,
  renameChat,
  addUserToGroup,
  removeUserFromGroup,
  addAdminToGroup,
  removeAdminFromGroup,
  leaveGroupChat,
  retrieveGroupMembers,
};

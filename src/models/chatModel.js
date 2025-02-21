import mongoose from "mongoose";

const chatSchema = mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

chatSchema.pre("save", async function (next) {
  try {
    const existingChat = await this.constructor
      .findOne({
        chatName: this.chatName,
        isGroupChat: true,
        users: { $all: this.users },
        groupAdmins: { $in: this.groupAdmins },
      })
      .exec();

    if (existingChat) {
      const error = new Error(
        "Group chat with this same chat name, users, and group admins already exists!"
      );
      error.statusCode = 409;
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// chatModel.index({ chatName: 1, users: 1, groupAdmins: 1 }, { unique: true });  // prevent using compound index

export default mongoose.model("Chat", chatSchema);

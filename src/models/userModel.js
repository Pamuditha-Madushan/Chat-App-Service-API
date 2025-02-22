import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Basic email validation regex
    },
    roles: {
      User: {
        type: Number,
        default: 2010,
      },
      Moderator: Number,
      Admin: Number,
    },
    password: {
      type: String,
      required: true,
    },
    images: {
      type: String,
      default:
        "https://icon-library.com/images/profile-pic-icon/profile-pic-icon-16.jpg",
    },
    refreshToken: [String],
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPwd) {
  try {
    return await bcrypt.compare(enteredPwd, this.password);
  } catch (error) {
    throw new Error("Password comparison failed!");
  }
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("User", userSchema);

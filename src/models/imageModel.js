import mongoose from "mongoose";

const imageDetailsSchema = mongoose.Schema(
  {
    name: String,
    age: Number,
    imageUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("image", imageDetailsSchema);

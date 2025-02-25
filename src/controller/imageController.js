import fs from "fs";
import generateResourceName from "../config/generate.js";
import Image from "../models/imageModel.js";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import fileService from "../services/fileService.js";
import CustomError from "../utils/customError.js";

const uploadImage = async (req, res, next) => {
  const file = req.file;

  if (!file) return next(new CustomError("File is required!", 400));

  const data = JSON.parse(req.body.data);
  const { userId } = data;

  if (!userId) return next(new CustomError("User ID is required!", 400));
  const fileData = fs.readFileSync(file.path);
  const fileName = generateResourceName(file.originalname, "Pro", 22);

  try {
    const fileUrl = await fileService.uploadToS3(
      fileName,
      fileData,
      file.mimetype
    );
    fs.unlinkSync(file.path);

    if (!fileUrl)
      return next(new CustomError("Failed to get file URL after upload!", 403));

    const image = new Image({
      userId,
      imageUrl: fileUrl,
    });

    await image.save();

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: fileUrl },
      { new: true }
    ).exec();

    res.status(200).json({
      message:
        "File uploaded and User collection's images field updated successfully",
      imageUrl: fileUrl,
    });
  } catch (err) {
    logger.error("Error uploading file:", err);
    return next(err);
  }
};

export default uploadImage;

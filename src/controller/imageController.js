import fs from "fs";
import generateResourceName from "../config/generate.js";
import Image from "../models/imageModel.js";
import logger from "../utils/logger.js";
import fileService from "../services/fileService.js";
import CustomError from "../utils/customError.js";

const uploadImage = async (req, res, next) => {
  const file = req.file;

  if (!file) return next(new CustomError("No file uploaded!", 400));

  const data = JSON.parse(req.body.data);
  const { name, age } = data;
  const fileData = fs.readFileSync(file.path);
  const fileName = generateResourceName(file.originalname, "Pro", 22);

  try {
    const fileUrl = await fileService.uploadToS3(
      fileName,
      fileData,
      file.mimetype
    );
    fs.unlinkSync(file.path);

    const image = new Image({
      name,
      age,
      imageUrl: fileUrl,
    });

    await image.save();
    res.status(200).json({ message: "File upload successfully" });
  } catch (err) {
    logger.error("Error uploading file:", err);
    return next(
      new CustomError("Failed to upload the file to the AWS S3!", 500)
    );
  }
};

export default uploadImage;

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import logger from "../utils/logger.js";
import CustomError from "../utils/customError.js";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const uploadToS3 = async (fileName, fileData, mimetype) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `chat-api-sample/business/profile_image/${fileName}`,
    Body: fileData,
    ContentType: mimetype,
    ACL: "public-read",
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/chat-api-sample/business/profile_image/${fileName}`;

    logger.info(fileUrl);
    // console.log("File uploaded successfully:", response);

    return fileUrl;
  } catch (error) {
    return next(new CustomError("File upload Error", 500));
  }
};

export default { uploadToS3 };

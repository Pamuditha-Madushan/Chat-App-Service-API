import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import logger from "../utils/logger.js";
import CustomError from "../utils/customError.js";

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const uploadToS3 = async (fileName, fileData, mimetype) => {
  console.log("AWS_ACCESS_KEY:", accessKey);
  console.log("AWS_SECRET_KEY:", secretAccessKey);
  console.log("BUCKET_REGION:", bucketRegion);

  console.log("Uploading file to S3...");
  console.log("File Name:", fileName);
  console.log("File Data Length:", fileData.length);
  console.log("Mime Type:", mimetype);

  const params = {
    Bucket: bucketName,
    Key: `chat-api-sample/business/profile_image/${fileName}`,
    Body: fileData,
    ContentType: mimetype,
    // ACL: "public-read",
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    // console.log("AWS SDK Response:", response);
    const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/chat-api-sample/business/profile_image/${fileName}`;

    logger.info(fileUrl);

    return fileUrl;
  } catch (error) {
    logger.error("File upload error:", error);
    if (error.name === "SignatureDoesNotMatch") {
      logger.error(
        "The request signature we calculated does not match the signature you provided."
      );
    } else {
      logger.error("General error:", error);
    }
    throw new CustomError("File upload Error", 500);
  }
};

export default { uploadToS3 };

require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const generateDevelopersStackResourceName = require("../config/genaret");
const ImageDetails = require("../models/imageDetials");

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'ap-south-1' });

const fs = require('fs');

const uploadImage = async (req, res) => {
    const file = req.file;

    const data = JSON.parse(req.body.data);
    console.log(data.name)
    const name=data.name;
    const age=data.age;
    const fileData = fs.readFileSync(file.path);
    const fileName = generateDevelopersStackResourceName(
        file.originalname,
        "P",
        20
    );

    const params = {
        Bucket: 'sample-bucket-service-3',
        Key: `ozh-hub-sample/business/file/${fileName}`,
        Body: fileData,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };
    try {
        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);
        fs.unlinkSync(file.path);
        const fileUrl = `https://sample-bucket-service-3.s3.ap-south-1.amazonaws.com/ozh-hub-sample/business/file/${fileName}`;
        console.log(fileUrl)

        const image = new ImageDetails({
            name,
            age,
            imageUrl: fileUrl
        });

        // Save the image details to the database
        await image.save();
        console.log('File uploaded successfully:', response);
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ error: 'Failed to upload file to AWS S3' });
    }
};


module.exports = {uploadImage};

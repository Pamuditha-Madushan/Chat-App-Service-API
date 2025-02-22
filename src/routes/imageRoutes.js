import express from "express";
import uploadImage from "../controller/imageController.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ dest: "src/uploads/" });

router.post("/upload", upload.single("file"), uploadImage);

export default router;

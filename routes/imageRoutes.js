const express = require("express");
const {uploadImage} = require("../controller/imageController");
const multer = require("multer");
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload',upload.single('file'),uploadImage);
module.exports = router;
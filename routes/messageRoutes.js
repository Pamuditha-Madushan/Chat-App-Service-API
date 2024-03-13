const express = require("express");
const {

} = require("../controller/chatController");
const { protect } = require("../middlewares/authMiddleware");
const {sendMessage , allMessages} = require("../controller/messageController");

const router = express.Router();

router.route("/send").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);



module.exports = router;
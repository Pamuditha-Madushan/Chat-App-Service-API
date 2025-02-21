import express from "express";
import {
  sendMessage,
  allMessages,
  markMessageAsRead,
  getMessageReadByList,
  pinMessage,
  getAllPinnedMessages,
  removeMessage,
} from "../controller/messageController.js";
import checkIfUserIsParticipant from "../middlewares/checkIfUserIsParticipant.js";
import checkIfSender from "../middlewares/checkIfSender.js";

const router = express.Router();

router.route("/send").post(checkIfUserIsParticipant, sendMessage);
router.route("/mark-as-read").put(checkIfUserIsParticipant, markMessageAsRead);
router.put("/pin-message", checkIfUserIsParticipant, pinMessage);
router
  .route("/:chatId/pinned-messages")
  .get(checkIfUserIsParticipant, getAllPinnedMessages);
router.delete(
  "/:chatId/:messageId",
  checkIfUserIsParticipant,
  checkIfSender,
  removeMessage
);
router.route("/:chatId").get(checkIfUserIsParticipant, allMessages);
router.route("/:messageId/readBy").get(checkIfSender, getMessageReadByList);

export default router;

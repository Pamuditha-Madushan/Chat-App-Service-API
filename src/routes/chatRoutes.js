import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameChat,
  addUserToGroup,
  removeUserFromGroup,
  addAdminToGroup,
  removeAdminFromGroup,
  leaveGroupChat,
  retrieveGroupMembers,
} from "../controller/chatController.js";
import { verifyWithChatId } from "../middlewares/isGroupAdmin.js";
import checkIfUserIsParticipant from "../middlewares/checkIfUserIsParticipant.js";

const router = express.Router();

router.route("/").post(accessChat).get(fetchChats);
router.route("/new-group").post(createGroupChat);
router.route("/rename-chat").put(checkIfUserIsParticipant, renameChat);
router
  .route("/group-add-user")
  .put(checkIfUserIsParticipant, verifyWithChatId, addUserToGroup);
router
  .route("/group-remove-user")
  .put(checkIfUserIsParticipant, verifyWithChatId, removeUserFromGroup);
router
  .route("/group-add-admin")
  .put(checkIfUserIsParticipant, verifyWithChatId, addAdminToGroup);
router
  .route("/group-remove-admin")
  .put(checkIfUserIsParticipant, verifyWithChatId, removeAdminFromGroup);
router.route("/leave-group-chat").put(checkIfUserIsParticipant, leaveGroupChat);
router.route("/:chatId").get(checkIfUserIsParticipant, retrieveGroupMembers);

export default router;

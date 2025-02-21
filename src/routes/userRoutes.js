import express from "express";
import {
  registerUser,
  handleLogin,
  getAllUsers,
  handleLogout,
  handleRefreshToken,
} from "../controller/userController.js";
import verifyJWT from "../middlewares/authMiddleware.js";
import verifyRoles from "../middlewares/verifyRoles.js";
import ROLES_LIST from "../config/roles_list.js";

const router = express.Router();

router
  .route("/")
  .post(registerUser)
  .get(verifyJWT, verifyRoles(ROLES_LIST.Admin), getAllUsers);

router.route("/auth").post(handleLogin).get(handleRefreshToken);

router.get("/logout", handleLogout);

export default router;

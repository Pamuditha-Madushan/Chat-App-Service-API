import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";

const handleNewRefreshToken = asyncHandler(async (cookies, foundUser) => {
  const newRefreshTokenArray = !cookies.jwt
    ? foundUser.refreshToken
    : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

  if (cookies?.jwt) {
    const refreshToken = cookies.jwt;
    const foundToken = await User.findOne({ refreshToken }).exec();
    if (!foundToken) {
      logger.info("Attempted refresh token reuse at login!");
      newRefreshTokenArray.length = 0;
    }

    return { newRefreshTokenArray, foundToken };
  }

  return { newRefreshTokenArray };
});

export default handleNewRefreshToken;

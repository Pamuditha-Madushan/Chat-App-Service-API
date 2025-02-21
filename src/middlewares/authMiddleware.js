import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import CustomError from "../utils/customError.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer "))
    return next(
      new CustomError("Authorization header is missing or malformed!", 401)
    );

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return next(new CustomError("Invalid access token!", 403));
    if (!decoded?.UserInfo)
      return next(
        new CustomError("Invalid token payload: 'UserInfo' is missing", 403)
      );
    req.user = req.user || {};
    req.user._id = decoded.UserInfo.id;
    req.user.email = decoded.UserInfo.email;
    req.roles = decoded.UserInfo.roles;
    next();
  });
});

export default verifyJWT;

import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../config/generateToken.js";
import handleNewRefreshToken from "../services/authService.js";
import logger from "../utils/logger.js";

const isEmailExists = async (email) => {
  const duplicate = await User.findOne({ email }).exec();
  return duplicate;
};

const registerUser = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, password, profileImage } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the required fields to continue" });
    }
    const duplicate = await isEmailExists(email);
    if (duplicate) {
      return res
        .status(409)
        .json({ message: "The provide email is exists already!" });
    }

    const user = await User.create({
      name,
      email,
      password,
      profileImage,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    });
  } catch (error) {
    next(error);
  }
});

const handleLogin = asyncHandler(async (req, res, next) => {
  try {
    const cookies = req.cookies;
    logger.info(`Cookies available at login: ${JSON.stringify(cookies)}`);
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required!" });

    const foundUser = await isEmailExists(email);

    if (!foundUser) return res.sendStatus(401);

    const match = await foundUser.matchPassword(password);
    if (match) {
      const roles = Object.values(foundUser.roles);

      const { newRefreshTokenArray } = await handleNewRefreshToken(
        cookies,
        foundUser
      );

      const accessToken = generateAccessToken(
        foundUser._id,
        foundUser.email,
        roles
      );
      const newRefreshToken = generateRefreshToken(
        foundUser._id,
        foundUser.email
      );

      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      await foundUser.save();

      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: accessToken,
        _id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        profileImage: foundUser.profileImage,
      });
    } else {
      return res.sendStatus(401);
    }
  } catch (error) {
    next(error);
  }
});

const handleRefreshToken = asyncHandler(async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt)
      return res.status(204).json({ message: "Unauthorized!" });

    const refreshToken = cookies.jwt;

    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none" });

    const foundUser = await User.findOne({ refreshToken }).exec();

    if (!foundUser) {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) return res.sendStatus(403);
          logger.info("Attempted refresh token reuse!");

          const unAuthorizedUser = await User.findOne({
            email: decoded.email,
          }).exec();
          unAuthorizedUser.refreshToken = [];

          const result = await unAuthorizedUser.save();
        }
      );
      return res.status(403).json({ message: "forbidden" });
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err || foundUser.email !== decoded.email) {
          foundUser.refreshToken = [...newRefreshTokenArray];
          const result = await foundUser.save();
          return res.sendStatus(403);
        }

        const roles = Object.values(foundUser.roles);
        const accessToken = jwt.sign(
          {
            UserInfo: {
              id: decoded.id,
              email: decoded.email,
              roles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "30s" }
        );

        const newRefreshToken = jwt.sign(
          {
            id: foundUser._id,
            email: foundUser.email,
          },
          process.env.REFRESH_TOKEN_SECRET,
          {
            expiresIn: "1d",
          }
        );

        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        const result = await foundUser.save();

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ accessToken: accessToken });
      }
    );
  } catch (error) {
    next(error);
  }
});

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    }).select("-password -refreshToken -createdAt -updatedAt -__v");

    if (!users) return res.status(204).json({ message: "No users found!" });

    res.status(200).send(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

const handleLogout = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.sendStatus(204);
    }

    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    const result = await foundUser.save();

    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none" });
    res.status(204).json({ message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
};

export {
  registerUser,
  handleLogin,
  handleRefreshToken,
  getAllUsers,
  handleLogout,
};

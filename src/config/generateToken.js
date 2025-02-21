import jwt from "jsonwebtoken";

const generateAccessToken = (id, email, roles) => {
  return jwt.sign(
    {
      UserInfo: {
        id,
        email,
        roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "30s",
    }
  );
};

const generateRefreshToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

export { generateAccessToken, generateRefreshToken };

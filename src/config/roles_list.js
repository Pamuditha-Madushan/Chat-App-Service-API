import dotenv from "dotenv";
dotenv.config();

const ROLES_LIST = {
  Admin: Number(process.env.ADMIN),
  Moderator: Number(process.env.MODERATOR),
  User: 2010,
};

export default ROLES_LIST;

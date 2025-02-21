import CustomError from "../utils/customError.js";

const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // console.log("Roles from JWT:", req.roles);
    if (!req?.roles || !Array.isArray(req.roles))
      return next(
        new CustomError("Roles not found or aren't in an array!", 401)
      );
    const validRoles = req.roles.filter((role) => role !== null);
    const rolesArray = [...allowedRoles];
    const result = validRoles
      .map((role) => rolesArray.includes(role))
      .find((val) => val === true);
    if (!result)
      return next(new CustomError("Forbidden: Insufficient role!", 403));
    next();
  };
};

export default verifyRoles;

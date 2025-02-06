const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const authorizeUserRoles = (...allowedRoles) => {

    return asyncHandler(async (req, res, next) => {
        const token = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

        if (!token) {
            throw new ApiError(401, "Not authorized");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decodedToken) {
            throw new ApiError(401, "Invalid Access Token");
        }

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
        if (!allowedRoles.includes(user.role)) {
            throw new ApiError(403, "You are not authorized to access this route");
        }

        req.user = user;
        next();
    });

}


module.exports = authorizeUserRoles;
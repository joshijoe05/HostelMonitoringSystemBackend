const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const User = require("../models/user.model");

const verifyUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization").split(" ")[1];

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

    req.user = user;
    next();
});

module.exports = verifyUser;
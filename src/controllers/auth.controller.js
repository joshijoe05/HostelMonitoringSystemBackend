const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Joi = require("joi");
const sendMail = require("../services/mailer.service");
const { verificationTemplate } = require("../utils/mailTemplate");

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

const generateVerificationToken = async function (email) {
    return await bcrypt.hash(email, 10);
}


// address not included yet
const registerUser = asyncHandler(async (req, res, next) => {
    const { fullName, email, password, hostelId, contactNumber } = req.body;

    if ([hostelId, fullName, email, password, contactNumber].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required");
    }

    const emailValidation = Joi.object({
        email: Joi.string().pattern(/^n\d{6}@rguktn\.ac\.in$/).required()
    });
    const { error } = emailValidation.validate({ email });
    if (error) {
        throw new ApiError(400, "Invalid Email Address");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(409, "User with email already exists");
    }

    const verificationToken = await generateVerificationToken(email);
    const user = await User.create({
        email,
        fullName,
        password,
        hostelId,
        contactNumber,
        verificationToken,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    await sendMail(user.email, "Account Verification", verificationTemplate(user.fullName, verificationToken));

    return res.status(201).json(
        new ApiResponse(201, "Verification mail sent", createdUser)
    );
});

const verifyUser = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.render("verificationError", { message: "Invalid verification link" });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
        return res.render("verificationError", { message: "User not found or token expired" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.render("verificationSuccess", { message: "Your account has been verified successfully!" });
});

const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ApiError(400, "Email and password are required"));
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    const isValidUser = await user.checkPassword(password);

    if (!isValidUser) {
        throw new ApiError(400, "Invalid credentials");
    }

    const isUserVerified = user.isVerified;
    if (!isUserVerified) {
        throw new ApiError(400, "User is not verified");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -createdBy");
    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, "User logged in successfully",
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                }
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(
            new ApiResponse(200, "User logged out successfully", {})
        );
});


const changeAccountPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const isPasswordCorrect = await user.checkPassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            "Password changed successfully",
            {},
        )
    )
});


const getAccessTokenFromRefreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh Token required");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!decodedToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(400, "Invalid Refresh Token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200,
                "Access token generated successfully",
                {
                    accessToken,
                    refreshToken
                },
            )
        );
});

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken").populate("hostelId", "name");

    return res.status(200).json(
        new ApiResponse(
            200,
            "User profile fetched successfully",
            {
                user
            },
        )
    );
});

module.exports = { registerUser, verifyUser, loginUser, logoutUser, changeAccountPassword, getAccessTokenFromRefreshToken, getUserProfile };
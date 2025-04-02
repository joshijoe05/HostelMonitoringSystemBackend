const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");


const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;


    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);


    const notifications = await Notification.find({ recipients: userId })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean();


    const totalNotifications = await Notification.countDocuments({ recipients: userId });

    return res.status(200).json(new ApiResponse(200, "User notifications fetched successfully", {
        notifications,
        meta: {
            total: totalNotifications,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(totalNotifications / pageSize)
        }
    }));
});


module.exports = { getUserNotifications };

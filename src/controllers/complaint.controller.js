const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const Joi = require("joi");
const { Complaint, complaintValidator } = require("../models/complaint.model");
const uploadOnCloudinary = require("../utils/cloudinary");
const mongoose = require("mongoose");


const createComplaint = asyncHandler(async (req, res, next) => {
    const { description, type, priority } = req.body;

    const { error } = complaintValidator.validate({ description, type, priority });

    if (error) {
        throw new ApiError(400, error.message);
    }


    const images = req.files.images;
    if (images.length > 2) {
        throw new ApiError(400, "You can upload a maximum of 2 images");
    }
    const imagePaths = [];
    for (const file of images) {
        const image = await uploadOnCloudinary(file.path);
        imagePaths.push(image.url);
    }


    const complaint = await Complaint.create({
        hostel_id: req.user.hostelId,
        raised_by: req.user._id,
        description,
        type,
        priority,
        images: imagePaths,
    });

    return res.status(201).json(new ApiResponse(201, "Issue raised successfully !", complaint));
});


const updateComplaint = asyncHandler(async (req, res, next) => {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Issue not found !");
    }
    if (complaint.raised_by.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this issue !");
    }

    const { description, type, priority } = req.body;
    const validator = Joi.object({
        description: Joi.string().trim().min(10).max(500),
        type: Joi.string().valid("electricity", "cleaning", "others"),
        priority: Joi.string().valid("low", "medium", "high")
    }).min(1);

    const { error } = validator.validate({ description, type, priority });
    if (error) {
        throw new ApiError(400, error.message);
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, { $set: { description, type, priority } }, { new: true, runValidators: true });
    if (!updatedComplaint) {
        throw new ApiError(500, "Issue could not be updated !");
    }
    return res.status(200).json(new ApiResponse(200, "Issue updated successfully !", updatedComplaint));

});


const deleteComplaint = asyncHandler(async (req, res, next) => {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Issue not found !");
    }
    if (complaint.raised_by.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this issue !");
    }

    const deletedComplaint = await Complaint.findByIdAndDelete(complaintId);
    if (!deletedComplaint) {
        throw new ApiError(500, "Issue could not be deleted !");
    }

    return res.status(200).json(new ApiResponse(200, "Issue deleted successfully !", deletedComplaint));
});

const updateComplaintStatus = asyncHandler(async (req, res, next) => {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Issue not found !");
    }

    const { status } = req.body;
    if (["pending", "in-progress", "resolved"].indexOf(status) === -1) {
        throw new ApiError(400, "Invalid status !");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, { $set: { status } }, { new: true });

    if (!updatedComplaint) {
        throw new ApiError(500, "Issue could not be updated !");
    }

    return res.status(200).json(new ApiResponse(200, "Issue status updated successfully !", updatedComplaint));

});

const getRaisedComplaints = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", type, status, priority } = req.query;

    const filters = { raised_by: userId };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const complaints = await Complaint.aggregate([
        { $match: filters },

        {
            $lookup: {
                from: "hostels",
                localField: "hostel_id",
                foreignField: "_id",
                as: "hostel",
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "raised_by",
                foreignField: "_id",
                as: "user",
            },
        },

        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "complaint_id",
                as: "comments",
            },
        },

        { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                localField: "comments.added_by",
                foreignField: "_id",
                as: "commentUser",
            },
        },

        {
            $project: {
                type: 1,
                status: 1,
                priority: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                images: 1,
                hostel: { $arrayElemAt: ["$hostel.name", 0] },
                raised_by: { $arrayElemAt: ["$user.fullName", 0] },
                comments: {
                    _id: "$comments._id",
                    text: "$comments.comment",
                    createdAt: "$comments.createdAt",
                    added_by: { $arrayElemAt: ["$commentUser.fullName", 0] }, // Replace UID with name
                },
            },
        },

        {
            $group: {
                _id: "$_id",
                type: { $first: "$type" },
                status: { $first: "$status" },
                priority: { $first: "$priority" },
                description: { $first: "$description" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                images: { $first: "$images" },
                hostel: { $first: "$hostel" },
                raised_by: { $first: "$raised_by" },
                comments: { $push: "$comments" },
            },
        },

        { $sort: { [sortBy]: order === "asc" ? 1 : -1 } },
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: limitNumber }
    ]);

    const totalComplaints = await Complaint.countDocuments(filters);

    res.status(200).json(new ApiResponse(200, "Complaints fetched successfully", {
        complaints,
        meta: {
            total: totalComplaints,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(totalComplaints / limitNumber),
        },
    }));
});


const getIssuesInHostel = asyncHandler(async (req, res) => {
    let hostelId;
    if (req.user.role === "caretaker") {
        hostelId = req.user.hostelId;
    } else if (req.user.role === "admin") {
        hostelId = req.query.hostelId;
        if (!hostelId) {
            throw new ApiError(400, "Hostel ID is required");
        }
        hostelId = new mongoose.Types.ObjectId(hostelId);
    }
    console.log(hostelId);

    const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", type, status, priority } = req.query;

    const filters = { hostel_id: hostelId };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const complaints = await Complaint.aggregate([
        { $match: filters },

        { $sort: { [sortBy]: order === "asc" ? 1 : -1 } },
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: limitNumber },

        {
            $lookup: {
                from: "hostels",
                localField: "hostel_id",
                foreignField: "_id",
                as: "hostel",
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "raised_by",
                foreignField: "_id",
                as: "user",
            },
        },

        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "complaint_id",
                as: "comments",
            },
        },

        { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                localField: "comments.added_by",
                foreignField: "_id",
                as: "commentUser",
            },
        },

        {
            $project: {
                type: 1,
                status: 1,
                priority: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                images: 1,
                hostel: { $arrayElemAt: ["$hostel.name", 0] },
                raised_by: { $arrayElemAt: ["$user.fullName", 0] },
                comments: {
                    _id: "$comments._id",
                    text: "$comments.comment",
                    createdAt: "$comments.createdAt",
                    added_by: { $arrayElemAt: ["$commentUser.fullName", 0] }, // Replace UID with name
                },
            },
        },

        {
            $group: {
                _id: "$_id",
                type: { $first: "$type" },
                status: { $first: "$status" },
                priority: { $first: "$priority" },
                description: { $first: "$description" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                images: { $first: "$images" },
                hostel: { $first: "$hostel" },
                raised_by: { $first: "$raised_by" },
                comments: { $push: "$comments" },
            },
        },
    ]);

    const totalComplaints = await Complaint.countDocuments(filters);

    res.status(200).json(new ApiResponse(200, "Complaints fetched successfully", {
        complaints,
        meta: {
            total: totalComplaints,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(totalComplaints / limitNumber),
        },
    }));
});


module.exports = {
    createComplaint,
    updateComplaint,
    deleteComplaint,
    updateComplaintStatus,
    getRaisedComplaints,
    getIssuesInHostel,
}
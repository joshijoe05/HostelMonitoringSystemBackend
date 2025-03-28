const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const Joi = require("joi");
const Hostel = require("../models/hostel.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

const createHostel = asyncHandler(async (req, res) => {
    const { name, totalRooms } = req.body;
    if ([name, totalRooms].some((field) => !field)) {
        throw new ApiError(400, "All Fields are required");
    }

    const hostelSchema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        totalRooms: Joi.number().integer().min(1).required(),

    });

    const { error } = hostelSchema.validate({ name, totalRooms });
    if (error) {
        throw new ApiError(400, error.message);
    }
    const createdBy = req.user._id;
    const hostel = await Hostel.create({ name, totalRooms, createdBy });
    if (!hostel) {
        throw new ApiError(500, "Hostel could not be created");
    }

    return res.status(201).json(new ApiResponse(201, "Hostel created Successfully", { hostel }));
});

const getAllHostels = asyncHandler(async (req, res) => {
    const hostels = await Hostel.aggregate([

        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "creator",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "caretakerIds",
                foreignField: "_id",
                as: "caretakers",
            },
        },
        {
            $project: {
                name: 1,
                totalRooms: 1,
                createdAt: 1,
                updatedAt: 1,

                caretakers: {
                    $map: {
                        input: "$caretakers",
                        as: "caretaker",
                        in: "$$caretaker.fullName"
                    }
                },

                createdBy: { $arrayElemAt: ["$creator.fullName", 0] },
            },
        },
    ]);

    if (!hostels) {
        throw new ApiError(500, "Hostels could not be fetched");
    }

    return res.status(200).json(new ApiResponse(200, "Hostels fetched Successfully", { hostels }));
});





const updateHostelById = asyncHandler(async (req, res) => {
    const hostelId = req.params.id;
    const data = req.body;

    const updateHostelSchema = Joi.object({
        name: Joi.string().trim().min(3).max(100),
        totalRooms: Joi.number().integer().min(1),
        wings: Joi.array().items(Joi.string().trim()),
        waterTimings: Joi.object({
            start: Joi.string().regex(/^([0-9]{1,2}):([0-9]{2})\s?(AM|PM)$/),
            end: Joi.string().regex(/^([0-9]{1,2}):([0-9]{2})\s?(AM|PM)$/)
        })
    }).min(1);

    const { error } = updateHostelSchema.validate(data);
    if (error) {
        throw new ApiError(400, error.message);
    }

    const updatedHostel = await Hostel.findByIdAndUpdate(hostelId, { $set: data }, {
        new: true, runValidators: true
    },);

    if (!updatedHostel) {
        throw new ApiError(500, "Hostel could not be updated");
    }

    return res.status(200).json(new ApiResponse(200, "Hostel updated Successfully", updatedHostel));
});


const deleteHostelById = asyncHandler(async (req, res) => {
    const hostelId = req.params.id;

    const deletedHostel = await Hostel.findByIdAndDelete(hostelId);

    if (!deletedHostel) {
        throw new ApiError(404, "Hostel not found");
    }

    return res.status(200).json(new ApiResponse(200, "Hostel deleted Successfully", deletedHostel));
});


const getStudentsInHostel = asyncHandler(async (req, res) => {
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

    const { page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;
    const filters = { hostelId: hostelId, role: "student" };
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const students = await User.find(filters)
        .select("fullName email contactNumber")
        .populate({
            path: "hostelId",
            select: "name",
        })
        .sort({ [sortBy]: order === "desc" ? -1 : 1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    const totalStudents = await User.countDocuments(filters);

    return res.status(200).json(new ApiResponse(200, "Students fetched successfully", {
        students,
        meta: {
            total: totalStudents,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(totalStudents / limitNumber),
        },
    }))
});


module.exports = {
    createHostel,
    getAllHostels,
    updateHostelById,
    deleteHostelById,
    getStudentsInHostel,
};
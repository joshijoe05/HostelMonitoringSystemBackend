const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const Joi = require("joi");
const Hostel = require("../models/hostel.model");

const createHostel = asyncHandler(async (req, res) => {
    const { name, wings, totalRooms } = req.body;
    if ([name, wings, totalRooms].some((field) => !field)) {
        throw new ApiError(400, "All Fields are required");
    }

    const hostelSchema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        totalRooms: Joi.number().integer().min(1).required(),
        wings: Joi.array().items(Joi.string().min(1)).required(),
    });

    const { error } = hostelSchema.validate({ name, wings, totalRooms });
    if (error) {
        throw new ApiError(400, error.message);
    }
    const createdBy = req.user._id;
    const hostel = await Hostel.create({ name, wings, totalRooms, createdBy });
    if (!hostel) {
        throw new ApiError(500, "Hostel could not be created");
    }

    return res.status(201).json(new ApiResponse(201, "Hostel created Successfully", { hostel }));
});

const getAllHostels = asyncHandler(async (req, res) => {
    const hostels = await Hostel.find();
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


module.exports = {
    createHostel,
    getAllHostels,
    updateHostelById,
    deleteHostelById,
};
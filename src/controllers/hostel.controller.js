const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const Joi = require("joi");
const Hostel = require("../models/hostel.model");

const createHostel = asyncHandler(async (req, res) => {
    const { name, wings, totalRooms, createdBy } = req.body;
    if ([name, wings, totalRooms, createdBy].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required");
    }

    const hostelSchema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        totalRooms: Joi.number().integer().min(1).required(),
        wings: Joi.array().items(Joi.string().max(1)).required(),
        createdBy: Joi.string().uuid().required()
    });

    const { error } = hostelSchema.validate({ name, wings, totalRooms, createdBy });
    if (error) {
        throw new ApiError(400, error.message);
    }

    const hostel = await Hostel.create({ name, wings, totalRooms, createdBy });
    if (!hostel) {
        throw new ApiError(500, "Hostel could not be created");
    }

    return res.status(201).json(new ApiResponse(201, "Hostel created Successfully", { hostel }));
});


module.exports = {
    createHostel
};
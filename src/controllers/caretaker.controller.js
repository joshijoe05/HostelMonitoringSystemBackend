const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const User = require("../models/user.model");
const Hostel = require("../models/hostel.model");
const Joi = require("joi");


const createCaretaker = asyncHandler(async (req, res) => {
    const { fullName, email, password, hostelId, contactNumber } = req.body;
    if ([fullName, email, password, hostelId, contactNumber].some((field) => !field)) {
        throw new ApiError(400, "All Fields are required");
    }

    const caretakerSchema = Joi.object({
        fullName: Joi.string().trim().min(3).max(100),
        email: Joi.string().email().required(),
        hostelId: Joi.string().required(),
        contactNumber: Joi.string().trim().min(10).max(10)
    });

    const { error } = caretakerSchema.validate({ fullName, email, hostelId, contactNumber });
    if (error) {
        throw new ApiError(400, error.message);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(409, "User with email already exists");
    }

    const createdBy = req.user._id;
    const role = "caretaker";
    const caretaker = await User.create({ fullName, email, password, role, hostelId, contactNumber, createdBy, isVerified: true });

    const updatedCaretaker = await User.findById(caretaker._id).select("-password -refreshToken");
    if (!updatedCaretaker) {
        throw new ApiError(500, "Caretaker not created");
    }
    await Hostel.findByIdAndUpdate(hostelId, { $push: { caretakerIds: caretaker._id } }, { new: true, runValidators: true });


    return res.status(201).json(new ApiResponse(201, "Caretaker created Successfully", { caretaker }));
});

const getAllCaretakers = asyncHandler(async (req, res) => {
    const caretakers = await User.find({ role: "caretaker" }).populate("hostelId", "name").populate("createdBy", "fullName");
    if (!caretakers) {
        throw new ApiError(404, "Caretakers not found");
    }
    const formattedCaretakers = caretakers.map(caretaker => ({
        _id: caretaker._id,
        fullName: caretaker.fullName,
        email: caretaker.email,
        contactNumber: caretaker.contactNumber,
        role: caretaker.role,
        createdBy: caretaker.createdBy ? caretaker.createdBy.fullName : null,
        hostel: caretaker.hostelId ? caretaker.hostelId.name : null,
        createdAt: caretaker.createdAt,
        updatedAt: caretaker.updatedAt,
    }));

    return res.status(200).json(new ApiResponse(200, "Caretakers fetched Successfully", { caretakers: formattedCaretakers }));
});


const updateCaretakerById = asyncHandler(async (req, res) => {
    const caretakerId = req.params.id;
    const { fullName, hostelId, contactNumber } = req.body;

    const updateCaretakerSchema = Joi.object({
        fullName: Joi.string().trim().min(3).max(100),
        hostelId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        contactNumber: Joi.string().trim().min(10).max(10)
    }).min(1);

    const { error } = updateCaretakerSchema.validate({ fullName, hostelId, contactNumber });
    if (error) {
        throw new ApiError(400, error.message);
    }

    const updatedCaretaker = await User.findByIdAndUpdate(caretakerId, { $set: { fullName, hostelId, contactNumber } }, {
        new: true, runValidators: true
    },);

    if (!updatedCaretaker) {
        throw new ApiError(500, "Caretaker could not be updated");
    }

    return res.status(200).json(new ApiResponse(200, "Caretaker updated Successfully", updatedCaretaker));
});


const deleteCaretakerById = asyncHandler(async (req, res) => {
    const caretakerId = req.params.id;

    const deletedCaretaker = await User.findByIdAndDelete(caretakerId);
    await Hostel.findByIdAndUpdate(
        deletedCaretaker.hostelId,
        { $pull: { caretakerIds: deletedCaretaker._id } },
        { new: true }
    );

    if (!deletedCaretaker) {
        throw new ApiError(404, "Caretaker not found");
    }

    return res.status(200).json(new ApiResponse(200, "Caretaker deleted Successfully", deletedCaretaker));
});


module.exports = {
    createCaretaker,
    getAllCaretakers,
    updateCaretakerById,
    deleteCaretakerById,
}
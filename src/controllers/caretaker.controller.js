const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const User = require("../models/user.model");
const Hostel = require("../models/hostel.model");


const createCaretaker = asyncHandler(async (req, res) => {
    const { fullName, email, password, hostelId, contactNumber } = req.body;
    if ([fullName, email, password, hostelId, contactNumber].some((field) => !field)) {
        throw new ApiError(400, "All Fields are required");
    }

    const createdBy = req.user._id;
    const role = "caretaker";
    const caretaker = await User.create({ fullName, email, password, role, hostelId, contactNumber, createdBy });

    if (!caretaker) {
        throw new ApiError(500, "Caretaker not created");
    }

    return res.status(201).json(new ApiResponse(201, "Caretaker created Successfully", { caretaker }));
});

const getAllCaretakers = asyncHandler(async (req, res) => {
    const caretakers = await User.find({ role: "caretaker" });
    if (!caretakers) {
        throw new ApiError(404, "Caretakers not found");
    }
    return res.status(200).json(new ApiResponse(200, "Caretakers fetched Successfully", { caretakers }));
});


const updateCaretakerById = asyncHandler(async (req, res) => {
    const caretakerId = req.params.id;
    const { fullName, hostelId, contactNumber } = req.body;

    const updateCaretakerSchema = Joi.object({
        fullName: Joi.string().trim().min(3).max(100),
        hostelId: Joi.string().uuid(),
        contactNumber: Joi.string().trim().min(10).max(10)
    }).min(1);

    const { error } = updateCaretakerSchema.validate({ fullName, hostelId, contactNumber });
    if (error) {
        throw new ApiError(400, error.message);
    }

    const updatedCaretaker = await User.findByIdAndUpdate(caretakerId, { $set: data }, {
        new: true, runValidators: true
    },);

    if (!updatedCaretaker) {
        throw new ApiError(500, "Caretaker could not be updated");
    }

    return res.status(200).json(new ApiResponse(200, "Caretaker updated Successfully", updatedCaretaker));
});


const deleteCaretakerById = asyncHandler(async (req, res) => {
    const caretakerId = req.params.id;

    const deletedCaretaker = await Hostel.findByIdAndDelete(hostelId);

    if (!deletedCaretaker) {
        throw new ApiError(404, "Caretaker not found");
    }

    return res.status(200).json(new ApiResponse(200, "Hostel deleted Successfully", deletedCaretaker));
});


module.exports = {
    createCaretaker,
    getAllCaretakers,
    updateCaretakerById,
    deleteCaretakerById,
}
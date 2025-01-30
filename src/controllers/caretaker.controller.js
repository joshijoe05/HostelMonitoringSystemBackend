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

    const hostel = await Hostel.findById(hostelId);
    hostel.caretakerIds.push(caretaker._id);
    await hostel.save();

    return res.status(201).json(new ApiResponse(201, "Caretaker created Successfully", { caretaker }));
});


module.exports = {
    createCaretaker,
}
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const Joi = require("joi");
const { Complaint, complaintValidator } = require("../models/complaint.model");


const createComplaint = asyncHandler(async (req, res, next) => {
    const { description, type, priority } = req.body;
    const { error } = complaintValidator.validate({ description, type, priority });
    if (error) {
        return new ApiError(400, error.message);
    }

    const complaint = await Complaint.create({
        hostel_id: req.user.hostelId,
        raised_by: req.user._id,
        description,
        type,
        priority
    });

    return new ApiResponse(201, "Issue raised successfully !", complaint);
});


const updateComplaint = asyncHandler(async (req, res, next) => {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        return new ApiError(404, "Issue not found !");
    }
    if (complaint.raised_by.toString() !== req.user._id.toString()) {
        return new ApiError(403, "You are not authorized to update this issue !");
    }

    const { description, type, priority } = req.body;
    const validator = Joi.object({
        description: Joi.string().trim().min(10).max(500),
        type: Joi.string().valid("electricity", "cleaning", "others"),
        priority: Joi.string().valid("low", "medium", "high")
    }).min(1);

    const { error } = validator.validate({ description, type, priority });
    if (error) {
        return new ApiError(400, error.message);
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, { $set: { description, type, priority } }, { new: true, runValidators: true });
    if (!updatedComplaint) {
        return new ApiError(500, "Issue could not be updated !");
    }
    return new ApiResponse(200, "Issue updated successfully !", updatedComplaint);

});


const deleteComplaint = asyncHandler(async (req, res, next) => {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        return new ApiError(404, "Issue not found !");
    }
    if (complaint.raised_by.toString() !== req.user._id.toString()) {
        return new ApiError(403, "You are not authorized to update this issue !");
    }

    const deletedComplaint = await Complaint.findByIdAndDelete(complaintId);
    if (!deletedComplaint) {
        return new ApiError(500, "Issue could not be deleted !");
    }

    return new ApiResponse(200, "Issue deleted successfully !", deletedComplaint);
});


module.exports = {
    createComplaint,
    updateComplaint,
    deleteComplaint
}
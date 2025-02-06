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

const updateComplaintStatus = asyncHandler(async (req, res, next) => {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        return new ApiError(404, "Issue not found !");
    }

    const { status } = req.body;
    if (["pending", "in-progress", "resolved"].indexOf(status) === -1) {
        return new ApiError(400, "Invalid status !");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, { $set: { status } }, { new: true });

    if (!updatedComplaint) {
        return new ApiError(500, "Issue could not be updated !");
    }

    return new ApiResponse(200, "Issue status updated successfully !", updatedComplaint);

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

    const complaints = await Complaint.find(filters)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

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
    const hostelId = req.user.hostelId;

    const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", type, status, priority } = req.query;

    const filters = { hostel_id: hostelId };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const complaints = await Complaint.find(filters)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

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
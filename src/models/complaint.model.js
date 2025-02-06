const mongoose = require("mongoose");
const Joi = require("joi");

const complaintSchema = new mongoose.Schema(
    {
        hostel_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
            required: true,
        },
        type: {
            type: String,
            enum: ["electricity", "cleaning", "others"],
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            default: "pending",
        },
        raised_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
    },
    { timestamps: true }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

const complaintValidator = Joi.object({
    description: Joi.string()
        .trim()
        .min(10)
        .max(500)
        .required()
        .messages({
            "string.empty": "Description cannot be empty",
            "string.min": "Description must be at least 10 characters long",
            "string.max": "Description cannot exceed 500 characters",
            "any.required": "Description is required",
        }),

    type: Joi.string()
        .valid("electricity", "cleaning", "others")
        .required()
        .messages({
            "any.only": "Type must be one of ['electricity', 'cleaning', 'others']",
            "any.required": "Type is required",
        }),

    priority: Joi.string()
        .valid("low", "medium", "high")
        .default("low")
        .messages({
            "any.only": "Priority must be one of ['low', 'medium', 'high']",
        }),
});


module.exports = {
    Complaint, complaintValidator
}

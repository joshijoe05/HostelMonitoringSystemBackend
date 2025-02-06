const mongoose = require("mongoose");

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

module.exports = mongoose.model("Complaint", complaintSchema);

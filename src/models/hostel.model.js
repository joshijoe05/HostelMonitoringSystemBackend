const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "hostel name is required"],
            trim: true
        },
        wings: [
            {
                type: String,
                trim: true,
            }
        ],
        totalRooms: {
            type: Number,
        },
        waterTimings: {
            start: {
                type: String,
                trim: true,
            },
            end: {
                type: String,
                trim: true,
            },
        },
        caretakerIds: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User",
            }
        ],
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Hostel", hostelSchema);
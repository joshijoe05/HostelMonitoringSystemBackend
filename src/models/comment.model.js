const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        complaint_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        added_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ComplaintComment", commentSchema);

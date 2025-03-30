const mongoose = require("mongoose");

const BusTravelFormSchema = new mongoose.Schema({
    hostelId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
});

const BusTravelForm = mongoose.model("BusTravelForm", BusTravelFormSchema);

module.exports = BusTravelForm;
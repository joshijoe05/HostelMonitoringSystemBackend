const mongoose = require("mongoose");

const busTravelFormResponseSchema = new mongoose.Schema({
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "BusTravelForm", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    willTravelByBus: { type: Boolean, required: true },
    relation: String,
    destinationCity: String
});


const BusTravelFormResponse = mongoose.model("BusTravelFormResponse", busTravelFormResponseSchema);

module.exports = BusTravelFormResponse;
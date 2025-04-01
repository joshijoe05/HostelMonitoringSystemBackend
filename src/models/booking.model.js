const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "BusRoute", required: true },
    transactionId: { type: String, unique: true, required: true },
    status: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "FAILED", "CANCELLED"],
        default: "PENDING"
    },
    amount: { type: Number, required: true },
    paymentResponse: { type: Object },
    passengerName: { type: String, required: true },
    passengerEmail: { type: String, required: true },
    passengerPhone: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;

const mongoose = require("mongoose");

const BusRouteSchema = new mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    from: String,
    to: String,
    busFare: Number,
    seatsAvailable: Number,
    busType: { type: String, enum: ["Express", "Super Luxury", "Ultra Deluxe", "Palle Velugu"] },
    hostels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true }],
    date: Date,
    createdAt: { type: Date, default: Date.now }
});

const BusRoute = mongoose.model("BusRoute", BusRouteSchema);

module.exports = BusRoute;

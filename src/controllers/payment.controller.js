const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const Booking = require("../models/booking.model");
const { initiatePhonePePayment } = require("../services/phonepe.service");
const redis = require("../config/redis");
const BusRoute = require("../models/busRoute.model");



const initiatePayment = asyncHandler(async (req, res) => {
    const { busId } = req.body;
    const userId = req.user.id;
    const bus = await BusRoute.findById(busId);
    if (!bus) throw new ApiError(404, "Bus not found");

    const seatKey = `bus:${busId}:seats`;
    let availableSeats = await redis.get(seatKey);

    if (!availableSeats || availableSeats <= 0) {
        availableSeats = bus.seatsAvailable;
        console.log(availableSeats);
        await redis.set(seatKey, availableSeats, "EX", 3600);
    }

    availableSeats = parseInt(availableSeats);

    const lockKey = `lock:bus:${busId}:seats:${availableSeats}`;
    const lockAcquired = await redis.set(lockKey, userId, "NX", "EX", 300);
    if (!lockAcquired) {
        throw new ApiError(400, "Another transaction is in progress");
    }

    if (availableSeats > 0) {
        await redis.decr(seatKey);
        const transactionId = `TXN_${Date.now()}`;

        const booking = new Booking({
            userId,
            busId,
            transactionId,
            status: "PENDING",
            amount: bus.busFare,
        });
        await booking.save();

        try {
            const paymentUrl = await initiatePhonePePayment(userId, transactionId, bus.busFare);
            return res.status(200).json(new ApiResponse(200, "Payment initiated", { paymentUrl }));
        } catch (error) {
            await redis.incr(seatKey); // Restore seat count on failure
            throw new ApiError(500, error.message || "Failed to initiate payment");
        }
    } else {
        await redis.del(lockKey);
        return res.status(400).json(new ApiResponse(400, "No seats available"));
    }
});




const handlePhonePeWebhook = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { transactionId, status } = req.body;

    const booking = await Booking.findOne({ transactionId });
    if (!booking) {
        return res.status(400).json({ message: "Booking not found" });
    }

    const seatKey = `bus:${booking.busId}:seats`;

    if (status === "SUCCESS") {
        booking.status = "CONFIRMED";
        await booking.save();

        await BusRoute.findByIdAndUpdate(booking.busId, { $inc: { seatsAvailable: -1 } });
    } else {
        await redis.incr(seatKey);
        booking.status = "FAILED";
        await booking.save();
    }

    return res.status(200).json(new ApiResponse(200, "Webhook processed"));
});

module.exports = { initiatePayment, handlePhonePeWebhook };

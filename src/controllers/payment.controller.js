const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const Booking = require("../models/booking.model");
const { initiatePhonePePayment, checkStatusApi } = require("../services/phonepe.service");
const { client } = require("../config/redis");
const BusRoute = require("../models/busRoute.model");



const initiatePayment = asyncHandler(async (req, res) => {
    const { busId } = req.body;
    const userId = req.user.id;
    const bus = await BusRoute.findById(busId);
    if (!bus) throw new ApiError(404, "Bus not found");

    const seatKey = `bus:${busId}:seats`;
    let availableSeats = await client.get(seatKey);

    if (!availableSeats || availableSeats <= 0) {
        availableSeats = bus.seatsAvailable;
        console.log(availableSeats);
        await client.set(seatKey, availableSeats, { EX: 3600 });
    }

    availableSeats = parseInt(availableSeats);

    const lockKey = `lock:bus:${busId}:seats:${availableSeats}`;
    const lockAcquired = await client.set(lockKey, userId, { EX: 300, NX: true });
    if (!lockAcquired) {
        throw new ApiError(400, "Another transaction is in progress");
    }

    if (availableSeats > 0) {
        await client.decr(seatKey);
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
            await client.incr(seatKey);
            await client.del(lockKey);
            throw new ApiError(500, error.message || "Failed to initiate payment");
        }
    } else {
        await client.del(lockKey);
        return res.status(400).json(new ApiResponse(400, "No seats available"));
    }
});




const validatePayment = asyncHandler(async (req, res) => {
    const transactionId = req.params.id;
    const booking = await Booking.findOne({ transactionId });
    if (!booking) {
        return res.status(400).json({ message: "Booking not found" });
    }
    try {
        const data = await checkStatusApi(transactionId);
        if (data && data.code == "PAYMENT_SUCCESS") {
            booking.status = "CONFIRMED";
            await booking.save();

            await BusRoute.findByIdAndUpdate(booking.busId, { $inc: { seatsAvailable: -1 } });
            return res.status(200).json(new ApiResponse(200, "Payment successful", data));
        }
        else if (data && data.code === "PAYMENT_PENDING") {
            return res.status(202).json(new ApiResponse(200, "Payment pending"));
        } else {
            const seatKey = `bus:${booking.busId}:seats`;
            await client.incr(seatKey);
            booking.status = "FAILED";
            await booking.save();
            return res.status(400).json(new ApiResponse(400, "Payment failed", response.data));
        }
    }
    catch (error) {
        throw new ApiError(500, error.message || "Failed to validate payment");
    }



});

module.exports = { initiatePayment, validatePayment };

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const Booking = require("../models/booking.model");
const { initiatePhonePePayment, checkStatusApi } = require("../services/phonepe.service");
const { client } = require("../config/redis");
const BusRoute = require("../models/busRoute.model");
const sendMail = require("../services/mailer.service");



const initiatePayment = asyncHandler(async (req, res) => {
    const { busId, passengerName, passengerEmail, passengerPhone } = req.body;
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
            passengerName,
            passengerEmail,
            passengerPhone
        });
        await booking.save();

        try {
            const paymentUrl = await initiatePhonePePayment(userId, transactionId, lockKey, bus.busFare);
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


const sendBusBookedMail = async (booking) => {

    const emailSubject = "🎟️ Bus Booking Confirmed!";
    const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2d89ef;">🚍 Your Bus Ticket is Confirmed!</h2>
            <p>Dear <strong>${booking.passengerName}</strong>,</p>
            <p>Your bus booking has been successfully confirmed. Below are your booking details:</p>
            <hr>
            <p><strong>🚌 Bus Name:</strong> ${booking.busId.name}</p>
            <p><strong>🛏️ Bus Type:</strong> ${booking.busId.busType}</p>
            <p><strong>📍 From:</strong> ${booking.busId.from}</p>
            <p><strong>📍 To:</strong> ${booking.busId.to}</p>
            <p><strong>📅 Travel Date:</strong> ${new Date(booking.busId.date).toDateString()}</p>
            <p><strong>💰 Amount Paid:</strong> ₹${booking.amount}</p>
            <p><strong>📞 Contact:</strong> ${booking.passengerPhone}</p>
            <p><strong>📧 Email:</strong> ${booking.passengerEmail}</p>
            <hr>
            <p>Thank you for choosing our service. Have a safe journey! 🚀</p>
        </div>
    `;

    await sendMail(booking.passengerEmail, emailSubject, emailBody);

}

const validatePayment = asyncHandler(async (req, res) => {
    let transactionId = req.body.id;
    // const lockKey = req.body.lock;
    if (req.body.response != null) {
        const decodedResponse = Buffer.from(req.body.response, "base64").toString("utf-8");
        const paymentData = JSON.parse(decodedResponse);
        transactionId = paymentData.data.merchantTransactionId;
    }

    const existingStatus = await client.get(`payment:${transactionId}`);
    if (existingStatus === "CONFIRMED" || existingStatus === "FAILED") {
        return res.status(200).json(new ApiResponse(200, existingStatus === "CONFIRMED" ? "SUCCESS" : "FAILED"));
    }

    const booking = await Booking.findOne({ transactionId }).populate("busId");
    if (!booking) {
        return res.status(400).json({ message: "Booking not found" });
    }
    try {
        const data = await checkStatusApi(transactionId);
        // await client.del(lockKey);
        if (data && data.code == "PAYMENT_SUCCESS") {
            booking.status = "CONFIRMED";
            await booking.save();

            await BusRoute.findByIdAndUpdate(booking.busId, { $inc: { seatsAvailable: -1 } });
            await client.set(`payment:${transactionId}`, "CONFIRMED", { EX: 600 });
            await sendBusBookedMail(booking);
            return res.status(200).json(new ApiResponse(200, "SUCCESS", data));
        }
        else if (data && data.code === "PAYMENT_PENDING") {
            return res.status(202).json(new ApiResponse(200, "PENDING", data));
        } else {
            const seatKey = `bus:${booking.busId}:seats`;
            await client.incr(seatKey);
            booking.status = "FAILED";
            await booking.save();
            await client.set(`payment:${transactionId}`, "FAILED", { EX: 600 });
            return res.status(400).json(new ApiResponse(400, "FAILED", data));
        }
    }
    catch (error) {
        throw new ApiError(500, error.message || "Failed to validate payment");
    }



});

module.exports = { initiatePayment, validatePayment };

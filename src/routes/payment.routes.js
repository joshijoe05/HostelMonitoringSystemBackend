const express = require("express");
const verifyUser = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router.post("/initiate-payment", verifyUser, paymentController.initiatePayment);
router.post("/webhook", verifyUser, paymentController.handlePhonePeWebhook);


module.exports = router;
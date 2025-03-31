const express = require("express");
const verifyUser = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router.post("/initiate-payment", verifyUser, paymentController.initiatePayment);
router.get("/validate/:id", verifyUser, paymentController.validatePayment);


module.exports = router;
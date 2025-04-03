const axios = require("axios");
const ApiError = require("../utils/apiError");
require("dotenv").config();
const sha256 = require("sha256");

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL;

const initiatePhonePePayment = async (userId, transactionId, seatKey, amount) => {
    try {
        const normalPayLoad = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: transactionId,
            merchantUserId: userId,
            amount: amount * 100,
            redirectUrl: `${process.env.REDIRECT_URL}/${transactionId}/${seatKey}`,
            redirectMode: "REDIRECT",
            mobileNumber: "9999999999",
            paymentInstrument: {
                type: "PAY_PAGE",
            },
            callbackUrl: `${process.env.BASE_URL}/api/v1/payment/validate`,
        };

        const base64EncodedPayload = Buffer.from(JSON.stringify(normalPayLoad), "utf8").toString("base64");

        const stringToHash = base64EncodedPayload + "/pg/v1/pay" + PHONEPE_SALT_KEY;
        const sha256_val = sha256(stringToHash);
        const xVerifyChecksum = sha256_val + "###" + PHONEPE_SALT_INDEX;

        const response = await axios.post(
            `${PHONEPE_BASE_URL}/pg/v1/pay`,
            { request: base64EncodedPayload },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerifyChecksum,
                    accept: "application/json",
                },
            }
        );
        // console.log(response.data);
        if (response.data.success) {

            return response.data.data.instrumentResponse.redirectInfo.url;
        } else {
            throw new ApiError(400, response.data.message || "Payment initiation failed");
        }
    } catch (error) {
        console.error("PhonePe Payment Error:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to initiate payment");
    }
};

const checkStatusApi = async (merchantTransactionId) => {
    try {
        const statusUrl = `${PHONEPE_BASE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;

        const stringToHash = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}${PHONEPE_SALT_KEY}`;
        const sha256_val = sha256(stringToHash);
        const xVerifyChecksum = sha256_val + "###" + PHONEPE_SALT_INDEX;

        const response = await axios.get(statusUrl, {
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerifyChecksum,
                accept: "application/json",
            },
        });

        console.log("PhonePe Status Response:", response.data);
        return response.data;

    } catch (error) {
        console.error("PhonePe Payment Status Error:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to fetch payment status");
    }
};






module.exports = { initiatePhonePePayment, checkStatusApi };

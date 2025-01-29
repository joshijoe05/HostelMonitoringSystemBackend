const nodemailer = require('nodemailer');
const ApiError = require('../utils/apiError');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject,
        html,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    }
    catch (error) {
        console.log("Error sending email", error);
        throw new ApiError(500, "Error sending email");
    }
}

module.exports = sendMail;
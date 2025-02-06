const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require("path");
const authRouter = require("./routes/auth.routes");
const hostelRouter = require("./routes/hostel.routes");
const caretakerRouter = require("./routes/caretaker.routes");
const complaintRouter = require("./routes/complaint.routes");

const app = express();

// template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// cross origin
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// to access json body from the request
app.use(express.json({
    limit: "16kb"
}));

// type of body parser and also for encoding url
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

// when dealing with files
app.use(express.static("public"));

// when dealing with secure cookies
app.use(cookieParser());


app.get("/", async (req, res) => {
    res.send("Server is live !");
});


// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/hostel", hostelRouter);
app.use("/api/v1/caretaker", caretakerRouter);
app.use("/api/v1/complaints", complaintRouter);

module.exports = { app };
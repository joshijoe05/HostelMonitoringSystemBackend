const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

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


module.exports = { app };
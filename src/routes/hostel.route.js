const express = require("express");
const Hostel = require("../models/hostel.model");
const hostelController = require("../controllers/hostel.controller");

const router = express.Router();

router.route("/create").post(hostelController.createHostel);


module.exports = router;
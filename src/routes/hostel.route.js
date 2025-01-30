const express = require("express");
const verifyAdmin = require("../middlewares/admin.middleware");
const hostelController = require("../controllers/hostel.controller");

const router = express.Router();

router.route("/create").post(verifyAdmin, hostelController.createHostel);


module.exports = router;
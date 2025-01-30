const express = require("express");
const verifyAdmin = require("../middlewares/admin.middleware");
const hostelController = require("../controllers/hostel.controller");

const router = express.Router();

router.route("/create").post(verifyAdmin, hostelController.createHostel);
router.route("/").get(verifyAdmin, hostelController.getAllHostels);
router.route("/update/:id").get(verifyAdmin, hostelController.updateHostelById);
router.route("/delete/:id").get(verifyAdmin, hostelController.deleteHostelById);


module.exports = router;
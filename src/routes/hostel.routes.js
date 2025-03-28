const express = require("express");
const authorizeUserRoles = require("../middlewares/userRole.middleware");
const hostelController = require("../controllers/hostel.controller");

const router = express.Router();

router.route("/create").post(authorizeUserRoles("admin"), hostelController.createHostel);
router.route("/").get(hostelController.getAllHostels);
router.route("/update/:id").put(authorizeUserRoles("admin"), hostelController.updateHostelById);
router.route("/delete/:id").delete(authorizeUserRoles("admin"), hostelController.deleteHostelById);
router.route("/students").get(authorizeUserRoles("caretaker", "admin"), hostelController.getStudentsInHostel);


module.exports = router;
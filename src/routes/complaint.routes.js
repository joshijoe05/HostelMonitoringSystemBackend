const express = require("express");
const complaintController = require("../controllers/complaint.controller");
const authorizeUserRoles = require("../middlewares/userRole.middleware");

const router = express.Router();

router.route("/create").post(authorizeUserRoles("student"), complaintController.createComplaint);
router.route("/update/:id").put(authorizeUserRoles("student"), complaintController.updateComplaint);
router.route("/delete/:id").delete(authorizeUserRoles("student"), complaintController.deleteComplaint);
router.route("/update-status/:id").put(authorizeUserRoles("caretaker"), complaintController.updateComplaintStatus);
router.route("/").get(authorizeUserRoles("student"), complaintController.getRaisedComplaints);
router.route("/hostel").get(authorizeUserRoles("caretaker", "admin"), complaintController.getIssuesInHostel);

module.exports = router;
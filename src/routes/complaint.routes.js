const express = require("express");
const complaintController = require("../controllers/complaint.controller");
const authorizeUserRoles = require("../middlewares/userRole.middleware");
const upload = require("../middlewares/multer.middleware");
const verifyUser = require("../middlewares/auth.middleware");
const router = express.Router();

router.route("/create").post(authorizeUserRoles("student"), upload.fields([
    {
        name: "images",
        maxCount: 2
    },
]), complaintController.createComplaint);
router.route("/update/:id").put(authorizeUserRoles("student"), complaintController.updateComplaint);
router.route("/delete/:id").delete(authorizeUserRoles("student"), complaintController.deleteComplaint);
router.route("/update-status/:id").put(authorizeUserRoles("caretaker"), complaintController.updateComplaintStatus);
router.route("/").get(authorizeUserRoles("student"), complaintController.getRaisedComplaints);
router.route("/hostel").get(authorizeUserRoles("caretaker", "admin"), complaintController.getIssuesInHostel);
router.route("/comment/:id").post(verifyUser, complaintController.addCommentInIssue);

module.exports = router;
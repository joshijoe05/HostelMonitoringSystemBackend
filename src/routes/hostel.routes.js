const express = require("express");
const authorizeUserRoles = require("../middlewares/admin.middleware");
const hostelController = require("../controllers/hostel.controller");

const router = express.Router();

router.route("/create").post(authorizeUserRoles("admin"), hostelController.createHostel);
router.route("/").get(authorizeUserRoles("admin"), hostelController.getAllHostels);
router.route("/update/:id").put(authorizeUserRoles("admin"), hostelController.updateHostelById);
router.route("/delete/:id").delete(authorizeUserRoles("admin"), hostelController.deleteHostelById);


module.exports = router;
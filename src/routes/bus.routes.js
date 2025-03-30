const express = require("express");
const busController = require("../controllers/bus.controller");
const authorizeRoles = require("../middlewares/userRole.middleware");

const router = express.Router();


router.route("/form/create").post(authorizeRoles("admin"), busController.createBusForm);
router.route("/form/respond/:formId").post(authorizeRoles("student"), busController.respondToForm);
router.route("/form/stats/:formId").get(authorizeRoles("admin"), busController.getStatsOfForm);
router.route("/create").post(authorizeRoles("admin"), busController.createBusRoute);
router.route("/").get(authorizeRoles("admin"), busController.getAllBusRoutes);
router.route("/students").get(authorizeRoles("student"), busController.getBusRoutesForStudents);


module.exports = router;
const express = require("express");
const busController = require("../controllers/bus.controller");
const authorizeRoles = require("../middlewares/userRole.middleware");
const verifyUser = require("../middlewares/auth.middleware");

const router = express.Router();


router.route("/form/create").post(authorizeRoles("admin"), busController.createBusForm);
router.route("/form/respond/:formId").post(authorizeRoles("student"), busController.respondToForm);
router.route("/form/stats/:formId").get(authorizeRoles("admin"), busController.getStatsOfForm);
router.route("/form").get(authorizeRoles("admin"), busController.getBusForms);
router.route("/create").post(authorizeRoles("admin"), busController.createBusRoute);
router.route("/").get(authorizeRoles("admin"), busController.getAllBusRoutes);
router.route("/students").get(authorizeRoles("student"), busController.getBusRoutesForStudents);
router.route("/cities").get(verifyUser, busController.getAllCities);
router.route("/form-details/:formId").get(authorizeRoles("student"), busController.getFormDetailsForStudent);
router.route("/past-bookings").get(authorizeRoles("student"), busController.getPastBookingsOfStudent);
router.route("/bookings/:id").get(authorizeRoles("admin"), busController.getBookingsOfBusRoute);

module.exports = router;
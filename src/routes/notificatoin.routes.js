const express = require('express');
const notificationController = require("../controllers/notification.controller");
const verifyUser = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(verifyUser, notificationController.getUserNotifications);


module.exports = router;
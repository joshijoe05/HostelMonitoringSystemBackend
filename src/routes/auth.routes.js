const express = require('express');
const authController = require("../controllers/auth.controller");
const verifyUser = require("../middlewares/auth.middleware");

const router = express.Router();

// router.route("/register").post();

router.route("/login").post(authController.loginUser);

// protected routes
router.route("/logout").get(verifyUser, authController.logoutUser);

module.exports = router;
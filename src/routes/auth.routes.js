const express = require('express');
const authController = require("../controllers/auth.controller");
const verifyUser = require("../middlewares/auth.middleware");

const router = express.Router();

// router.route("/register").post();

router.route("/login").post(authController.loginUser);
router.route("/get-access-token").post(authController.getAccessTokenFromRefreshToken);

// protected routes
router.route("/logout").get(verifyUser, authController.logoutUser);
router.route("/change-password").post(authController.changeAccountPassword);

module.exports = router;
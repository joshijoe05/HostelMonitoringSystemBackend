const express = require('express');
const authController = require("../controllers/auth.controller");
const verifyUser = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/register").post(authController.registerUser);
router.route("/verify/:id").get(authController.verifyUser);
router.route("/login").post(authController.loginUser);
router.route("/get-access-token").post(authController.getAccessTokenFromRefreshToken);

// protected routes
router.route("/logout").post(verifyUser, authController.logoutUser);
router.route("/change-password").post(verifyUser, authController.changeAccountPassword);

module.exports = router;
const express = require('express');
const authController = require("../controllers/auth.controller");
const router = express.Router();

// router.route("/register").post();

router.route("/login").post(authController.loginUser);

module.exports = router;
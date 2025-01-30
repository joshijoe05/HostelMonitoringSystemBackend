const express = require("express");
const careTakerController = require("../controllers/auth.controller");
const verifyAdmin = require("../middlewares/admin.middleware");

const router = express.Router();

router.route("/create").post(verifyAdmin, careTakerController.createCaretaker);

module.exports = router;
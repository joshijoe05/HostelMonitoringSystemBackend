const express = require("express");
const careTakerController = require("../controllers/auth.controller");
const verifyAdmin = require("../middlewares/admin.middleware");

const router = express.Router();

router.route("/create").post(verifyAdmin, careTakerController.createCaretaker);
router.route("/").get(verifyAdmin, careTakerController.getAllCaretakers);
router.route("/update/:id").put(verifyAdmin, careTakerController.updaateCaretakerById);
router.route("/delete/:id").delete(verifyAdmin, careTakerController.deleteCaretakerById);

module.exports = router;
const express = require("express");
const careTakerController = require("../controllers/caretaker.controller");
const authorizeUserRoles = require("../middlewares/userRole.middleware");

const router = express.Router();

router.route("/create").post(authorizeUserRoles("admin"), careTakerController.createCaretaker);
router.route("/").get(authorizeUserRoles("admin"), careTakerController.getAllCaretakers);
router.route("/update/:id").put(authorizeUserRoles("admin"), careTakerController.updateCaretakerById);
router.route("/delete/:id").delete(authorizeUserRoles("admin"), careTakerController.deleteCaretakerById);

module.exports = router;
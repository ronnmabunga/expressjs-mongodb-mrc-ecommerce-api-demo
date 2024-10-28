const express = require("express");
const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/details", verify, userController.getUserDetails);
router.get("/all", verify, verifyAdmin, userController.getAllUserDetails);
router.patch("/:id/set-as-admin", verify, verifyAdmin, userController.setUserAsAdmin);
router.patch("/update-password", verify, userController.updateUserPassword);
router.patch("/update-profile", verify, userController.updateUserDetails);
router.post("/:userId/imageUpload", verify, upload.single("image"), userController.uploadUserImage);
module.exports = router;

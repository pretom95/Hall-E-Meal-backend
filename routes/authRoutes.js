const express = require("express");
const router = express.Router();
const { registerStudent, signIn } = require("../controllers/authController");

router.post("/register-student", registerStudent);
router.post("/signin", signIn);


module.exports = router;

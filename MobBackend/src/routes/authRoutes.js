const express = require("express");
const { body } = require("express-validator");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  register,
  login,
  logout,
  refreshToken,
} = require("../controllers/authController");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone").isMobilePhone().withMessage("Valid phone number is required"),
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Valid date of birth is required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    ),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
console.log("REGISTER TYPE:", typeof register); // should log: function

// Routes
router.post("/register", registerValidation, (req, res) => {
  res.send("Test passed");
});

router.post("/login", loginValidation, login);
router.post("/logout", authenticateToken, logout);
router.post("/refresh-token", authenticateToken, refreshToken);

module.exports = router;

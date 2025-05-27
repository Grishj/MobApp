const express = require("express");
const { body } = require("express-validator");
const {
  authenticateToken,
  requireVerified,
} = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  getAccounts,
} = require("../controllers/userController");

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number is required"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address must be less than 200 characters"),
  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be less than 100 characters"),
  body("state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State must be less than 50 characters"),
  body("zipCode")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Zip code must be less than 20 characters"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must be at least 8 characters with uppercase, lowercase, number, and special character"
    ),
];

// Routes
router.get("/profile", authenticateToken, getProfile);
router.put(
  "/profile",
  authenticateToken,
  updateProfileValidation,
  updateProfile
);
router.post(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  changePassword
);
router.get("/accounts", authenticateToken, requireVerified, getAccounts);

module.exports = router;

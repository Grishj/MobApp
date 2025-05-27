const express = require("express");
const { body, param } = require("express-validator");
const {
  authenticateToken,
  requireVerified,
} = require("../middlewares/authMiddleware");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  getAccountBalance,
} = require("../controllers/transactionController");

const router = express.Router();

// Validation rules
const createTransactionValidation = [
  body("type")
    .isIn(["TRANSFER", "DEPOSIT", "WITHDRAWAL", "PAYMENT"])
    .withMessage("Invalid transaction type"),
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("senderAccountId")
    .isUUID()
    .withMessage("Valid sender account ID is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("receiverAccountId")
    .optional()
    .isUUID()
    .withMessage("Valid receiver account ID required"),
  body("receiverEmail")
    .optional()
    .isEmail()
    .withMessage("Valid receiver email required"),
  body("receiverName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Receiver name must be less than 100 characters"),
];

const getTransactionValidation = [
  param("id").isUUID().withMessage("Valid transaction ID is required"),
];

const getBalanceValidation = [
  param("accountId").isUUID().withMessage("Valid account ID is required"),
];

// Routes
router.post(
  "/",
  authenticateToken,
  requireVerified,
  createTransactionValidation,
  createTransaction
);
router.get("/", authenticateToken, requireVerified, getTransactions);
router.get(
  "/:id",
  authenticateToken,
  requireVerified,
  getTransactionValidation,
  getTransactionById
);
router.get(
  "/balance/:accountId",
  authenticateToken,
  requireVerified,
  getBalanceValidation,
  getAccountBalance
);

module.exports = router;

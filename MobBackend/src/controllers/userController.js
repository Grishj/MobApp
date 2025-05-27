const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const prisma = new PrismaClient();

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isVerified: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
            isActive: true,
            createdAt: true,
          },
        },
        cards: {
          where: { isActive: true },
          select: {
            id: true,
            cardNumber: true,
            cardType: true,
            expiryMonth: true,
            expiryYear: true,
            holderName: true,
            accountId: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { firstName, lastName, phone, address, city, state, zipCode } =
      req.body;

    // Check if phone is already taken by another user
    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id: req.user.id },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        cards: {
          where: { isActive: true },
          select: {
            id: true,
            cardNumber: true,
            cardType: true,
            expiryMonth: true,
            expiryYear: true,
            holderName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAccounts,
};

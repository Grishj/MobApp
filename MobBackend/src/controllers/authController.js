const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");

const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Generate account number
const generateAccountNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      email,
      phone,
      firstName,
      lastName,
      dateOfBirth,
      password,
      address,
      city,
      state,
      zipCode,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with default checking account
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          password: hashedPassword,
          address,
          city,
          state,
          zipCode,
        },
      });

      // Create default checking account
      const account = await tx.account.create({
        data: {
          accountNumber: generateAccountNumber(),
          accountType: "CHECKING",
          balance: 0,
          userId: user.id,
        },
      });

      return { user, account };
    });

    // Generate token
    const token = generateToken(result.user.id);

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userWithoutPassword,
        account: result.account,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const logout = async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // You could implement token blacklisting here if needed
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

const refreshToken = async (req, res) => {
  try {
    // Generate new token for authenticated user
    const token = generateToken(req.user.id);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
};

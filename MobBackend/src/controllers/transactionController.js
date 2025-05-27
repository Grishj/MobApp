const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");

const prisma = new PrismaClient();

// Generate transaction reference
const generateReference = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      type,
      amount,
      description,
      senderAccountId,
      receiverAccountId,
      receiverEmail,
      receiverName,
    } = req.body;

    // Validate sender account belongs to user
    const senderAccount = await prisma.account.findFirst({
      where: {
        id: senderAccountId,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: "Sender account not found or inactive",
      });
    }

    // Check if sender has sufficient balance for transfers and payments
    if (["TRANSFER", "PAYMENT"].includes(type)) {
      if (parseFloat(senderAccount.balance) < parseFloat(amount)) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance",
        });
      }
    }

    // Validate receiver account for transfers
    let receiverAccount = null;
    if (type === "TRANSFER" && receiverAccountId) {
      receiverAccount = await prisma.account.findFirst({
        where: {
          id: receiverAccountId,
          isActive: true,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!receiverAccount) {
        return res.status(404).json({
          success: false,
          message: "Receiver account not found or inactive",
        });
      }
    }

    // Create transaction using database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type,
          amount: parseFloat(amount),
          description,
          reference: generateReference(),
          status: "COMPLETED", // Simplified - in real app, handle pending states
          senderId: req.user.id,
          senderAccountId,
          receiverAccountId: receiverAccountId || null,
          receiverName:
            receiverName ||
            (receiverAccount
              ? `${receiverAccount.user.firstName} ${receiverAccount.user.lastName}`
              : null),
          receiverEmail:
            receiverEmail ||
            (receiverAccount ? receiverAccount.user.email : null),
          completedAt: new Date(),
        },
      });

      // Update account balances based on transaction type
      switch (type) {
        case "TRANSFER":
          // Deduct from sender
          await tx.account.update({
            where: { id: senderAccountId },
            data: { balance: { decrement: parseFloat(amount) } },
          });

          // Add to receiver
          if (receiverAccountId) {
            await tx.account.update({
              where: { id: receiverAccountId },
              data: { balance: { increment: parseFloat(amount) } },
            });
          }
          break;

        case "DEPOSIT":
          // Add to account
          await tx.account.update({
            where: { id: senderAccountId },
            data: { balance: { increment: parseFloat(amount) } },
          });
          break;

        case "WITHDRAWAL":
        case "PAYMENT":
          // Deduct from account
          await tx.account.update({
            where: { id: senderAccountId },
            data: { balance: { decrement: parseFloat(amount) } },
          });
          break;
      }

      return transaction;
    });

    // Fetch complete transaction details
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senderAccount: {
          select: {
            accountNumber: true,
            accountType: true,
            balance: true,
          },
        },
        receiverAccount: {
          select: {
            accountNumber: true,
            accountType: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Transaction completed successfully",
      data: completeTransaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Transaction failed",
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, accountId } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      OR: [
        { senderId: req.user.id },
        {
          receiverAccount: {
            userId: req.user.id,
          },
        },
      ],
    };

    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.OR = [
        { senderAccountId: accountId, senderId: req.user.id },
        { receiverAccountId: accountId },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          senderAccount: {
            select: {
              accountNumber: true,
              accountType: true,
            },
          },
          receiverAccount: {
            select: {
              accountNumber: true,
              accountType: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        OR: [
          { senderId: req.user.id },
          {
            receiverAccount: {
              userId: req.user.id,
            },
          },
        ],
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senderAccount: {
          select: {
            accountNumber: true,
            accountType: true,
          },
        },
        receiverAccount: {
          select: {
            accountNumber: true,
            accountType: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
};

const getAccountBalance = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user.id,
        isActive: true,
      },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        currency: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account balance",
    });
  }
};

const getTransactionStats = async (req, res) => {
  try {
    const { accountId, period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause for user's transactions
    const where = {
      OR: [
        { senderId: req.user.id },
        {
          receiverAccount: {
            userId: req.user.id,
          },
        },
      ],
      createdAt: {
        gte: startDate,
      },
    };

    if (accountId) {
      where.OR = [
        { senderAccountId: accountId, senderId: req.user.id },
        { receiverAccountId: accountId },
      ];
    }

    const [totalTransactions, totalIncome, totalExpense, recentTransactions] =
      await Promise.all([
        // Total transaction count
        prisma.transaction.count({ where }),

        // Total income (deposits and incoming transfers)
        prisma.transaction.aggregate({
          where: {
            ...where,
            OR: [
              { type: "DEPOSIT", senderId: req.user.id },
              {
                type: "TRANSFER",
                receiverAccount: { userId: req.user.id },
              },
            ],
          },
          _sum: { amount: true },
        }),

        // Total expenses (withdrawals, payments, outgoing transfers)
        prisma.transaction.aggregate({
          where: {
            ...where,
            OR: [
              { type: "WITHDRAWAL", senderId: req.user.id },
              { type: "PAYMENT", senderId: req.user.id },
              { type: "TRANSFER", senderId: req.user.id },
            ],
          },
          _sum: { amount: true },
        }),

        // Recent transactions for quick view
        prisma.transaction.findMany({
          where,
          include: {
            senderAccount: {
              select: { accountNumber: true, accountType: true },
            },
            receiverAccount: {
              select: { accountNumber: true, accountType: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const stats = {
      period: `${days} days`,
      totalTransactions,
      totalIncome: totalIncome._sum.amount || 0,
      totalExpense: totalExpense._sum.amount || 0,
      netAmount:
        (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
      recentTransactions,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction statistics",
    });
  }
};

// Cleanup function to close Prisma connection
const cleanup = async () => {
  await prisma.$disconnect();
};

// Handle process termination
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getAccountBalance,
  getTransactionStats,
};

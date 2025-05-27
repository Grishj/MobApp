import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AccountCard = ({ account, onPress }) => {
  const formatBalance = (balance) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.currency || "USD",
    }).format(balance);
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case "CHECKING":
        return "card-outline";
      case "SAVINGS":
        return "wallet-outline";
      case "CREDIT":
        return "card";
      default:
        return "card-outline";
    }
  };

  return (
    <TouchableOpacity style={styles.accountCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.accountInfo}>
          <Ionicons
            name={getAccountTypeIcon(account.accountType)}
            size={24}
            color="#4A90E2"
          />
          <View style={styles.accountDetails}>
            <Text style={styles.accountType}>
              {account.accountType.charAt(0) +
                account.accountType.slice(1).toLowerCase()}{" "}
              Account
            </Text>
            <Text style={styles.accountNumber}>
              ****{account.accountNumber.slice(-4)}
            </Text>
          </View>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatBalance(account.balance)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TransactionCard = ({ transaction, userAccountIds }) => {
  const isOutgoing = userAccountIds.includes(transaction.senderAccountId);
  const isIncoming = userAccountIds.includes(transaction.receiverAccountId);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: transaction.currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "TRANSFER":
        return "swap-horizontal-outline";
      case "DEPOSIT":
        return "arrow-down-outline";
      case "WITHDRAWAL":
        return "arrow-up-outline";
      case "PAYMENT":
        return "card-outline";
      default:
        return "swap-horizontal-outline";
    }
  };

  const getAmountColor = () => {
    if (transaction.type === "DEPOSIT" || isIncoming) {
      return "#4CAF50"; // Green for incoming money
    } else if (
      transaction.type === "WITHDRAWAL" ||
      transaction.type === "PAYMENT" ||
      isOutgoing
    ) {
      return "#F44336"; // Red for outgoing money
    }
    return "#757575"; // Gray for neutral
  };

  const getDisplayAmount = () => {
    const amount = formatAmount(transaction.amount);
    if (transaction.type === "DEPOSIT" || isIncoming) {
      return `+${amount}`;
    } else if (
      transaction.type === "WITHDRAWAL" ||
      transaction.type === "PAYMENT" ||
      isOutgoing
    ) {
      return `-${amount}`;
    }
    return amount;
  };

  const getTransactionTitle = () => {
    switch (transaction.type) {
      case "TRANSFER":
        if (isOutgoing) {
          return `Transfer to ${transaction.receiverName || "Account"}`;
        } else if (isIncoming) {
          return `Transfer from ${transaction.sender?.firstName || "Account"}`;
        }
        return "Transfer";
      case "DEPOSIT":
        return "Deposit";
      case "WITHDRAWAL":
        return "Withdrawal";
      case "PAYMENT":
        return `Payment${
          transaction.description ? ` - ${transaction.description}` : ""
        }`;
      default:
        return transaction.type;
    }
  };

  return (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getTransactionIcon(transaction.type)}
              size={20}
              color="#4A90E2"
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>{getTransactionTitle()}</Text>
            <Text style={styles.transactionDate}>
              {formatDate(transaction.createdAt)}
            </Text>
            {transaction.reference && (
              <Text style={styles.transactionReference}>
                Ref: {transaction.reference}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.transactionAmount, { color: getAmountColor() }]}>
            {getDisplayAmount()}
          </Text>
          <Text style={styles.transactionStatus}>{transaction.status}</Text>
        </View>
      </View>
      {transaction.description && transaction.type !== "PAYMENT" && (
        <Text style={styles.transactionDescription}>
          {transaction.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const QuickActionCard = ({
  icon,
  title,
  subtitle,
  onPress,
  backgroundColor = "#F5F5F5",
}) => {
  return (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={28} color="#4A90E2" />
      <Text style={styles.quickActionTitle}>{title}</Text>
      {subtitle && <Text style={styles.quickActionSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const StatCard = ({ title, value, icon, trend, trendValue }) => {
  const getTrendColor = () => {
    if (trend === "up") return "#4CAF50";
    if (trend === "down") return "#F44336";
    return "#757575";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "trending-up-outline";
    if (trend === "down") return "trending-down-outline";
    return "remove-outline";
  };

  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color="#4A90E2" />
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Account Card Styles
  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountDetails: {
    marginLeft: 12,
    flex: 1,
  },
  accountType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: "#666666",
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A90E2",
  },

  // Transaction Card Styles
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#4A90E2",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 10,
    color: "#999999",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 10,
    color: "#666666",
    textTransform: "uppercase",
  },
  transactionDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  // Quick Action Card Styles
  quickActionCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginTop: 8,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },

  // Stat Card Styles
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#666666",
    textTransform: "uppercase",
  },
});

export { AccountCard, TransactionCard, QuickActionCard, StatCard };

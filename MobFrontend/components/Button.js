import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = "primary",
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    if (variant === "primary") {
      baseStyle.push(styles.primaryButton);
    } else if (variant === "secondary") {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === "outline") {
      baseStyle.push(styles.outlineButton);
    }

    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    if (variant === "primary") {
      baseStyle.push(styles.primaryButtonText);
    } else if (variant === "secondary") {
      baseStyle.push(styles.secondaryButtonText);
    } else if (variant === "outline") {
      baseStyle.push(styles.outlineButtonText);
    }

    if (disabled) {
      baseStyle.push(styles.disabledButtonText);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: "#4A90E2",
  },
  secondaryButton: {
    backgroundColor: "#6C757D",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
  },
  outlineButtonText: {
    color: "#4A90E2",
  },
  disabledButtonText: {
    color: "#999999",
  },
});

export default Button;

import React, { useEffect, useState } from "react";
import { Animated, Text, StyleSheet, Dimensions, View } from "react-native";
import { CheckCircle, AlertCircle, Info } from "lucide-react-native";

const { width } = Dimensions.get("window");

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onHide?: () => void;
};

export default function ToastOverlay({
  message,
  type = "info",
  duration = 2500,
  onHide,
}: ToastProps) {
  const [translateY] = useState(new Animated.Value(100));
  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    info: "#3b82f6",
  };

  const icons = {
    success: <CheckCircle size={20} color={colors.success} />,
    error: <AlertCircle size={20} color={colors.error} />,
    info: <Info size={20} color={colors.info} />,
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onHide && onHide());
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          borderLeftColor: colors[type],
        },
      ]}
    >
      <View style={styles.row}>
        {icons[type]}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120, // 👈 всплывает над нижней панелью
    alignSelf: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    width: width * 0.9,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    flexShrink: 1,
  },
});

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { BarChart2 } from "lucide-react-native";

export default function StatisticsScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [stats, setStats] = useState({
    total: 24,
    inTransit: 10,
    delivered: 12,
    archived: 2,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, []);

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>📊 Статистика отправлений</Text>

      <View style={styles.cardsContainer}>
        <StatCard label="Всего посылок" value={stats.total} color="#3b82f6" />
        <StatCard label="В пути" value={stats.inTransit} color="#facc15" />
        <StatCard label="Доставлено" value={stats.delivered} color="#22c55e" />
        <StatCard label="В архиве" value={stats.archived} color="#a855f7" />
      </View>

      <View style={styles.iconWrap}>
        <BarChart2 size={80} color="#3b82f6" />
        <Text style={styles.subText}>Данные обновляются автоматически</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  card: {
    flexBasis: "48%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderColor: "#3b82f6",
  },
  value: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 4,
  },
  iconWrap: {
    alignItems: "center",
    marginTop: 60,
  },
  subText: {
    color: "#666",
    fontSize: 13,
    marginTop: 8,
  },
});

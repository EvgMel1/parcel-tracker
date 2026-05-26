import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Bell, Moon, Info, Trash2 } from "lucide-react-native";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleClearData = () => {
    Alert.alert(
      "Очистить данные?",
      "Все посылки и архив будут удалены без возможности восстановления.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Очистить",
          style: "destructive",
          onPress: () => console.log("Данные очищены"),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>⚙️ Настройки</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Общие</Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Тёмная тема</Text>
            <Text style={styles.subLabel}>Использовать тёмное оформление</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            thumbColor={darkMode ? "#3b82f6" : "#ccc"}
            trackColor={{ true: "#1e3a8a", false: "#444" }}
          />
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Уведомления</Text>
            <Text style={styles.subLabel}>
              Получать уведомления о статусе посылок
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={notifications ? "#3b82f6" : "#ccc"}
            trackColor={{ true: "#1e3a8a", false: "#444" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>

        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => Alert.alert("О приложении", "TrackMate v1.0.0")}
        >
          <Info size={20} color="#3b82f6" />
          <Text style={styles.infoText}>О приложении</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoRow} onPress={handleClearData}>
          <Trash2 size={20} color="#ef4444" />
          <Text style={[styles.infoText, { color: "#ef4444" }]}>
            Очистить все данные
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2025 TrackMate</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  header: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  sectionTitle: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  subLabel: {
    color: "#777",
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  infoText: {
    color: "#fff",
    fontSize: 15,
  },
  footer: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 30,
  },
});

import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  DeviceEventEmitter,
} from "react-native";
import { Tabs, useSegments } from "expo-router";
import { BlurView } from "expo-blur";
import { Home, Archive, Plus, Trash2 } from "lucide-react-native";
import { useFonts } from "expo-font";

const BUTTON_SIZE = 70;

export default function TabLayout() {
  const segments = useSegments();
  // / (tabs) / archive → сегменты типа ["(tabs)", "archive"]
  const currentScreen =
    segments.length > 1 ? segments[1] : segments[0];
  const isArchive = currentScreen === "archive";

  // 🔢 количество записей в архиве
  const [archiveCount, setArchiveCount] = useState(0);

  // слушаем обновления архива от Archive.tsx
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "archiveCountUpdate",
      (count) => {
        // на всякий случай защитимся
        const n = typeof count === "number" ? count : 0;
        setArchiveCount(n);
      }
    );
    return () => sub.remove();
  }, []);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular: require("../../assets/fonts/Poppins-Regular.ttf"),
    Poppins_500Medium: require("../../assets/fonts/Poppins-Medium.ttf"),
    Poppins_600SemiBold: require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 80,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={60}
              tint="dark"
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(15,15,15,0.7)",
                borderTopColor: "#1a1a1a",
                borderTopWidth: 0.5,
              }}
            />
          ),
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#6b7280",
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "Poppins_500Medium",
            marginBottom: 5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Parcels",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            tabBarItemStyle: { marginRight: BUTTON_SIZE * 0.5 },
          }}
        />

        <Tabs.Screen
  name="archive"
  listeners={{
    tabPress: () => {
      DeviceEventEmitter.emit("requestArchive");
    },
  }}
  options={{
    title: "Archive",
    tabBarIcon: ({ color }) => <Archive size={24} color={color} />,
    tabBarItemStyle: { marginLeft: BUTTON_SIZE * 0.5 },
  }}
/>
      </Tabs>

      {/* Плавающая кнопка */}
      <View style={styles.plusButtonContainer}>
        <TouchableOpacity
          activeOpacity={isArchive && archiveCount === 0 ? 1 : 0.9}
          onPress={() => {
            if (isArchive) {
              // архивный экран
              if (archiveCount > 0) {
                DeviceEventEmitter.emit("clearArchivePress");
              }
              // если 0 — ничего не делаем
            } else {
              // экран посылок
              DeviceEventEmitter.emit("openTrackerSheet");
            }
          }}
          style={[
            styles.plusButton,
            isArchive && {
              backgroundColor:
                archiveCount > 0 ? "#EF4444" : "#555555",
              opacity: archiveCount > 0 ? 1 : 0.5,
            },
          ]}
        >
          {isArchive ? (
            <Trash2 size={28} color="#fff" />
          ) : (
            <Plus size={32} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plusButtonContainer: {
    position: "absolute",
    bottom: 45,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  plusButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 12,
  },
});

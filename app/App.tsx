import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Archive, BarChart2, Settings } from "lucide-react-native";
import HomeScreen from "./(tabs)/index";
import ArchiveScreen from "./screens/ArchiveScreen";
import StatisticsScreen from "./screens/StatisticsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import Toast, {
  BaseToast,
  ErrorToast,
  ToastProps,
} from "react-native-toast-message";

const Tab = createBottomTabNavigator();

const toastConfig = {
  success: (props: ToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        backgroundColor: "#111",
        borderRadius: 12,
        marginHorizontal: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        color: "#aaa",
        fontSize: 14,
      }}
    />
  ),
  error: (props: ToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        backgroundColor: "#111",
        borderRadius: 12,
        marginHorizontal: 10,
      }}
      text1Style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        color: "#aaa",
        fontSize: 14,
      }}
    />
  ),
  info: (props: ToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#3b82f6",
        backgroundColor: "#111",
        borderRadius: 12,
        marginHorizontal: 10,
      }}
      text1Style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
      }}
      text2Style={{
        color: "#aaa",
        fontSize: 14,
      }}
    />
  ),
};

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#0f0f0f",
              borderTopColor: "#1a1a1a",
              height: 70,
              paddingBottom: 10,
            },
            tabBarActiveTintColor: "#3b82f6",
            tabBarInactiveTintColor: "#888",
          }}
        >
          <Tab.Screen
            name="Главная"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color }) => <Home size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name="Архив"
            component={ArchiveScreen}
            options={{
              tabBarIcon: ({ color }) => <Archive size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name="Статистика"
            component={StatisticsScreen}
            options={{
              tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name="Настройки"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      <Toast config={toastConfig} position="top" />
    </>
  );
}

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, RefreshCw } from "lucide-react-native";

// ✅ Типы пропсов
type ParcelHeaderProps = {
  onBack: () => void;
  onRefresh: () => void;
};

export default function ParcelHeader({ onBack, onRefresh }: ParcelHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.row}>

          {/* LEFT BUTTON */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft width={22} height={22} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* CENTER TITLE */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Parcel Details</Text>
            <Text style={styles.subtitle}>Tracking info</Text>
          </View>

          {/* RIGHT BUTTON */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw width={22} height={22} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#004BFF",
  },
  header: {
    backgroundColor: "#004BFF",
    paddingHorizontal: 18,
    paddingBottom: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins_400Regular",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginTop: -2,
  },
});

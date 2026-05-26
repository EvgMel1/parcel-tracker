import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchIcon from "../../assets/icons/search.svg";
import ArchiveBoxIcon from "../../assets/icons/archive-box.svg";
import ChartIcon from "../../assets/icons/chart.svg";
import FilterIcon from "../../assets/icons/filter.svg";
import PackageIcon from "../../assets/icons/package.svg";
import { ArrowLeft } from "lucide-react-native";

type HeaderProps = {
  title?: string; // 🔹 Позволяет задать собственный заголовок
  subtitle?: string; // 🔹 Позволяет задать собственный подзаголовок
  onSearchPress?: () => void; // 🔹 Поиск
  showBackButton?: boolean; // 🔹 Флаг: показывать ли кнопку "Назад"
  onBackPress?: () => void; // 🔹 Обработчик кнопки "Назад"
};

export default function Header({
  title = "My parcels",
  subtitle,
  onSearchPress,
  showBackButton = false,
  onBackPress,
}: HeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.row}>
          {/* Левая зона */}
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <ArrowLeft width={22} height={22} color="#fff" strokeWidth={2.2} />

            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <SearchIcon width={22} height={22} fill="#fff" />
            </TouchableOpacity>
          )}

          {/* Центральная зона */}
          <View
  style={[
    styles.titleBlock,
    { alignItems: "center" }, // 👈 Всегда центрируем, даже при showBackButton
  ]}
>
  <View
  style={[
    styles.titleRow,
    showBackButton && { transform: [{ translateX: -50 }] },
  ]}
>
 {title === "Archive" ? (
  <ArchiveBoxIcon width={18} height={18} fill="#fff" />
) : (
    <PackageIcon width={22} height={22} fill="#fff" />
  )}
  <Text style={styles.title}>{title}</Text>
</View>
  {subtitle ? (
    <Text style={[styles.subtitle, showBackButton && { textAlign: "left", alignSelf: "flex-start" }]}>
      {subtitle}
    </Text>
  ) : !showBackButton ? (
    <Text style={styles.subtitle}>Free plan</Text>
  ) : (
    <Text style={[styles.subtitle, { opacity: 0 }]}>placeholder</Text>
  )}
</View>


          {/* Правая зона */}
          {!showBackButton ? (
            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.iconCircle}>
                <ChartIcon width={22} height={22} fill="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconCircle, { marginLeft: 10 }]}>
                <FilterIcon width={22} height={22} fill="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <SearchIcon width={22} height={22} fill="#fff" />
            </TouchableOpacity>
          )}
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
  justifyContent: "center",
  alignItems: "center",
},
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins_400Regular",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    right: 9,
    fontFamily: "Poppins_400Regular",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});

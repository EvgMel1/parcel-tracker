import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { PackageOpen, Trash2 } from "lucide-react-native";

export default function ArchiveScreen() {
  const [archivedParcels, setArchivedParcels] = useState([
    { id: 1, number: "RR123456789CN", title: "Книга с AliExpress" },
    { id: 2, number: "LW987654321US", title: "Посылка из США" },
  ]);

  const handleDelete = (id: number) => {
    setArchivedParcels((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Архив отправлений</Text>

      {archivedParcels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <PackageOpen size={80} color="#3b82f6" />
          <Text style={styles.emptyText}>Архив пока пуст</Text>
          <Text style={styles.subText}>
            Завершённые посылки будут отображаться здесь.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {archivedParcels.map((parcel) => (
            <View key={parcel.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.number}>{parcel.number}</Text>
                <Text style={styles.titleText}>
                  {parcel.title || "Без описания"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(parcel.id)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
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
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 15,
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  number: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  titleText: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  subText: {
    color: "#777",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 30,
  },
});

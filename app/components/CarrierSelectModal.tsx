import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

type Carrier = {
  id: number;
  name: string;
  country?: string;
};

type CarrierSelectModalProps = {
  show: boolean;
  onClose: () => void;
  onSelect: (carrier: Carrier) => void;
};

export default function CarrierSelectModal({
  show,
  onClose,
  onSelect,
}: CarrierSelectModalProps) {
  const [search, setSearch] = useState("");
  const [carrierList, setCarrierList] = useState<Carrier[]>([]);
  const [filtered, setFiltered] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем список перевозчиков с API
  useEffect(() => {
    if (!show) return;
    setLoading(true);
    fetch("/api/carriers")
      .then((res) => res.json())
      .then((data) => {
        const list = data.data || data || [];
        setCarrierList(list);
        setFiltered(list);
      })
      .catch((err) => {
        console.error("Carrier load error:", err);
        setError("Не удалось загрузить список перевозчиков");
      })
      .finally(() => setLoading(false));
  }, [show]);

  // Фильтр по поиску
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      carrierList.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.country && c.country.toLowerCase().includes(q))
      )
    );
  }, [search, carrierList]);

  if (!show) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Выберите перевозчика</Text>

        <TextInput
          style={styles.input}
          placeholder="Поиск по названию или стране..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Загрузка перевозчиков...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => onSelect(item)}
              >
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.country && (
                    <Text style={styles.itemCountry}>{item.country}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noResults}>Ничего не найдено</Text>
            }
          />
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 💅 Темная тема + адаптивные стили
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    paddingHorizontal: 10,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 10,
    fontSize: 15,
  },
  list: {
    marginBottom: 12,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  itemName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  itemCountry: {
    color: "#9ca3af",
    fontSize: 14,
  },
  noResults: {
    textAlign: "center",
    color: "#9ca3af",
    marginVertical: 16,
  },
  errorText: {
    textAlign: "center",
    color: "#f87171",
    marginVertical: 12,
  },
  cancelButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Truck } from "lucide-react-native";
import CarrierSelectModal from "./CarrierSelectModal";

type Carrier = {
  id: number;
  name: string;
  country?: string;
};

type EditParcelModalProps = {
  visible: boolean;
  onClose: () => void;
  initialNumber: string;
  initialCarrier: Carrier;
  onSubmit: (data: {
    number: string;
    carrier: Carrier;
    responseData: any;
  }) => void;
};

export default function EditParcelModal({
  visible,
  onClose,
  initialNumber,
  initialCarrier,
  onSubmit,
}: EditParcelModalProps) {
  const [trackingNumber, setTrackingNumber] = useState(initialNumber || "");
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>(
    initialCarrier || { id: 1, name: "Авто поиск" }
  );
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTrackingNumber(initialNumber || "");
      setSelectedCarrier(initialCarrier || { id: 100003, name: "Авто поиск" });
    }
  }, [visible, initialNumber, initialCarrier]);

  const handleSave = async () => {
  const trimmed = trackingNumber.trim();
  if (!trimmed) return;

  setLoading(true);
  try {
    // 🧠 если выбран “Авто поиск” — не передаем carrier
    const carrierParam =
      selectedCarrier.name === "Авто поиск" || selectedCarrier.id === 1
        ? ""
        : `&carrier=${selectedCarrier.id}`;

    const res = await fetch(`/api/track?number=${trimmed}${carrierParam}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 🧩 проверяем ответ
    if (!data || data.error || !data.status) {
      Alert.alert(
        "Отправление не найдено",
        "Ваше отправление не найдено. Проверьте правильность выбора перевозчика или попробуйте позже."
      );
      return;
    }

    onSubmit({
      number: trimmed,
      carrier: selectedCarrier,
      responseData: data,
    });
    onClose();
  } catch (e) {
    console.error("Ошибка обновления посылки:", e);
    Alert.alert("Ошибка", "Не удалось получить данные по новому трек-номеру.");
  } finally {
    setLoading(false);
  }
};


  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <View style={styles.modal}>
            <Text style={styles.title}>Изменить посылку</Text>

            <Text style={styles.label}>Трек-номер</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите новый трек..."
              placeholderTextColor="#666"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              autoCapitalize="characters"
              editable={!loading}
              blurOnSubmit={true}
            />

            <Text style={styles.label}>Курьер</Text>
            <TouchableOpacity
              style={[styles.carrierButton, loading && { opacity: 0.5 }]}
              disabled={loading}
              onPress={() => setShowCarrierModal(true)}
            >
              <Truck size={18} color="#3b82f6" />
              <Text style={styles.carrierText}>{selectedCarrier.name}</Text>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.saveBtn]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Сохранить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showCarrierModal && (
        <CarrierSelectModal
          show={showCarrierModal}
          onClose={() => setShowCarrierModal(false)}
          onSelect={(carrier) => {
            setSelectedCarrier(carrier);
            setShowCarrierModal(false);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
  },
  modal: {
    width: "85%",
    alignSelf: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  carrierButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  carrierText: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "600",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 8,
  },
  saveBtn: {
    backgroundColor: "#3b82f6",
  },
  cancelText: {
    color: "#bbb",
    fontSize: 15,
  },
  saveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

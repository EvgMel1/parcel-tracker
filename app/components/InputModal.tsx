import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type InputModalProps = {
  visible: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
};

export default function InputModal({
  visible,
  title,
  placeholder,
  initialValue = "",
  onClose,
  onSubmit,
}: InputModalProps) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#666"
            maxLength={40}
            value={value}
            onChangeText={setValue}
          
          />
          
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={{ color: "#bbb" }}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ok}
              onPress={() => {
                onSubmit(value);
                onClose();
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#2A2A2A",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  cancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  ok: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

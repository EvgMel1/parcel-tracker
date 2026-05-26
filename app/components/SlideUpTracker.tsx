import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Search, Truck, ArrowLeft, Maximize2, Package, Edit3, Scan } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CarrierSelectModal from "./CarrierSelectModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  onTrack?: (trackingNumber: string, carrier: any, title?: string) => void; // ✅ добавили title
};

export default function SlideUpTracker({ visible, onClose, onTrack }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const [panelHeight] = useState(460);
  

  const [trackingNumber, setTrackingNumber] = useState("");
  const [title, setTitle] = useState("");
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<any>({
    id: 1,
    name: "Auto search",
  });

  // --- Slide animation ---
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 260 : 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 400 : 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
    onPanResponderMove: (_, g) => {
      if (g.dy < 0) {
        slideAnim.setValue(Math.min(1, 1 + g.dy / 300));
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy < -70) onClose();
      else
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
    },
  });

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelHeight, 0],
  });

  const headerTranslate = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const handleTrackPress = () => {
  const trimmed = trackingNumber.trim();
  if (!trimmed || trimmed.length < 3) return;

  // ✅ теперь передаём title
  onTrack?.(trimmed, selectedCarrier, title);

  setTrackingNumber("");
  setTitle("");
  onClose();
};

  const [scannerVisible, setScannerVisible] = useState(false);
const [hasPermission, setHasPermission] = useState<boolean | null>(null);




  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%" }}
      >
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* === Header === */}
          <Animated.View
  style={[
    styles.headerContainer,
    { transform: [{ translateY: headerTranslate }] },
  ]}
>
  <SafeAreaView edges={["top"]} style={styles.safeArea}>
    <View style={styles.headerRow}>

      {/* Левая кнопка */}
      <TouchableOpacity onPress={onClose} style={styles.headerButton}>
        <ArrowLeft size={22} color="#fff" />
      </TouchableOpacity>

              {/* Текстовая часть */}
      <View style={styles.headerTextContainer}>
        <View style={styles.headerTitleRow}>
          <Search size={20} color="#fff" />
          <Text style={styles.headerTitle}>Track Package</Text>
        </View>
        <Text style={styles.headerSubtitle}>Find your package</Text>
      </View>

            <TouchableOpacity
  style={styles.headerButton}
  onPress={() => setScannerVisible(true)}
>
  <Scan size={20} color="#fff" />
</TouchableOpacity>
    </View>
  </SafeAreaView>
</Animated.View>

          {/* === Input fields === */}
          <View style={styles.form}>
            {/* Tracking number */}
            <View style={styles.inputWrapper}>
              <Package size={18} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter tracking number"
                placeholderTextColor="#777"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                autoCapitalize="characters"
              />
            </View>

            {/* Title */}
            <View style={styles.inputWrapper}>
              <Edit3 size={18} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Title (optional)"
                placeholderTextColor="#777"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Carrier selection */}
            <TouchableOpacity
              style={styles.carrierButton}
              onPress={() => setShowCarrierModal(true)}
            >
              <Truck size={18} color="#fff" />
              <Text style={styles.carrierText}>{selectedCarrier.name}</Text>
            </TouchableOpacity>

            {/* Track button */}
            <TouchableOpacity
              style={[
                styles.trackButton,
                !trackingNumber.trim() && { opacity: 0.4 },
              ]}
              onPress={handleTrackPress}
              disabled={!trackingNumber.trim()}
            >
              <Search size={20} color="#fff" />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

        {/* Carrier modal */}
      {showCarrierModal && (
        <CarrierSelectModal
          show={showCarrierModal}
          onClose={() => setShowCarrierModal(false)}
          onSelect={(c) => {
            setSelectedCarrier(c);
            setShowCarrierModal(false);
          }}
        />
      )}

      
       
        </View>
      );
}
  
  


const styles = StyleSheet.create({

safeArea: {
  backgroundColor: "#004BFF",
},

headerContainer: {
  backgroundColor: "#004BFF",
  overflow: "hidden",
},

headerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 18,
  paddingBottom: 15,
},

  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 50,
  },

  
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#0A0A0C",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#004BFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  headerButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "rgba(255,255,255,0.2)",
  justifyContent: "center",
  alignItems: "center",
},
  
headerTextContainer: {
  alignItems: "center",
  justifyContent: "center",
  paddingRight: 30,
},

  headerTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

  headerTitle: {
  color: "#fff",
  fontSize: 20,
  fontFamily: "Poppins_400Regular",
},

headerSubtitle: {
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  fontFamily: "Poppins_400Regular",
  paddingLeft: 5,
},

  form: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 15,
    zIndex: 2,
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    fontSize: 15,
    paddingVertical: 14,
    paddingLeft: 42, // отступ под иконку
    paddingRight: 14,
  },
  carrierButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  carrierText: {
    color: "#fff",
    fontSize: 15,
  },
  trackButton: {
    backgroundColor: "#004BFF",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  trackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  scannerOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0,0,0,0.9)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
},

closeScannerButton: {
  position: "absolute",
  bottom: 60,
  alignSelf: "center",
  backgroundColor: "#004BFF",
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 10,
},

});

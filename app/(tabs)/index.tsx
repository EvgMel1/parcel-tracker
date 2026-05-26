import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  TextInput,
  Easing,
  ScrollView,
  ActivityIndicator, 
  Text,
  Pressable,
  DeviceEventEmitter,
  useWindowDimensions,
  Alert,
} from "react-native";
import { Search, Truck, Plus } from "lucide-react-native";
import ToastOverlay from "../components/ToastOverlay";
import Toast from "react-native-root-toast";
import Header from "../components/Header";
import EmptyBoxIcon from "../../assets/icons/empty-box.svg";
import AnimatedPlusButton from "../components/AnimatedPlusButton";
import InputModal from "../components/InputModal";
import EditParcelModal from "../components/EditParcelModal";
import SlideUpTracker from "../components/SlideUpTracker";
import SwipeableCard, { SwipeableCardHandle } from "../components/SwipeableCard";
import TrackingCard from "../components/TrackingCard";


type Carrier = {
  id: number;
  name: string;
};

type Parcel = {
  number: string;
  data: any;
  carrier: Carrier;
  title?: string;
  pinned?: boolean;
  archived?: boolean; 
};


 

export default function Index() {
  const { width } = useWindowDimensions();

const fabRef = useRef<any>(null);
const lastScrollY = useRef(0);
const scrollDirection = useRef<"up" | "down" | null>(null);
const segments = useSegments();
const currentScreen = segments[segments.length - 1];
const isArchive = currentScreen === "archive";

  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);
  function showToast(message: string, type: "success" | "error" | "info" = "info") {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
}

  const cardRefs = useRef<Record<string, SwipeableCardHandle | null>>({});

  const [loadingNumber, setLoadingNumber] = useState<string | null>(null);

  const [searchVisible, setSearchVisible] = useState(false);
const [searchQuery, setSearchQuery] = useState("");

  const [anyMenuOpen, setAnyMenuOpen] = useState(false);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
const [editModalVisible, setEditModalVisible] = useState(false);
const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);
const [scrollEnabled, setScrollEnabled] = useState(true);
  const [menuCloseTrigger, setMenuCloseTrigger] = useState(0);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>({
    id: 1,
    name: "Авто поиск",
  });
  const [showTrackerSheet, setShowTrackerSheet] = useState(false);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [archivedParcels, setArchivedParcels] = useState<Parcel[]>([]);
  const router = useRouter();

  // === Удаление карточки ===
  const handleDeleteParcel = useCallback((num: string) => {
  console.log("Удаляем из state:", num);
  setParcels((prev) => prev.filter((p) => p.number !== num));
}, []);

const [activeFilter, setActiveFilter] = useState("All");

  // === Контроль глобального меню ===
  const handleGlobalMenuToggle = useCallback((open: boolean) => {
    setAnyMenuOpen(open);
  }, []);


useEffect(() => {
  const subscription = DeviceEventEmitter.addListener("openTrackerSheet", () => {
    setShowTrackerSheet(true);
  });

  return () => subscription.remove();
}, []);

  // === Запрос отслеживания ===
  const handleTrack = useCallback(
  async (num: string, carrier: Carrier, title?: string) => { // ✅ добавили title
    if (!num.trim()) return;

    setLoadingNumber(num);
    try {
      const carrierParam =
        carrier.name === "Авто поиск" || carrier.id === 1
          ? ""
          : `&carrier=${carrier.id}`;

      const res = await fetch(`/api/track?number=${num}${carrierParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.error || !data.status || data.status === "Pending") {
        showToast(
          "Отправление не найдено. Проверьте правильность выбора перевозчика или попробуйте позже.",
          "info"
        );
        return;
      }

      setParcels((prev) => {
        const existingIndex = prev.findIndex((p) => p.number === num);
        const updated = [...prev];

        if (existingIndex >= 0) {
  updated[existingIndex] = {
    ...prev[existingIndex],
    data,
    carrier,
    // если title пришёл — обновим, иначе оставим старый
    title: title ?? prev[existingIndex].title,
  };
} else {
  updated.push({ number: num, data, carrier, title });
}

        return updated;
      });

      showToast(`Посылка ${num} успешно добавлена!`, "success");
    } catch (e) {
      console.log("Track error:", e);
      showToast("Не удалось получить данные по трек-номеру.", "error");
    } finally {
      setLoadingNumber(null);
    }
  },
  []
);



const handleSetTitle = useCallback((num: string) => {
  const parcel = parcels.find((p) => p.number === num);
  setActiveParcel(parcel || null);
  setTitleModalVisible(true);
}, [parcels]);

const handleArchiveParcel = (num: string) => {
  setParcels((prev) => {
    const target = prev.find((p) => p.number === num);
    if (!target) return prev;

    const remaining = prev.filter((p) => p.number !== num);

    // отправляем ТОЛЬКО одну посылку
    DeviceEventEmitter.emit("archiveAdd", {
      ...target,
      archived: true,
      pinned: false,
    });

    router.push("/archive");
    return remaining;
  });

  showToast("Посылка перемещена в архив", "info");
};


  // === Меню: редактировать ===
  const handleEditParcel = (parcel: any) => {
  // 🗑️ если пришёл delete-сигнал из TrackingCard
  if (parcel.delete) {
    setParcels((prev) => prev.filter((p) => p.number !== parcel.number));
    return;
  }

  // ✏️ иначе — открыть окно редактирования
  const found = parcels.find((p) => p.number === parcel.number);
  setActiveParcel(found || null);
  setEditModalVisible(true);
};

  // === Меню: закрепить ===
  const handlePinParcel = (num: string) => {
    setParcels((prev) => {
      const updated = prev.map((p) =>
        p.number === num ? { ...p, pinned: !p.pinned } : p
      );
      // Закреплённые вверх
      return [...updated.filter((p) => p.pinned), ...updated.filter((p) => !p.pinned)];
    });
  };

  const filteredParcels = parcels.filter((p) => {
  const matchesSearch =
    p.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.title?.toLowerCase() || "").includes(searchQuery.toLowerCase());

  if (!matchesSearch) return false;

  if (activeFilter === "All") return true;

  const status = p.data?.status || "";
  return status === activeFilter;
});

// === Анимация появления/исчезновения FAB ===
const fabAnim = useRef(new Animated.Value(0)).current; // 0 = видно, 1 = скрыто

const hideFab = () => {
  Animated.timing(fabAnim, {
    toValue: 1,
    duration: 250,
    useNativeDriver: true,
    easing: Easing.ease,
  }).start();
};

const showFab = () => {
  Animated.timing(fabAnim, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
    easing: Easing.ease,
  }).start();
};




  return (


    <View style={styles.container}>
     <Header onSearchPress={() => setSearchVisible(true)} />

<View style={styles.filterContainer}>
  <Text style={styles.filterLabel}>Sort by</Text>

  <View style={{ height: 45 }}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroll}
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled={true}
      style={{ overflowX: "scroll", width: "100%" }} // ✅ важно для веба
    >
      {["All", "Delivered", "In Transit", "Out for delivery"].map(
        (label, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.8}
            style={[
              styles.filterButton,
              activeFilter === label && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(label)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === label && styles.filterButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      )}
    </ScrollView>
  </View>
</View>


      {searchVisible && (
  <View style={styles.searchBox}>
    <TextInput
      style={styles.searchInput}
      placeholder="Поиск по треку или описанию..."
      placeholderTextColor="#777"
      value={searchQuery}
      onChangeText={setSearchQuery}
      autoFocus
      onBlur={() => {
        if (!searchQuery.trim()) setSearchVisible(false);
      }}
      clearButtonMode="always"
    />
  </View>
)}


      {/* INPUT PANEL */}
      <SlideUpTracker
  visible={showTrackerSheet}
  onClose={() => setShowTrackerSheet(false)}
  onTrack={(num, carrier, title) => { // ✅ принимаем title
    setSelectedCarrier(carrier);
    handleTrack(num, carrier, title); // ✅ передаём дальше
  }}
/>

{loadingNumber ? (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={styles.loaderText}>
      Получаем данные по {loadingNumber}...
    </Text>
  </View>
) : (
  <ScrollView
  style={{ flex: 1, zIndex: 0 }}
  contentContainerStyle={{
    paddingTop: 10,
    
    paddingBottom: 10,
  }}
  scrollEnabled={scrollEnabled}
  onScroll={(e) => {
  const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
  const currentY = contentOffset.y;
  const maxScroll = contentSize.height - layoutMeasurement.height;
  const diff = currentY - lastScrollY.current;


  // Игнорируем bounce сверху и снизу
  if (currentY < 0 || currentY > maxScroll + 20) return;

  if (diff > 12 && scrollDirection.current !== "down") {
  scrollDirection.current = "down";
  fabRef.current?.hideButton?.();
} else if (diff < -12 && scrollDirection.current !== "up") {
  scrollDirection.current = "up";
  fabRef.current?.showButton?.();
}

lastScrollY.current = currentY;
}}
scrollEventThrottle={16}
>
  {filteredParcels.length > 0 ? (
    <View style={{  marginTop: -10 }}>
      {filteredParcels.map((parcel) => (
        <View key={parcel.number} style={{ marginBottom: 8 }}>
          <SwipeableCard
  ref={(r: SwipeableCardHandle | null) => {
    cardRefs.current[parcel.number] = r;
  }}
            trackingNumber={parcel.number}
  onDelete={() => handleDeleteParcel(parcel.number)}
  onArchive={() => handleArchiveParcel(parcel.number )}
  onScrollLock={(locked) => setScrollEnabled(!locked)}  // 👈 ВАЖНО
>
            <TrackingCard
              trackingData={parcel.data}
              trackingNumber={parcel.number}
              onMenuToggle={handleGlobalMenuToggle}
              menuCloseTrigger={menuCloseTrigger}
              onSetTitle={handleSetTitle}
              onEdit={handleEditParcel}
              onPin={handlePinParcel}
              onDelete={() =>
                cardRefs.current[parcel.number]?.triggerDelete()
              }
              pinned={parcel.pinned}
              title={parcel.title}
            />
          </SwipeableCard>
        </View>
      ))}
    </View>
  ) : (
    <View style={styles.emptyContainer}>
      <EmptyBoxIcon width={120} height={120} />
      {searchQuery ? (
        <Text style={{ color: "#777", marginTop: 10 }}>
          Ничего не найдено по запросу “{searchQuery}”
        </Text>
      ) : null}
    </View>
  )}
</ScrollView>

)}

{toast && (
  <ToastOverlay
    message={toast.message}
    type={toast.type as any}
    onHide={() => setToast(null)}
  />
)}

      <View pointerEvents="box-none">
  {anyMenuOpen && (
    <TouchableOpacity
      style={styles.globalOverlay}
      activeOpacity={1}
      onPress={() => {
        setAnyMenuOpen(false);
        setMenuCloseTrigger((v) => v + 1);
      }}
    />
  )}

  {/* Always active overlay for swipe closing */}
  <Pressable
  style={styles.globalOverlay}
  onPress={() => DeviceEventEmitter.emit("tapOutsideSwipe")}
  pointerEvents="box-none"
/>
</View>

      
      <EditParcelModal
  visible={editModalVisible}
  onClose={() => setEditModalVisible(false)}
  initialNumber={activeParcel?.number || ""}
  initialCarrier={activeParcel?.carrier || { id: 1, name: "Авто поиск" }}
  onSubmit={({ number: newNumber, carrier: newCarrier, responseData }) => {
    if (!activeParcel) return;

    setParcels((prev) => {
      const exists = prev.find((p) => p.number === newNumber);

      // 🧩 Если номер уже есть — обновляем данные этого трека
      if (exists) {
        return prev.map((p) =>
          p.number === newNumber
            ? { ...p, carrier: newCarrier, data: responseData }
            : p
        );
      }

      // 🔄 Если номер изменился — обновляем активный
      return prev.map((p) =>
        p.number === activeParcel.number
          ? { ...p, number: newNumber, carrier: newCarrier, data: responseData }
          : p
      );
    });
  }}
/>

<InputModal
  visible={titleModalVisible}
  title="Описание посылки"
  placeholder="Введите описание..."
  initialValue={activeParcel?.title || ""}
  onClose={() => setTitleModalVisible(false)}
  onSubmit={(text) => {
    if (activeParcel) {
      setParcels((prev) =>
        prev.map((p) =>
          p.number === activeParcel.number
            ? { ...p, title: text }
            : p
        )
      );
    }
  }}

  

  
/>



<AnimatedPlusButton

  onPress={() => setShowTrackerSheet(true)}
  ref={fabRef}
  isActive={parcels.length === 0} // ✅ Анимация только если посылок нет
/>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
    position: "relative",
  },


  globalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },


  plusBtn: {
    width: 60,
    height: 60,
    backgroundColor: "#3b82f6",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    zIndex: 20,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 200,
  },

loaderContainer: {
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 40,
},
loaderText: {
  color: "#9CA3AF",
  fontSize: 14,
  marginTop: 10,
},

searchBox: {
  paddingHorizontal: 20,
  marginBottom: 6,
},

searchInput: {
  backgroundColor: "#141316",
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 14,
  color: "#fff",
  fontSize: 15,
  borderWidth: 1,
  borderColor: "#2a2a2a",
},

floatingButton: {
  position: "absolute",
  bottom: 20, // немного выше нижнего меню
  right: 25,
  width: 70,
  height: 70,
  borderRadius: 60,
  backgroundColor: "#3b82f6",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
  zIndex: 999,
},

filterContainer: {
  backgroundColor: "#101010",
  paddingTop: 20,
  paddingBottom: 12,
},

filterLabel: {
  color: "#fff",
  fontSize: 18,
  fontFamily: "Poppins_600SemiBold",
  marginLeft: 20,
  marginBottom: 10,
},

filterButtons: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
},


filterButton: {
  backgroundColor: "#1a1a1a",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 10,
  borderWidth: 0.5,
  borderColor: "#2F2F2F",
  justifyContent: "center",
  alignItems: "center",
  minWidth: 110, // чтобы кнопки не были слишком узкие
},

filterButtonActive: {
  backgroundColor: "#0066FF",
  borderColor: "#0066FF",
},

filterButtonText: {
  color: "#E5E7EB",
  fontSize: 14,
  fontFamily: "Poppins_600SemiBold",
},

filterButtonTextActive: {
  color: "#fff",
},

filterScroll: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  gap: 8,
  paddingRight: 40, // чтобы не обрезалась последняя
},



});

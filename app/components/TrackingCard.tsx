

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { MoreVertical, Pin } from "lucide-react-native";
import { Dimensions, InteractionManager,  } from "react-native";
import * as Clipboard from "expo-clipboard";
import CopyIcon from "../../assets/icons/CopyIcon.svg";
import IconHourglass from "../../assets/icons/hourglass.svg";
import ConfirmModal from "./ConfirmModal";
import ArrowDown from "../../assets/icons/arrow-down.svg";
import IconTruck from "../../assets/icons/truck.svg";
import IconDelivery from "../../assets/icons/delivery.svg"; // Придуманная иконка
import IconBox from "../../assets/icons/box.svg";
import { Info } from "lucide-react-native";
import { useRouter } from "expo-router";



// 🔹 ISO → full country names
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  VE: "Venezuela",
  EC: "Ecuador",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  PT: "Portugal",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  PL: "Poland",
  CZ: "Czech Republic",
  SK: "Slovakia",
  HU: "Hungary",
  RO: "Romania",
  BG: "Bulgaria",
  GR: "Greece",
  TR: "Turkey",
  RU: "Russia",
  UA: "Ukraine",
  BY: "Belarus",
  SE: "Sweden",
  NO: "Norway",
  FI: "Finland",
  DK: "Denmark",
  IE: "Ireland",
  IS: "Iceland",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  IN: "India",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  PH: "Philippines",
  VN: "Vietnam",
  ID: "Indonesia",
  AU: "Australia",
  NZ: "New Zealand",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  ZA: "South Africa",
  EG: "Egypt",
  NG: "Nigeria",
  KE: "Kenya",
  IL: "Israel",
  IR: "Iran",
  PK: "Pakistan",
  BD: "Bangladesh",
  HK: "Hong Kong",
  TW: "Taiwan",
};





// 🔹 17track CDN logos
const carrierLogoMap: Record<string, string> = {
  "nova poshta": "https://res.17track.net/asset/carrier/logo/120x120/100035.png",
  "nova poshta global":"https://res.17track.net/asset/carrier/logo/120x120/100162.png",
  dhl: "https://res.17track.net/asset/carrier/logo/120x120/100001.png",
  ups: "https://res.17track.net/asset/carrier/logo/120x120/100002.png",
  fedex: "https://res.17track.net/asset/carrier/logo/120x120/100003.png",
  "china post": "https://res.17track.net/asset/carrier/logo/120x120/100004.png",
  meest: "https://res.17track.net/asset/carrier/logo/120x120/100023.png",
};

const getCarrierLogo = (carrierName: string): string | null => {
  const key = carrierName?.toLowerCase() || "";
  for (const name in carrierLogoMap) {
    if (key.includes(name)) return carrierLogoMap[name];
  }
  return null;
};

const getProgress = (status: string): number => {
  switch (status?.toLowerCase()) {
    case "info received":
    case "pending Shipment":
      return 0.1;
    case "in transit":
      return 0.5;
    case "out for delivery":
      return 0.8;
    case "delivered":
      return 1;
    default:
      return 0.3;
  }
};

type TrackingCardProps = {
  trackingData: any;
  trackingNumber: string;
  onMenuToggle?: (open: boolean) => void;
  menuCloseTrigger?: number; // ← добавлено
  onSetTitle: (num: string) => void;
  onEdit: (parcel: any) => void;
  onPin: (num: string) => void;
   onDelete: () => void;
  pinned?: boolean;
  title?: string;
  archived?: boolean; // ✅ добавляем
};


const statusConfig: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  "info received": {
    icon: IconHourglass,
    color: "#9CA3AF", 
    label: "Info Received",
  },
  pending: {
    icon: IconHourglass,
    color: "#FACC15",
    label: "Pending",
  },
  "in transit": {
    icon: IconTruck,
    color: "#FACC15", 
    label: "In Transit",
  },
  "out for delivery": {
    icon: IconDelivery,
    color: "#FACC15", 
    label: "Out for Delivery",
  },
  delivered: {
    icon: IconBox,
    color: "#26C363", // зелёный
    label: "Delivered",
  },
};

// === ПОСЛЕДНЕЕ СОБЫТИЕ
const getLastEvent = (events: any[]) => {
  if (!events?.length) return null;
  const e = events[0];
  return {
    desc: e.description || e.message || "",
    time: e.time
      ? new Date(e.time).toLocaleString("uk-UA", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  };
};


// === МАРШРУТ
const getRoute = (trackingData: any) => {
  const events = trackingData.events || [];
  const accepted =
    trackingData.accepted?.[0] || trackingData.data?.accepted?.[0];

  const originCountryCode =
    accepted?.shipping_country ||
    accepted?.origin_country ||
    trackingData.origin_country ||
    "";

  const destinationCountryCode =
    accepted?.recipient_country ||
    accepted?.destination_country ||
    trackingData.destination_country ||
    "";

  const originCity =
    accepted?.shipper ||
    trackingData.origin_city ||
    events[events.length - 1]?.location?.split(",")[0]?.trim() ||
    "";
  const destinationCity =
    accepted?.destination_city ||
    trackingData.destination_city ||
    events[0]?.location?.split(",")[0]?.trim() ||
    "";

  const fullOriginCountry =
    COUNTRY_NAMES[originCountryCode?.toUpperCase()] || originCountryCode;
  const fullDestinationCountry =
    COUNTRY_NAMES[destinationCountryCode?.toUpperCase()] ||
    destinationCountryCode;

  return {
    origin: {
      city: originCity,
      countryName: fullOriginCountry,
      countryCode: originCountryCode?.toUpperCase() || "",
    },
    destination: {
      city: destinationCity,
      countryName: fullDestinationCountry,
      countryCode: destinationCountryCode?.toUpperCase() || "",
    },
  };
};


export default function TrackingCard({
  trackingData,
  trackingNumber,
  onMenuToggle,
  menuCloseTrigger,
  onSetTitle,
  onEdit,
  archived,
  onPin,
  onDelete,
  pinned,
  title,
}: TrackingCardProps) {
  const displayTitle = title || trackingData.title || "";
  const hasTitle = !!displayTitle.trim();
  const [contentHeight, setContentHeight] = useState(0);
  const wave = useRef(new Animated.Value(0)).current;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);
const menuButtonRef = useRef<React.ElementRef<typeof TouchableOpacity> | null>(null);
const [menuPosition, setMenuPosition] = useState<{top: number; right: number; left?: number;}>({ top: 0, right: 25 });



// 🔄 Реакция на глобальное закрытие меню
useEffect(() => {
  if (menuOpen) {
    setMenuOpen(false);
  }
}, [menuCloseTrigger]);

// в useEffect добавь обработку отложенного удаления
useEffect(() => {
  if (pendingDelete) {
    Alert.alert(
      "Удалить посылку",
      `Вы уверены, что хотите удалить посылку № ${pendingDelete}?`,
      [
        { text: "Отмена", style: "cancel", onPress: () => setPendingDelete(null) },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            console.log("Удаляем через меню:", pendingDelete);
            onDelete();
            setPendingDelete(null);
          },
        },
      ],
      { cancelable: true }
    );
  }
}, [pendingDelete]);


// сначала expanded
const [expanded, setExpanded] = useState(false);

// потом уже showUpdated, который от него зависит
const [showUpdated, setShowUpdated] = useState(true);

const animation = useState(new Animated.Value(0))[0];

  const toggleExpand = () => {
  const wasExpanded = expanded;

  // 📌 Если карточка разворачивается — скрываем текст СРАЗУ
  if (!wasExpanded) {
    setShowUpdated(false);
  }

  Animated.timing(animation, {
    toValue: wasExpanded ? 0 : 1,
    duration: 250,
    useNativeDriver: false,
  }).start(() => {
    // 📌 Если карточка СВЕРНУЛАСЬ — показываем текст ПОСЛЕ анимации
    if (wasExpanded) {
      setShowUpdated(true);
    }
  });

  setExpanded(!wasExpanded);
};




  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight], // высота раскрытой части
  });


  const handleCopy = async () => {
    await Clipboard.setStringAsync(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const carrierName =
    trackingData.carrier_name ||
    trackingData.carrier ||
    trackingData.provider ||
    "Unknown";

  const logoUri = getCarrierLogo(carrierName);
  const { origin, destination } = getRoute(trackingData);
  const progress = getProgress(trackingData.status);
  const lastEvent = getLastEvent(trackingData.events || []);

  const startDate =
    trackingData.events?.[trackingData.events.length - 1]?.time || null;
  const endDate = trackingData.events?.[0]?.time || null;

  const formattedStart = startDate
    ? new Date(startDate).toLocaleDateString("uk-UA")
    : "";
  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString("uk-UA")
    : "";
    const normalizeDate = (d?: string | null): string => {
  if (!d) return "";
  if (typeof d !== "string") return String(d);
  if (d.includes("T")) return d;
  return d.replace(" ", "T") + "Z";
};

 // цвет статуса
  const statusKey = trackingData.status?.toLowerCase() || "";
const normalizedStatus = trackingData.status?.toLowerCase() || "";
  const statusItem = statusConfig[statusKey];
const statusColor =
  trackingData.status?.toLowerCase() === "delivered"
    ? "#26C363"           // зелёный
    : trackingData.status?.toLowerCase() === "in transit"
    ? "#FACC15"           // желтый
    : trackingData.status?.toLowerCase() === "out for delivery"
    ? "#FB923C"           // оранжевый
    : "#9CA3AF";          // серый по умолчанию

      const handleMenuAction = (action: string) => {
  const normalized = action.trim().toLowerCase();
  console.log("Menu tapped:", normalized, trackingNumber);

  switch (normalized) {
    case "описание":
      setMenuOpen(false);
      onMenuToggle?.(false);
      onSetTitle(trackingNumber);
      break;

    case "изменить":
      setMenuOpen(false);
      onMenuToggle?.(false);
      onEdit({ number: trackingNumber, ...trackingData });
      break;

    case "закрепить":
    case "открепить":
      setMenuOpen(false);
      onMenuToggle?.(false);
      onPin(trackingNumber);
      break;

   case "удалить":
  setMenuOpen(false);
  onMenuToggle?.(false);
  setConfirmVisible(true);
  break;


default:
  console.log("Unknown action:", action);
  break;
  }
};

const glow = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (archived) return; // ✅ отключаем мигание для архива

  Animated.loop(
    Animated.sequence([
      Animated.timing(wave, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(wave, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }),
    ])
  ).start();
}, [archived]);

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(wave, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(wave, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }),
    ])
  ).start();
}, []);


  return (
  <View style={{ position: "relative" }} pointerEvents="box-none">

   {/* === КАРТОЧКА === */}
<View pointerEvents={menuOpen ? "none" : "auto"}>
  <View style={styles.touchableWrapper}>
    <Pressable
      android_ripple={{ color: "rgba(255,255,255,0.05)" }}
      onPress={() =>
        router.push({
          pathname: "/parcel/[id]",
          params: {
            id: trackingNumber,
            data: JSON.stringify(trackingData),
          },
        })
      }
    >
      <View style={styles.card}>
        <View style={styles.inner}>
          {/* ...остальное содержимое карточки */}


            {/* HEADER */}
            <View style={styles.headerRow}>
  <View style={styles.titleWrapper}>
    {hasTitle && (
      <Text
        style={styles.title}
        numberOfLines={3} // можно 2–3 строки
      >
        {displayTitle}
      </Text>
    )}
    

                <Text style={[styles.subLabel, !hasTitle && { marginTop: 0 }]}>
                  Tracking number
                </Text>

                {/* Трек-номер */}
                <View style={[styles.tnRow, !hasTitle && { marginBottom: 12 }]}>
                  <Text style={styles.tn}>{trackingNumber}</Text>

                  <TouchableOpacity onPress={handleCopy} style={{ padding: 4 }}>
                    <CopyIcon width={15} height={15} />
                  </TouchableOpacity>

                  {copied && (
                    <Animated.View style={styles.copiedToast}>
                      <Text style={styles.copiedText}>Copied</Text>
                    </Animated.View>
                  )}
                </View>
              </View>

              {/* Логотип + меню */}
<View style={styles.menuContainer}>
  {logoUri && <Image source={{ uri: logoUri }} style={styles.logo} />}

  <View style={styles.menuContainer}>
  {logoUri && <Image source={{ uri: logoUri }} style={styles.logo} />}

  <TouchableOpacity
    ref={menuButtonRef}
    onPress={() => {
      if (menuButtonRef.current) {
        menuButtonRef.current.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            const screenHeight = Dimensions.get("window").height;
            const menuHeight = 160;
            const margin = 4;
            const shouldOpenUp = y + height + menuHeight + margin > screenHeight;
            const top = shouldOpenUp ? y - menuHeight - margin : y + height + margin;
            setMenuPosition({ top, right: 25 });
            setMenuOpen(true);
            onMenuToggle?.(true);
          }
        );
      }
    }}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <MoreVertical size={22} color="#3B82F6" />
  </TouchableOpacity>

  {pinned && (
    <View style={styles.pinWrapper}>
      <Pin size={16} color="#707070ff" />
    </View>
  )}
</View>
</View>

            </View>

           {/* СТАТУС */}
           {!archived && (
  <View style={[styles.statusRow, { alignItems: "center" }]}>
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
        width: 18,
        height: 18,
      }}
    >
      {/* Волна */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 9,
          backgroundColor: statusColor,
          opacity: wave.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 0],
          }),
          transform: [
            {
              scale: wave.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.5],
              }),
            },
          ],
        }}
      />

      {/* Центральная точка */}
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: statusColor,
            width: 8,
            height: 8,
          },
        ]}
      />
    </View>

    {/* Текст статуса */}
    <Text style={[styles.status, { color: statusColor, marginLeft: 8 }]}>
      {statusItem?.label || trackingData.status}
    </Text>
  </View>
)}

            {/* Текст "Обновлено" — появляется только после полного сворачивания */}
            {showUpdated && (
              <Text style={styles.updatedText}>
                {trackingData.status?.toLowerCase() === "delivered"
                  ? `Доставлено: ${lastEvent?.time || ""}`
                  : `Обновлено: ${lastEvent?.time || ""}`}
              </Text>
            )}

            {/* === ИЗМЕРИТЕЛЬ ВЫСОТЫ (скрытый) === */}
            <View
              style={{ position: "absolute", opacity: 0, zIndex: -1 }}
              onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
            >
              <View>

                {/* Страны */}
                <View style={styles.countryRow}>
                  <View>
                    <Text style={styles.countryBig}>{origin.countryName}</Text>
                    {origin.city && <Text style={styles.citySmall}>{origin.city}</Text>}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.countryBig}>{destination.countryName}</Text>
                    {destination.city && <Text style={styles.citySmall}>{destination.city}</Text>}
                  </View>
                </View>

                {/* Прогресс */}
                <View style={styles.progressRow}>
                  {[0, 0.33, 0.66, 1].map((step, i) => (
                    <React.Fragment key={i}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: progress >= step ? statusColor : "#555" },
                        ]}
                      />
                      {i < 3 && (
                        <View
                          style={[
                            styles.line,
                            { backgroundColor: progress >= step + 0.33 ? statusColor : "#333" },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {/* Даты */}
                <View style={styles.dateRow}>
                  <View>
                    {startDate && (
                      <>
                        <Text style={styles.dateStrong}>
                          {new Date(normalizeDate(startDate)).toLocaleDateString("uk-UA")}
                        </Text>
                        <Text style={styles.dateSmall}>
                          {new Date(normalizeDate(startDate)).toLocaleTimeString("uk-UA")}
                        </Text>
                      </>
                    )}
                  </View>

                  {endDate && trackingData.status?.toLowerCase() === "delivered" && (
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.dateStrong}>
                        {new Date(normalizeDate(endDate)).toLocaleDateString("uk-UA")}
                      </Text>
                      <Text style={styles.dateSmall}>
                        {new Date(normalizeDate(endDate)).toLocaleTimeString("uk-UA")}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Последнее событие */}
                {lastEvent && (
                  <View style={styles.eventRow}>
                    <View style={styles.eventIconCircle}>
                      <Text style={styles.eventIconText}>i</Text>
                    </View>

                    <View style={styles.eventTextWrapper}>
                      <Text style={styles.eventText}>{lastEvent.desc}</Text>
                      <Text style={styles.eventDate}>{lastEvent.time}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* === АНИМИРУЕМЫЙ БЛОК === */}
            <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
              <View>

                {/* Страны */}
                <View style={styles.countryRow}>
                  <View>
                    <Text style={styles.countryBig}>{origin.countryName}</Text>
                    {origin.city && <Text style={styles.citySmall}>{origin.city}</Text>}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.countryBig}>{destination.countryName}</Text>
                    {destination.city && <Text style={styles.citySmall}>{destination.city}</Text>}
                  </View>
                </View>

                {/* Прогресс */}
                <View style={styles.progressRow}>
                  {[0, 0.33, 0.66, 1].map((step, i) => (
                    <React.Fragment key={i}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: progress >= step ? statusColor : "#555" },
                        ]}
                      />
                      {i < 3 && (
                        <View
                          style={[
                            styles.line,
                            { backgroundColor: progress >= step + 0.33 ? statusColor : "#333" },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {/* Даты */}
                <View style={styles.dateRow}>
                  <View>
                    {startDate && (
                      <>
                        <Text style={styles.dateStrong}>
                          {new Date(normalizeDate(startDate)).toLocaleDateString("uk-UA")}
                        </Text>
                        <Text style={styles.dateSmall}>
                          {new Date(normalizeDate(startDate)).toLocaleTimeString("uk-UA")}
                        </Text>
                      </>
                    )}
                  </View>

                  {endDate && trackingData.status?.toLowerCase() === "delivered" && (
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.dateStrong}>
                        {new Date(normalizeDate(endDate)).toLocaleDateString("uk-UA")}
                      </Text>
                      <Text style={styles.dateSmall}>
                        {new Date(normalizeDate(endDate)).toLocaleTimeString("uk-UA")}
                      </Text>
                    </View>
                  )}
                </View>

                {/* LAST EVENT */}
                {lastEvent && (
                  <View style={styles.eventRow}>
                    <View style={styles.eventIconCircle}>
                      <Text style={styles.eventIconText}>i</Text>
                    </View>

                    <View style={styles.eventTextWrapper}>
                      <Text style={styles.eventText}>{lastEvent.desc}</Text>
                      <Text style={styles.eventDate}>{lastEvent.time}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Кнопка разворота */}
            <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["180deg", "0deg"],
                      }),
                    },
                  ],
                }}
              >
                <ArrowDown width={22} height={22} fill="#3B82F6" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
        </Pressable>
        </View>
        
    </View>

  <Modal
  visible={menuOpen}
  transparent
  animationType="fade"
  onRequestClose={() => {
    setMenuOpen(false);
    onMenuToggle?.(false);
  }}
>
  <View style={StyleSheet.absoluteFill}>
    {/* Фон */}
    <TouchableOpacity
      style={StyleSheet.absoluteFill}
      activeOpacity={1}
      onPress={() => {
        setMenuOpen(false);
        onMenuToggle?.(false);
      }}
    />

    {/* Само меню */}
    <View
      style={[
        styles.menuBox,
        {
          position: "absolute",
          top: menuPosition.top,
          right: menuPosition.right,
        },
      ]}
    >
      {[
        { label: "Описание" },
        { label: "Изменить" },
        { label: pinned ? "Открепить" : "Закрепить" },
        { label: "Удалить", danger: true },
      ].map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.menuItem}
          onPress={() => handleMenuAction(item.label)} // ⚡ Работает корректно
        >
          <Text
            style={[
              styles.menuText,
              item.danger && { color: "#ef4444" },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>

<Modal
  visible={confirmVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setConfirmVisible(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: "80%",
        backgroundColor: "#1E1E1E",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        Удалить посылку?
      </Text>
      <Text style={{ color: "#aaa", textAlign: "center", marginBottom: 20, fontSize: 14 }}>
        Вы уверены, что хотите удалить посылку № {trackingNumber}?
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#333",
            marginRight: 8,
          }}
          onPress={() => setConfirmVisible(false)}
        >
          <Text style={{ color: "#bbb", fontSize: 15 }}>Отмена</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: "#ef4444",
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={() => {
            setConfirmVisible(false);
            onDelete();
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>





  </View>
);
}

const styles = StyleSheet.create({
  card: {
  backgroundColor: "#141316",
  flexDirection: "row",
  width: "100%",
  borderRadius: 0,
  borderTopWidth: 0.5,
  borderBottomWidth: 0.5,
  borderColor: "#2F2F2F",
  position: "relative", // 👈 добавь это
},

  sideStrip: {
    width: 6,
  },

 inner: {
  flex: 1,
  paddingHorizontal: 18,
  paddingVertical: 15,
},


  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },



  logo: {
  width: 40,
  height: 40,
  borderRadius: 8,
  position: "absolute",
  top: 4,
  right: 35,
},

  subLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 6,
  },

  tnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 13,
    gap: 6,
  },

  tn: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginTop: -4,
  },

  copiedToast: {
    position: "absolute",
    right: -10,
    top: -22,
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  copiedText: {
    color: "#fff",
    fontSize: 11,
  },

  status: {
    fontSize: 17,
    fontWeight: "500",
    marginTop: -4,
    marginBottom: 0,
  },

  country: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    marginBottom: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  line: {
    flex: 1,
    height: 1,
    marginHorizontal: 3,
    borderRadius: 3,
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
    marginBottom: 14,
  },

  dateStrong: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  dateSmall: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: -2,
  },

  eventRow: {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 10,
  marginTop: 10,
},

eventIconCircle: {
  width: 18,
  height: 18,
  borderRadius: 9,
  borderWidth: 1.8,
  borderColor: "#e2e2e2ff",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 0,
  flexShrink: 0, // prevents shrinking on wrapped text!
},

  eventText: {
  color: "#ddd",
  fontSize: 14,
  lineHeight: 18,
},

  eventIconText: {
  color: "#e2e2e2ff",
  fontSize: 11,
  fontWeight: "700",
  lineHeight: 10,
},

eventTextWrapper: {
  flex: 1,           // позволяeт тексту заниматься всю доступную ширину
  flexShrink: 1,
  paddingRight: 30,
  maxWidth: "88%",      // перенос строки обязательно
},

  countryRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
},

countryBig: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "500",
  textTransform: "uppercase",
},

citySmall: {
  color: "#9ca3af",
  fontSize: 14,
  marginBottom: -2,
},

titleWrapper: {
  flex: 1,
  paddingRight: 90, // ← резервируем место под иконку и меню
},

title: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "600",
  flexWrap: "wrap", // ← ключевое свойство для переноса
  lineHeight: 25,
  maxWidth: "100%",
},

codeSmall: {
  color: "#6b7280",
  fontSize: 12,
  marginTop: -1,
},

statusRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: -10,
  marginBottom: 12,
},


  eventDate: {
  color: "#9CA3AF",
  fontSize: 12,
  marginTop: 4,
},

menuBox: {
  backgroundColor: "#111",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#333",
  width: 150,
  paddingVertical: 6,
  overflow: "hidden",
  zIndex: 2001,
  elevation: 20,
},


menuItem: {
  paddingVertical: 8,
  paddingHorizontal: 14,
},

menuContainer: {
  position: "absolute",
  top: 2,
  right: 0,
  flexDirection: "column", // теперь элементы идут вертикально
  alignItems: "flex-end",
  zIndex: 10,
},

pinWrapper: {
  marginTop: 4,
  padding: 4,
},

touchableWrapper: {
  flex: 1,
  width: "100%",
},

fullScreenOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "transparent", // можно rgba(0,0,0,0.1) для лёгкого затемнения
  zIndex: 999, // главное — выше всего
},

menuText: {
  color: "#e5e7eb",
  fontSize: 15,
},

menuOverlayTouchable: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "transparent",
  zIndex: 1000, // ниже меню, выше карточки
},

expandButton: {
  position: "absolute",
  right: 16,
  bottom: 12,
  backgroundColor: "#1f2937",
  width: 34,
  height: 34,
  borderRadius: 17,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},

updatedText: {
  color: "#9CA3AF",
  fontSize: 13,
  marginTop: -4,
  marginBottom: -2,
},

statusDot: {
  width: 9,
  height: 9,
  borderRadius: 5,
  shadowOffset: { width: 0, height: 0 },
},




});

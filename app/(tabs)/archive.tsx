import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  DeviceEventEmitter,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Header from "../components/Header";
import TrackingCard from "../components/TrackingCard";
import SwipeableCard, {
  SwipeableCardHandle,
} from "../components/SwipeableCard";
import EmptyBoxIcon from "../../assets/icons/empty-box.svg";

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
};

export default function Archive() {
  const router = useRouter();
  const params = useLocalSearchParams();

  

  const [archivedParcels, setArchivedParcels] = useState<Parcel[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cardRefs = useRef<Record<string, SwipeableCardHandle | null>>({});

 useEffect(() => {
  const sub = DeviceEventEmitter.addListener("archiveAdd", (parcel) => {
    setArchivedParcels((prev) => [parcel, ...prev]);
  });
  return () => sub.remove();
}, []);


  // 2) каждый раз, когда архив меняется — говорим TabLayout сколько записей
  useEffect(() => {
    DeviceEventEmitter.emit("archiveCountUpdate", archivedParcels.length);
  }, [archivedParcels]);

  const handleDeleteParcel = useCallback((num: string) => {
    setArchivedParcels((prev) => prev.filter((p) => p.number !== num));
  }, []);

  // 3) FAB в TabLayout жмёт "clearArchivePress" → открыть модалку (если не пусто)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "clearArchivePress",
      () => {
        if (archivedParcels.length > 0) {
          setConfirmVisible(true);
        }
      }
    );
    return () => sub.remove();
  }, [archivedParcels]);

  const filtered = archivedParcels.filter(
    (p) =>
      p.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.title?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header
        title="Archive"
        subtitle="Your delivery history"
        showBackButton
        onBackPress={() => router.back()}
        onSearchPress={() => setSearchVisible((v) => !v)}
      />

      {searchVisible && (
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search archived packages..."
            placeholderTextColor="#777"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loaderText}>Loading archived parcels...</Text>
        </View>
      ) : filtered.length > 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          {filtered.map((parcel) => (
            <View key={parcel.number} style={{ marginBottom: 8 }}>
              <SwipeableCard
                archived={true}
                ref={(r) => {
                  cardRefs.current[parcel.number] = r || null;
                }}
                trackingNumber={parcel.number}
                onDelete={() => handleDeleteParcel(parcel.number)}
              >
                <TrackingCard
                  trackingData={parcel.data}
                  trackingNumber={parcel.number}
                  title={parcel.title}
                  pinned={parcel.pinned}
                  archived={true}
                  onDelete={() =>
                    cardRefs.current[parcel.number]?.triggerDelete()
                  }
                  onSetTitle={() => {}}
                  onEdit={() => {}}
                  onPin={() => {}}
                />
              </SwipeableCard>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyBoxIcon width={120} height={120} />
          <Text style={{ color: "#777", marginTop: 10, textAlign: "center" }}>
            No archived parcels yet.
          </Text>
        </View>
      )}

      {/* Модалка подтверждения */}
      {confirmVisible && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Clear archive?</Text>
            <Text style={styles.confirmText}>
              This action cannot be undone.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
  setArchivedParcels([]);
  setConfirmVisible(false);

  // сообщаем TabLayout только количество
  DeviceEventEmitter.emit("archiveCountUpdate", 0);
}}
              >
                <Text style={styles.deleteText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loaderText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 150,
  },

  // модалка
  confirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  confirmBox: {
    width: "80%",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#262626",
  },
  confirmTitle: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: "#bbb",
    fontFamily: "Poppins_400Regular",
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: "#999",
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});

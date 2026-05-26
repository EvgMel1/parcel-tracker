import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
  Share,
  ScrollView,
} from "react-native";
import {
  MapPin,
  Clock,
  Share2,
  Trash2,
  Star,
  Bookmark,
} from "lucide-react-native";
import { DeviceEventEmitter } from "react-native";
import ParcelHeader from "../components/ParcelHeader";
import React, { useState, useRef, useEffect } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

// =============== HELPERS ===============

type GeoPoint = {
  lat: number;
  lon: number;
  location: string;
  eventIndex: number;
};

async function geocode(address: string) {
  if (!address) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "ParcelTracker/1.0" },
    });

    const json = await res.json();
    if (json?.length > 0) {
      return {
        lat: parseFloat(json[0].lat),
        lon: parseFloat(json[0].lon),
      };
    }
  } catch (e) {
    console.log("Geocode error:", e);
  }
  return null;
}

function formatETA(dateString: string | undefined) {
  if (!dateString) return "Unknown";
  try {
    return new Date(dateString).toDateString();
  } catch {
    return "Unknown";
  }
}

// =============== MAIN COMPONENT ===============

export default function ParcelDetails() {
  const { data } = useLocalSearchParams();
  const router = useRouter();

  const parsed = data ? JSON.parse(data as string) : null;
  const [trackingData, setTrackingData] = useState(parsed);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [coords, setCoords] = useState<GeoPoint[]>([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null
  );

  const mapRef = useRef<MapView | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const rowOffsets = useRef<Record<number, number>>({});

  // fade-in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!trackingData)
    return (
      <View style={styles.wrapper}>
        <Text style={styles.error}>No tracking data found</Text>
      </View>
    );

  const lastEvent = trackingData.events?.[0];

  // ===== SHARE =====
  const handleShare = () => {
    Share.share({
      message: `Tracking number: ${trackingData.tracking_number}\nStatus: ${lastEvent?.description}`,
    });
  };

  // ===== REFRESH =====
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/track?number=${trackingData.tracking_number}`
      );
      const json = await res.json();

      if (!json.error) {
        setTrackingData(json);
      }
    } catch (e) {
      console.warn("Refresh error:", e);
    }
    setRefreshing(false);
  };

  // ===== LOAD GEOPOINTS FOR ALL EVENTS (OSM) =====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const events = trackingData?.events || [];
      const points: GeoPoint[] = [];

      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (!ev.location) continue;

        const geo = await geocode(ev.location);
        if (geo && !cancelled) {
          points.push({
            lat: geo.lat,
            lon: geo.lon,
            location: ev.location,
            eventIndex: i,
          });
        }
      }

      if (!cancelled) {
        setCoords(points);
        if (points.length > 0) {
          setSelectedEventIndex(points[0].eventIndex);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackingData]);

  // ===== FOCUS MAP ON EVENT =====
  const focusOnEvent = (eventIndex: number) => {
    const point = coords.find((p) => p.eventIndex === eventIndex);
    if (!point || !mapRef.current) return;

    setSelectedEventIndex(eventIndex);

    mapRef.current.animateToRegion(
      {
        latitude: point.lat,
        longitude: point.lon,
        latitudeDelta: 3,
        longitudeDelta: 3,
      },
      450
    );

    // подсветка + скролл к событию
    const y = rowOffsets.current[eventIndex];
    if (scrollRef.current && y != null) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 80), animated: true });
    }
  };

  // ===== HANDLE MARKER PRESS =====
  const handleMarkerPress = (p: GeoPoint) => {
    focusOnEvent(p.eventIndex);
  };

  return (
    <View style={styles.wrapper}>
      <ParcelHeader onBack={() => router.back()} onRefresh={onRefresh} />

      <Animated.ScrollView
        ref={scrollRef}
        style={[styles.scroll, { opacity: fadeAnim }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.pageContent}>
          {/* ===== STATUS CARD ===== */}
          <View style={styles.infoCard}>
            <Text style={styles.trackingNumber}>
              {trackingData.tracking_number}
            </Text>
            <Text style={styles.carrier}>{trackingData.carrier}</Text>

            <View style={styles.divider} />

            {lastEvent && (
              <>
                <Text style={styles.label}>Current Status</Text>
                <Text style={styles.status}>{lastEvent.description}</Text>

                <View style={styles.row}>
                  <Clock size={14} color="#9ca3af" />
                  <Text style={styles.statusExtra}>
                    {new Date(lastEvent.time).toLocaleString()}
                  </Text>
                </View>

                {lastEvent.location && (
                  <View style={styles.row}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.statusExtra}>
                      {lastEvent.location}
                    </Text>
                  </View>
                )}
              </>
            )}

            {trackingData.eta && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.label}>Estimated Delivery</Text>
                <Text style={styles.eta}>
                  {formatETA(trackingData.eta)}
                </Text>
              </View>
            )}
          </View>

          {/* ===== DELIVERY PHOTO ===== */}
          {lastEvent?.photo_url && (
            <View style={styles.photoCard}>
              <Image
                source={{ uri: lastEvent.photo_url }}
                style={styles.photo}
                resizeMode="cover"
              />
              <Text style={styles.photoLabel}>Delivery photo</Text>
            </View>
          )}

          {/* ===== INTERACTIVE MAP WITH ROUTE ===== */}
          {coords.length > 0 && (
            <View style={styles.mapCard}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: coords[0].lat,
                  longitude: coords[0].lon,
                  latitudeDelta: 5,
                  longitudeDelta: 5,
                }}
                customMapStyle={darkMapStyle}
              >
                {/* Route line */}
                <Polyline
                  coordinates={coords.map((p) => ({
                    latitude: p.lat,
                    longitude: p.lon,
                  }))}
                  strokeWidth={4}
                  strokeColor="#3b82f6"
                />

                {/* Markers */}
                {coords.map((p, i) => {
                  const isSelected = p.eventIndex === selectedEventIndex;
                  const isStart = i === coords.length - 1; // старый пункт
                  const isEnd = i === 0; // последний (текущий)

                  let pinColor = "#ffffff";
                  if (isEnd) pinColor = "#22c55e"; // зелёный — delivered
                  if (isStart) pinColor = "#facc15"; // жёлтый — origin
                  if (isSelected) pinColor = "#3b82f6"; // выбранный

                  return (
                    <Marker
                      key={i}
                      coordinate={{ latitude: p.lat, longitude: p.lon }}
                      title={p.location}
                      pinColor={pinColor}
                      onPress={() => handleMarkerPress(p)}
                    />
                  );
                })}
              </MapView>

              {/* Legend */}
              <View style={styles.mapLegend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
                  <Text style={styles.legendText}>Latest point</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#facc15" }]} />
                  <Text style={styles.legendText}>Origin</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                  <Text style={styles.legendText}>Selected event</Text>
                </View>
              </View>
            </View>
          )}

          {/* ===== QUICK ACTIONS ===== */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Share2 color="#fff" size={20} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                DeviceEventEmitter.emit(
                  "openTitleEditor",
                  trackingData.tracking_number
                )
              }
            >
              <Star color="#fff" size={20} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                DeviceEventEmitter.emit(
                  "togglePin",
                  trackingData.tracking_number
                )
              }
            >
              <Bookmark color="#fff" size={20} />
              <Text style={styles.actionText}>Pin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                DeviceEventEmitter.emit(
                  "deleteParcel",
                  trackingData.tracking_number
                )
              }
            >
              <Trash2 color="#EF4444" size={20} />
              <Text style={[styles.actionText, { color: "#EF4444" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>

          {/* ===== TIMELINE ===== */}
          <Text style={styles.sectionTitle}>History</Text>

          <View style={styles.timeline}>
            {trackingData.events.map((event: any, i: number) => {
              const isSelected = i === selectedEventIndex;

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => focusOnEvent(i)}
                  onLayout={(e) => {
                    rowOffsets.current[i] = e.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              i === 0 ? "#3b82f6" : "#444",
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: isSelected ? "#ffffff" : "transparent",
                          },
                        ]}
                      />
                      {i < trackingData.events.length - 1 && (
                        <View style={styles.line} />
                      )}
                    </View>

                    <View
                      style={[
                        styles.timelineContent,
                        isSelected && styles.timelineContentSelected,
                      ]}
                    >
                      <Text style={styles.eventDescription}>
                        {event.description}
                      </Text>

                      <View style={styles.row}>
                        <Clock size={14} color="#9ca3af" />
                        <Text style={styles.eventDate}>
                          {new Date(event.time).toLocaleString()}
                        </Text>
                      </View>

                      {event.location && (
                        <View style={styles.row}>
                          <MapPin size={14} color="#6b7280" />
                          <Text style={styles.eventLocation}>
                            {event.location}
                          </Text>
                        </View>
                      )}

                      {event.photo_url && (
                        <Image
                          source={{ uri: event.photo_url }}
                          style={styles.timelinePhoto}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 80 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ===== DARK MAP STYLE (минимальный, чтобы не спорил с UI) =====
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#141414" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e5e5e5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141414" }] },
];

// ======================= STYLES =======================

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  scroll: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  infoCard: {
    backgroundColor: "#111113",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 24,
    width: "100%",
  },

  trackingNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  carrier: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#1f1f1f",
    marginVertical: 10,
  },

  label: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 4,
  },

  status: {
    color: "#3b82f6",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },

  eta: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },

  statusExtra: {
    color: "#9ca3af",
    fontSize: 13,
    marginLeft: 6,
  },

  row: { flexDirection: "row", alignItems: "center", marginTop: 3 },

  photoCard: {
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
  },

  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },

  photoLabel: {
    marginTop: 6,
    color: "#9ca3af",
    fontSize: 13,
  },

  mapCard: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#111113",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapLegend: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: "#e5e7eb",
    fontSize: 11,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: -4,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#111113",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },

  actionText: {
    color: "#fff",
    fontSize: 13,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },

  timeline: { paddingLeft: 4 },

  timelineRow: {
    flexDirection: "row",
    marginBottom: 26,
  },

  timelineLeft: {
    width: 26,
    alignItems: "center",
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#2a2a2a",
    marginTop: 2,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timelineContentSelected: {
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  eventDescription: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  eventDate: { color: "#9ca3af", fontSize: 13, marginLeft: 6 },

  eventLocation: { color: "#6b7280", fontSize: 13, marginLeft: 6 },

  timelinePhoto: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginTop: 10,
  },

  error: { color: "#fff", fontSize: 18, textAlign: "center" },
});

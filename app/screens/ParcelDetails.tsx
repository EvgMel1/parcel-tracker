import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { MapPin, Clock } from "lucide-react-native";

export default function ParcelDetails({ route }: any) {
  const { trackingData } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* === HEADER === */}
      <Text style={styles.title}>Parce2фіввails</Text>

      {/* Tracking number */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>Tracking Number</Text>
        <Text style={styles.value}>{trackingData.tracking_number}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Carrier</Text>
        <Text style={styles.value}>{trackingData.carrier}</Text>

        {trackingData.last_event && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Current Status</Text>
            <Text style={[styles.value, { color: "#3B82F6" }]}>
              {trackingData.last_event?.description}
            </Text>
          </>
        )}
      </View>

      {/* === TIMELINE === */}
      <Text style={styles.sectionTitle}>History</Text>

      <View style={styles.timeline}>
        {trackingData.events.map((event: any, i: number) => (
          <View key={i} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: i === 0 ? "#3b82f6" : "#444" },
                ]}
              />
              {i < trackingData.events.length - 1 && (
                <View style={styles.line} />
              )}
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.eventDescription}>{event.description}</Text>

              <View style={styles.row}>
                <Clock size={14} color="#9ca3af" />
                <Text style={styles.eventDate}>
                  {new Date(event.time).toLocaleString()}
                </Text>
              </View>

              {event.location && (
                <View style={styles.row}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },

  /* === INFO CARD === */
  infoCard: {
    backgroundColor: "#111113",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 24,
  },

  label: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 4,
  },

  value: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#1f1f1f",
    marginVertical: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 14,
  },

  /* === TIMELINE === */
  timeline: {
    paddingLeft: 4,
  },

  timelineRow: {
    flexDirection: "row",
    marginBottom: 26,
  },

  timelineLeft: {
    width: 20,
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
  },

  eventDescription: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  eventDate: {
    color: "#9ca3af",
    fontSize: 13,
    marginLeft: 6,
  },

  eventLocation: {
    color: "#6b7280",
    fontSize: 13,
    marginLeft: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
});

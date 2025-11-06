import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, Search } from 'lucide-react-native';

export default function HomeScreen() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const response = await fetch(`http://localhost:3001/api/track?number=${trackingNumber}`);


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to track parcel');
      }

      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to track parcel');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    if (Platform.OS === 'web') {
      setError('Camera scanning is not available on web');
      return;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Track Your Parcel</Text>
        <Text style={styles.subtitle}>
          Enter your tracking number to get real-time updates
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter tracking number"
            placeholderTextColor="#6b7280"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
            disabled={Platform.OS === 'web'}>
            <Camera size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.trackButton, loading && styles.trackButtonDisabled]}
          onPress={handleTrack}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Search size={20} color="#fff" />
              <Text style={styles.trackButtonText}>Track</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {trackingData && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Tracking Result</Text>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Tracking Number:</Text>
              <Text style={styles.resultValue}>
                {trackingData.tracking_number}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Status:</Text>
              <Text style={styles.resultValue}>{trackingData.status}</Text>
            </View>
            {trackingData.carrier && (
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Carrier:</Text>
                <Text style={styles.resultValue}>{trackingData.carrier}</Text>
              </View>
            )}
            {trackingData.events && trackingData.events.length > 0 && (
              <View style={styles.eventsContainer}>
                <Text style={styles.eventsTitle}>Recent Events</Text>
                {trackingData.events.map((event: any, index: number) => (
                  <View key={index} style={styles.eventItem}>
                    <Text style={styles.eventDate}>{event.date}</Text>
                    <Text style={styles.eventDescription}>
                      {event.description}
                    </Text>
                    {event.location && (
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  scanButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackButtonDisabled: {
    opacity: 0.6,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  resultContainer: {
    marginTop: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: '#fff',
  },
  eventsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  eventItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  eventDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Package, Clock } from 'lucide-react-native';

interface HistoryItem {
  id: string;
  tracking_number: string;
  status: string;
  carrier: string | null;
  tracked_at: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/parcels?type=history');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load history');
      }

      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Package size={20} color="#3b82f6" />
        <Text style={styles.trackingNumber}>{item.tracking_number}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.status}>{item.status}</Text>
        {item.carrier && <Text style={styles.carrier}>{item.carrier}</Text>}
      </View>
      <View style={styles.cardFooter}>
        <Clock size={14} color="#6b7280" />
        <Text style={styles.timestamp}>
          {new Date(item.tracked_at).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tracking History</Text>
        <Text style={styles.subtitle}>
          View all your previously tracked parcels
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#6b7280" />
          <Text style={styles.emptyText}>No tracking history yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking parcels to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  header: {
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
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  cardBody: {
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  carrier: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 16,
  },
});

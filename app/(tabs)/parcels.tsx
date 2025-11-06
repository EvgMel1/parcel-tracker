import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Package, RefreshCw, Trash2 } from 'lucide-react-native';

interface Parcel {
  id: string;
  tracking_number: string;
  status: string;
  carrier: string | null;
  last_updated: string;
}

export default function ParcelsScreen() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      const response = await fetch('/api/parcels?type=active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load parcels');
      }

      setParcels(data.parcels || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load parcels');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadParcels();
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/parcels?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setParcels(parcels.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete parcel:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('delivered')) return '#10b981';
    if (lowerStatus.includes('transit')) return '#3b82f6';
    if (lowerStatus.includes('pending')) return '#f59e0b';
    return '#6b7280';
  };

  const renderItem = ({ item }: { item: Parcel }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Package size={20} color="#3b82f6" />
        <Text style={styles.trackingNumber}>{item.tracking_number}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
        {item.carrier && <Text style={styles.carrier}>{item.carrier}</Text>}
      </View>
      <Text style={styles.timestamp}>
        Updated: {new Date(item.last_updated).toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Parcels</Text>
          <Text style={styles.subtitle}>Track your active shipments</Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          style={styles.refreshButton}>
          <RefreshCw
            size={24}
            color="#3b82f6"
            style={refreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {parcels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#6b7280" />
          <Text style={styles.emptyText}>No active parcels</Text>
          <Text style={styles.emptySubtext}>
            Track a parcel to add it to your list
          </Text>
        </View>
      ) : (
        <FlatList
          data={parcels}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  refreshButton: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
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
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  carrier: {
    fontSize: 12,
    color: '#9ca3af',
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
  errorContainer: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
});

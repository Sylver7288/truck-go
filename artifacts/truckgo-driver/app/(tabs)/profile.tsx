import { Feather } from '@expo/vector-icons';
import { useGetDriver, useGetDriverStats } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function StatRow({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <View style={styles.statLeft}>
        <Feather name={icon as any} size={16} color={accent ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: accent ? colors.primary : colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { driver, logout } = useAuth();
  const driverId = driver?.userId ?? 0;

  const { data: driverData, isLoading: driverLoading } = useGetDriver(driverId, {
    query: { enabled: driverId > 0 },
  });
  const { data: stats, isLoading: statsLoading } = useGetDriverStats(driverId, {
    query: { enabled: driverId > 0 },
  });

  const isLoading = driverLoading || statsLoading;

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace('/login');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Avatar + name */}
          <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {driver?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>{driver?.name}</Text>
              <Text style={[styles.driverEmail, { color: colors.mutedForeground }]}>{driver?.email}</Text>
              <View style={styles.ratingRow}>
                <Feather name="star" size={13} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: colors.foreground }]}>
                  {(stats?.rating ?? 0).toFixed(2)}
                </Text>
                <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
                  ({stats?.reviewCount ?? 0} reviews)
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle info */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Vehicle</Text>
            <StatRow icon="truck" label="Type" value={driverData?.truckTypeName ?? '—'} />
            <StatRow icon="credit-card" label="Plate" value={driverData?.vehiclePlate ?? '—'} />
            {driverData?.vehicleYear ? (
              <StatRow icon="calendar" label="Year" value={String(driverData.vehicleYear)} />
            ) : null}
            <StatRow icon="file-text" label="License" value={driverData?.licenseNumber ?? '—'} />
          </View>

          {/* Stats */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Performance</Text>
            <StatRow icon="check-circle" label="Completed" value={String(stats?.completedTrips ?? 0)} />
            <StatRow icon="x-circle" label="Cancelled" value={String(stats?.cancelledTrips ?? 0)} />
            <StatRow icon="hash" label="Total Trips" value={String(stats?.totalTrips ?? 0)} />
            <StatRow icon="dollar-sign" label="Total Earned" value={`$${(stats?.totalEarnings ?? 0).toFixed(2)}`} accent />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={16} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5, marginBottom: 20 },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' as const, color: '#FFFFFF' },
  avatarInfo: { flex: 1, gap: 3 },
  driverName: { fontSize: 18, fontWeight: '700' as const },
  driverEmail: { fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13, fontWeight: '700' as const },
  reviewCount: { fontSize: 12 },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.5, marginBottom: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600' as const },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700' as const, color: '#EF4444' },
});

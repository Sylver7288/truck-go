import { Feather } from '@expo/vector-icons';
import { useGetDriverStats, useListDriverJobs, useUpdateDriverStatus } from '@workspace/api-client-react';
import { JobCard } from '@/components/JobCard';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { getListDriverJobsQueryKey, getGetDriverStatsQueryKey } from '@workspace/api-client-react';

type DriverStatus = 'available' | 'busy' | 'offline';

const STATUS_LABELS: Record<DriverStatus, string> = {
  available: 'Available',
  busy: 'On a job',
  offline: 'Offline',
};

const STATUS_COLORS: Record<DriverStatus, string> = {
  available: '#22C55E',
  busy: '#F59E0B',
  offline: '#9CA3AF',
};

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const qc = useQueryClient();
  const driverId = driver?.userId ?? 0;

  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useListDriverJobs(driverId, {
    query: { enabled: driverId > 0 },
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetDriverStats(driverId, {
    query: { enabled: driverId > 0 },
  });

  const statusMutation = useUpdateDriverStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDriverJobsQueryKey(driverId) });
        qc.invalidateQueries({ queryKey: getGetDriverStatsQueryKey(driverId) });
      },
    },
  });

  const activeJob = jobs?.find((j) => j.status === 'in_progress' || j.status === 'accepted');
  const pendingJobs = jobs?.filter((j) => j.status === 'pending') ?? [];

  // Derive status from active job
  const currentStatus: DriverStatus = activeJob ? 'busy' : (stats ? 'available' : 'offline');

  const toggleStatus = useCallback(() => {
    if (!driverId) return;
    const next: DriverStatus = currentStatus === 'available' ? 'offline' : 'available';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    statusMutation.mutate({ id: driverId, data: { status: next } });
  }, [currentStatus, driverId]);

  const onRefresh = useCallback(() => {
    refetchJobs();
    refetchStats();
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isLoading = jobsLoading || statsLoading;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting()}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{driver?.name?.split(' ')[0] ?? 'Driver'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusPill, {
            backgroundColor: currentStatus === 'available' ? '#F0FDF4' : currentStatus === 'busy' ? '#FFFBEB' : colors.muted,
            borderColor: STATUS_COLORS[currentStatus],
          }]}
          onPress={toggleStatus}
          disabled={statusMutation.isPending || currentStatus === 'busy'}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[currentStatus] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[currentStatus] }]}>
            {STATUS_LABELS[currentStatus]}
          </Text>
          {currentStatus !== 'busy' && (
            <Feather name="refresh-cw" size={11} color={STATUS_COLORS[currentStatus]} />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stats?.completedTrips ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                ${(stats?.totalEarnings ?? 0).toFixed(0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Earned</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                ★ {(stats?.rating ?? 0).toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
            </View>
          </View>

          {/* Active job */}
          {activeJob ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Job</Text>
              <JobCard
                booking={activeJob}
                onPress={() => router.push(`/job/${activeJob.id}`)}
                highlight
              />
            </View>
          ) : null}

          {/* Pending jobs */}
          {pendingJobs.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New Requests</Text>
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{pendingJobs.length}</Text>
                </View>
              </View>
              {pendingJobs.slice(0, 3).map((job) => (
                <JobCard
                  key={job.id}
                  booking={job}
                  onPress={() => router.push(`/job/${job.id}`)}
                />
              ))}
              {pendingJobs.length > 3 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')} style={styles.viewAll}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    View all {pendingJobs.length} requests
                  </Text>
                  <Feather name="arrow-right" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Empty */}
          {!activeJob && pendingJobs.length === 0 && (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="truck" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {currentStatus === 'offline'
                  ? 'Go online to start receiving job requests'
                  : 'No pending jobs right now. Check back soon.'}
              </Text>
            </View>
          )}
        </>
      )}

      <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' as const },
  name: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' as const },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: '700' as const },
  statLabel: { fontSize: 11, fontWeight: '500' as const },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700' as const },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewAllText: { fontSize: 13, fontWeight: '600' as const },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});

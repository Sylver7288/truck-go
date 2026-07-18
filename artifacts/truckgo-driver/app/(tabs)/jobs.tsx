import { Feather } from '@expo/vector-icons';
import { useListDriverJobs } from '@workspace/api-client-react';
import { JobCard } from '@/components/JobCard';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Filter = 'all' | 'pending' | 'active' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const driverId = driver?.userId ?? 0;
  const [filter, setFilter] = useState<Filter>('all');

  const { data: jobs, isLoading, refetch, isRefetching } = useListDriverJobs(driverId, {
    query: { enabled: driverId > 0 },
  });

  const filtered = (jobs ?? []).filter((j) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return j.status === 'pending';
    if (filter === 'active') return j.status === 'accepted' || j.status === 'in_progress';
    if (filter === 'completed') return j.status === 'completed' || j.status === 'cancelled';
    return true;
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 : insets.bottom + 80;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Jobs</Text>
        <View style={[styles.filters, { backgroundColor: colors.muted }]}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                filter === f.key && { backgroundColor: colors.card, shadowColor: colors.foreground },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          renderItem={({ item }) => (
            <JobCard
              booking={item}
              onPress={() => router.push(`/job/${item.id}`)}
              highlight={item.status === 'in_progress' || item.status === 'accepted'}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={filtered.length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="briefcase" size={28} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jobs here</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {filter === 'all'
                  ? 'Your jobs will appear here once assigned.'
                  : `No ${filter} jobs at the moment.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  filters: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: { fontSize: 12, fontWeight: '600' as const },
  list: { paddingHorizontal: 20, paddingTop: 16 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 240 },
});

import { Feather } from '@expo/vector-icons';
import { Booking } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#F48525', bg: '#FFF3E8' },
  accepted: { label: 'Accepted', color: '#3B82F6', bg: '#EFF6FF' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
  completed: { label: 'Completed', color: '#22C55E', bg: '#F0FDF4' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

interface JobCardProps {
  booking: Booking;
  onPress: () => void;
  highlight?: boolean;
}

export function JobCard({ booking, onPress, highlight = false }: JobCardProps) {
  const colors = useColors();
  const status = booking.status as BookingStatus;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: highlight ? colors.primary : colors.border,
          borderWidth: highlight ? 2 : 1,
          shadowColor: colors.foreground,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={[styles.jobId, { color: colors.mutedForeground }]}>
          #{booking.id}
        </Text>
        <StatusBadge status={status} />
      </View>

      {/* Route */}
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>
            {booking.pickupAddress}
          </Text>
        </View>
        <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.secondary ?? colors.foreground }]} />
          <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>
            {booking.dropoffAddress}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {booking.distanceKm.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Feather name="package" size={12} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {booking.goodsDescription}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.primary }]}>
          ${(booking.finalPrice ?? booking.estimatedPrice).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobId: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  route: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 14,
    marginLeft: 3.5,
    marginVertical: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
});

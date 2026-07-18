import { Feather } from '@expo/vector-icons';
import {
  useGetBooking,
  useAcceptBooking,
  useStartBooking,
  useCompleteBooking,
  useCancelBooking,
  getListDriverJobsQueryKey,
  getGetBookingQueryKey,
} from '@workspace/api-client-react';
import { StatusBadge } from '@/components/JobCard';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={styles.infoLeft}>
        <Feather name={icon as any} size={15} color={colors.mutedForeground} />
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function JobDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { driver } = useAuth();
  const qc = useQueryClient();

  const { data: booking, isLoading, isError } = useGetBooking(bookingId, {
    query: { enabled: bookingId > 0 },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetBookingQueryKey(bookingId) });
    if (driver?.userId) qc.invalidateQueries({ queryKey: getListDriverJobsQueryKey(driver.userId) });
  };

  const acceptMutation = useAcceptBooking({
    mutation: {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); invalidate(); },
    },
  });
  const startMutation = useStartBooking({
    mutation: {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); invalidate(); },
    },
  });
  const completeMutation = useCompleteBooking({
    mutation: {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); invalidate(); router.back(); },
    },
  });
  const cancelMutation = useCancelBooking({
    mutation: {
      onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); invalidate(); router.back(); },
    },
  });

  const isMutating = acceptMutation.isPending || startMutation.isPending || completeMutation.isPending || cancelMutation.isPending;
  const status = booking?.status as BookingStatus | undefined;

  const handleAccept = () => {
    if (!driver?.userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    acceptMutation.mutate({ id: bookingId, data: { driverId: driver.userId } });
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startMutation.mutate({ id: bookingId });
  };

  const handleComplete = () => {
    Alert.alert('Complete Delivery', 'Confirm that the delivery has been completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', style: 'default',
        onPress: () => completeMutation.mutate({ id: bookingId }),
      },
    ]);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.topBar, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Job #{bookingId}</Text>
        {status && <StatusBadge status={status} />}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : isError || !booking ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Could not load job details.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Route card */}
          <View style={[styles.routeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Route</Text>

            <View style={styles.routeItem}>
              <View style={styles.routeIconCol}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.routeConnector, { backgroundColor: colors.border }]} />
              </View>
              <View style={styles.routeText}>
                <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Pickup</Text>
                <Text style={[styles.routeAddr, { color: colors.foreground }]}>{booking.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeItem}>
              <View style={styles.routeIconCol}>
                <View style={[styles.routeDot, { backgroundColor: colors.foreground }]} />
              </View>
              <View style={styles.routeText}>
                <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Dropoff</Text>
                <Text style={[styles.routeAddr, { color: colors.foreground }]}>{booking.dropoffAddress}</Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Details</Text>
            <InfoRow icon="package" label="Goods" value={booking.goodsDescription} />
            <InfoRow icon="map-pin" label="Distance" value={`${booking.distanceKm.toFixed(1)} km`} />
            <InfoRow icon="truck" label="Vehicle" value={booking.truckTypeName ?? '—'} />
            <InfoRow icon="user" label="Customer" value={booking.customerName ?? '—'} />
            {booking.notes ? <InfoRow icon="file-text" label="Notes" value={booking.notes} /> : null}
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Feather name="dollar-sign" size={15} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Payout</Text>
              </View>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                ${(booking.finalPrice ?? booking.estimatedPrice).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          {status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: isMutating ? 0.7 : 1 }]}
              onPress={handleAccept}
              disabled={isMutating}
              activeOpacity={0.85}
            >
              {acceptMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Accept Job</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {status === 'accepted' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#22C55E', opacity: isMutating ? 0.7 : 1 }]}
              onPress={handleStart}
              disabled={isMutating}
              activeOpacity={0.85}
            >
              {startMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="navigation" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Start Trip</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6', opacity: isMutating ? 0.7 : 1 }]}
              onPress={handleComplete}
              disabled={isMutating}
              activeOpacity={0.85}
            >
              {completeMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="flag" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Complete Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(status === 'completed' || status === 'cancelled') && (
            <View style={[styles.doneBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather
                name={status === 'completed' ? 'check-circle' : 'x-circle'}
                size={18}
                color={status === 'completed' ? '#22C55E' : '#EF4444'}
              />
              <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
                This job is {status}.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { marginRight: 4 },
  topBarTitle: { fontSize: 17, fontWeight: '700' as const, flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, textAlign: 'center' },
  linkText: { fontSize: 15, fontWeight: '600' as const },
  scroll: { padding: 20, gap: 16 },
  routeCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 0,
  },
  cardTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, marginBottom: 16 },
  routeItem: { flexDirection: 'row', gap: 14 },
  routeIconCol: { alignItems: 'center', width: 14 },
  routeDot: { width: 14, height: 14, borderRadius: 7, marginTop: 2 },
  routeConnector: { flex: 1, width: 2, marginVertical: 4 },
  routeText: { flex: 1, paddingBottom: 16 },
  routeLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, marginBottom: 2 },
  routeAddr: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  detailCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 12,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500' as const, flex: 1, textAlign: 'right' },
  priceValue: { fontSize: 18, fontWeight: '800' as const },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  doneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
  },
  doneText: { fontSize: 15, fontWeight: '500' as const },
});

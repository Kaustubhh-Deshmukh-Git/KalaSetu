import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore, OrderItem } from '../../store/orderStore';
import { useProductStore } from '../../store/productStore';

export const OrdersScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';

  const { orders, metrics, isLoading, fetchOrders, updateOrderStatus, createSimulatedOrder } = useOrderStore();
  const { products, fetchProducts } = useProductStore();

  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders(selectedChannel);
    fetchProducts();
  }, [selectedChannel]);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
      Alert.alert(t('common.success', 'Success'), `Order status updated to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      Alert.alert(t('common.error', 'Error'), err.message || 'Failed to update status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSimulateOrder = async () => {
    if (!products || products.length === 0) {
      Alert.alert(
        t('orders.emptyTitle', 'No products available'),
        'Please create at least one product in your catalog before simulating orders.'
      );
      return;
    }

    const randomProduct = products[0];
    const channels: Array<'storefront' | 'gem' | 'karigar'> = ['storefront', 'gem', 'karigar'];
    const chosenChannel = channels[Math.floor(Math.random() * channels.length)];
    const price = randomProduct.finalPrice || randomProduct.suggestedPrice?.amount || 1200;

    try {
      await createSimulatedOrder({
        productId: randomProduct as any,
        channel: chosenChannel,
        quantity: 1,
        amount: price,
        buyerInfo: {
          name: 'Demo Craft Buyer',
          phone: '+919876543210',
          address: 'Surajkund Crafts Fair, Haryana',
        },
      });
      Alert.alert(t('common.success', 'Success'), 'Simulated buyer order created!');
    } catch (err: any) {
      Alert.alert(t('common.error', 'Error'), err.message || 'Failed to create order');
    }
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case 'gem':
        return { bg: '#EFF6FF', text: '#1D4ED8', label: 'GeM' };
      case 'karigar':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Karigar' };
      case 'samarth':
        return { bg: '#F5F3FF', text: '#7C3AED', label: 'Samarth' };
      default:
        return { bg: '#FFF7ED', text: '#C2410C', label: 'Storefront' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#ECFDF5', text: '#059669', label: t('orders.statusCompleted', 'Completed') };
      case 'shipped':
        return { bg: '#EFF6FF', text: '#2563EB', label: t('orders.statusShipped', 'Shipped') };
      case 'processing':
        return { bg: '#FFFBEB', text: '#D97706', label: t('orders.statusProcessing', 'Processing') };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#DC2626', label: t('orders.statusCancelled', 'Cancelled') };
      default:
        return { bg: '#FFF7ED', text: '#EA580C', label: t('orders.statusNew', 'New Order') };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('orders.title', 'Orders & Sales')}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.demoBtn} onPress={handleSimulateOrder}>
            <Text style={styles.demoBtnText}>{t('orders.createDemoOrder', '+ Demo Order')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders(selectedChannel)} disabled={isLoading}>
            <Ionicons name="refresh" size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Revenue & Sales Summary Cards */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, styles.earningsCard]}>
            <Text style={styles.metricLabel}>{t('orders.totalEarnings', 'Total Sales Revenue')}</Text>
            <Text style={styles.earningsValue}>₹{metrics?.totalEarnings?.toLocaleString('en-IN') || '0'}</Text>
            <Text style={styles.metricSub}>Direct bank payout</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={[styles.metricCard, styles.halfCard]}>
              <Text style={styles.metricLabel}>{t('orders.activeOrders', 'Active Orders')}</Text>
              <Text style={styles.metricValue}>{metrics?.activeOrdersCount || 0}</Text>
            </View>

            <View style={[styles.metricCard, styles.halfCard]}>
              <Text style={styles.metricLabel}>{t('orders.completedOrders', 'Completed')}</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>{metrics?.completedOrdersCount || 0}</Text>
            </View>
          </View>
        </View>

        {/* Channel Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { id: 'all', label: t('orders.allChannels', 'All') },
            { id: 'storefront', label: t('orders.storefront', 'Storefront') },
            { id: 'gem', label: t('orders.gem', 'GeM Portal') },
            { id: 'karigar', label: t('orders.karigar', 'Amazon Karigar') },
          ].map((tab) => {
            const isSelected = selectedChannel === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedChannel(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Orders List */}
        {isLoading && orders.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#EA580C" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={44} color="#EA580C" />
            </View>
            <Text style={styles.emptyTitle}>{t('orders.emptyTitle', 'No orders in this channel')}</Text>
            <Text style={styles.emptyDesc}>
              {t('orders.emptyDesc', 'Publish your products to your storefront and marketplaces to receive direct buyer orders.')}
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={handleSimulateOrder}>
              <Text style={styles.emptyActionBtnText}>{t('orders.createDemoOrder', '+ Simulate Demo Order')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((ord) => {
            const prod = ord.productId;
            const title = prod?.title?.[lang] || prod?.title?.en || prod?.title?.hi || 'Handcrafted Product';
            const imgUrl = prod?.images?.[0]?.enhancedUrl || prod?.images?.[0]?.originalUrl;
            const channelBadge = getChannelBadgeColor(ord.channel);
            const statusBadge = getStatusBadge(ord.status);
            const isUpdating = updatingOrderId === ord._id;

            return (
              <View key={ord._id} style={styles.orderCard}>
                {/* Order Top Line */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdBox}>
                    <Text style={styles.orderIdText}>#{ord._id.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.channelBadge, { backgroundColor: channelBadge.bg }]}>
                      <Text style={[styles.channelBadgeText, { color: channelBadge.text }]}>
                        {channelBadge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                {/* Product Info Row */}
                <View style={styles.prodRow}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.prodThumb} />
                  ) : (
                    <View style={[styles.prodThumb, styles.placeholderThumb]}>
                      <Text style={{ fontSize: 20 }}>🎨</Text>
                    </View>
                  )}
                  <View style={styles.prodInfo}>
                    <Text style={styles.prodTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.buyerText}>
                      👤 {ord.buyerInfo?.name || 'Buyer'} ({ord.buyerInfo?.phone || ''})
                    </Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                      📍 {ord.buyerInfo?.address || 'India'}
                    </Text>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.amountText}>₹{ord.amount?.toLocaleString('en-IN')}</Text>
                    <Text style={styles.qtyText}>{t('orders.qty', { count: ord.quantity })}</Text>
                  </View>
                </View>

                {/* Order Action Buttons */}
                {ord.status === 'new' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.shipBtn}
                      onPress={() => handleStatusChange(ord._id, 'shipped')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.shipBtnText}>📦 {t('orders.markShipped', 'Mark as Shipped')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : ord.status === 'shipped' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.deliverBtn}
                      onPress={() => handleStatusChange(ord._id, 'completed')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.deliverBtnText}>
                          ✅ {t('orders.markCompleted', 'Mark as Delivered')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  refreshBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsContainer: {
    marginBottom: 16,
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3E8DF',
  },
  earningsCard: {
    backgroundColor: '#FAF5EF',
    borderColor: '#FED7AA',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#9A3412',
  },
  metricSub: {
    fontSize: 11,
    color: '#7C2D12',
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  emptyActionBtn: {
    marginTop: 12,
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3E8DF',
    marginBottom: 12,
    shadowColor: '#8C4A14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  channelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prodThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  placeholderThumb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  prodInfo: {
    flex: 1,
    marginLeft: 10,
  },
  prodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  buyerText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  amountBox: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  qtyText: {
    fontSize: 11,
    color: '#6B7280',
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  shipBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  shipBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deliverBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deliverBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

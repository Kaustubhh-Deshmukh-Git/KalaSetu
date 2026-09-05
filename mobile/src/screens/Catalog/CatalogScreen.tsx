import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore, ProductItem } from '../../store/productStore';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CatalogScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { products, fetchProducts, isLoading } = useProductStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  const draftsCount = products.filter((p) => p.status === 'draft').length;
  const publishedCount = products.filter((p) => p.status === 'published').length;

  const renderProductItem = ({ item }: { item: ProductItem }) => {
    const currentLang = i18n.language;
    const title =
      currentLang === 'hi'
        ? item.title.hi || item.title.en || 'शीर्षक उपलब्ध नहीं'
        : item.title.en || item.title.hi || 'Untitled Craft';

    const coverImage = item.images && item.images.length > 0
      ? (item.images[0].enhancedUrl || item.images[0].originalUrl)
      : null;

    const isPublished = item.status === 'published';

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {/* Thumbnail Image */}
        <View style={styles.imageContainer}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="image-outline" size={28} color="#94A3B8" />
            </View>
          )}

          {/* Status Badge */}
          <View
            style={[
              styles.cardStatusBadge,
              isPublished ? styles.cardStatusPublished : styles.cardStatusDraft,
            ]}
          >
            <Text
              style={[
                styles.cardStatusText,
                isPublished ? styles.cardStatusTextPublished : styles.cardStatusTextDraft,
              ]}
            >
              {isPublished ? t('catalog.statusPublished') : t('catalog.statusDraft')}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.categoryTag}>{item.category || 'Craft'}</Text>
          <Text style={styles.productTitle} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.priceStockRow}>
            <Text style={styles.productPrice}>
              {item.finalPrice ? `₹${item.finalPrice}` : t('catalog.priceNotSet')}
            </Text>
            <View style={styles.stockBadge}>
              <Ionicons name="cube-outline" size={12} color="#64748B" />
              <Text style={styles.stockText}>{item.stockCount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('catalog.title')}</Text>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => navigation.navigate('AddProduct')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('catalog.addNewBtn')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnHeaderText}>{t('catalog.addNewBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            {t('catalog.filterAll', { count: products.length })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'draft' && styles.filterChipActive]}
          onPress={() => setActiveFilter('draft')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeFilter === 'draft' && styles.filterTextActive]}>
            {t('catalog.filterDrafts', { count: draftsCount })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'published' && styles.filterChipActive]}
          onPress={() => setActiveFilter('published')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeFilter === 'published' && styles.filterTextActive]}>
            {t('catalog.filterPublished', { count: publishedCount })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List / Empty State */}
      {isLoading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cube-outline" size={48} color="#C2410C" />
          </View>
          <Text style={styles.emptyTitle}>{t('catalog.emptyTitle')}</Text>
          <Text style={styles.emptyDesc}>{t('catalog.emptyDesc')}</Text>

          <TouchableOpacity
            style={styles.createFirstBtn}
            onPress={() => navigation.navigate('AddProduct')}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
            <Text style={styles.createFirstBtnText}>{t('catalog.addNewBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
    minHeight: 40,
  },
  addBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#7C2D12',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  cardStatusDraft: {
    backgroundColor: 'rgba(254, 215, 170, 0.95)',
  },
  cardStatusPublished: {
    backgroundColor: 'rgba(187, 247, 208, 0.95)',
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardStatusTextDraft: {
    color: '#9A3412',
  },
  cardStatusTextPublished: {
    color: '#15803D',
  },
  productInfo: {
    padding: 12,
    gap: 4,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    minHeight: 38,
  },
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#EA580C',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    minHeight: 52,
    marginTop: 12,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  createFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

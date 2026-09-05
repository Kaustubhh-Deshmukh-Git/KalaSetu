import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore, ProductItem } from '../../store/productStore';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProductDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { productId } = route.params;

  const {
    fetchProductDetail,
    updateProduct,
    deleteProduct,
    selectedProduct,
    isLoading,
  } = useProductStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [product, setProduct] = useState<ProductItem | null>(selectedProduct);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await fetchProductDetail(productId);
        setProduct(data);
      } catch (err: any) {
        Alert.alert(t('common.error'), err.message || 'Failed to load product');
      }
    };
    loadDetail();
  }, [productId]);

  const handleToggleStatus = async () => {
    if (!product) return;
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await updateProduct(product._id, { status: newStatus });
      setProduct(updated);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to update status');
    }
  };

  const handleDelete = () => {
    if (!product) return;
    Alert.alert(t('product.deleteConfirmTitle'), t('product.deleteConfirmMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product._id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (isLoading && !product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const currentLang = i18n.language;
  const displayTitle =
    currentLang === 'hi'
      ? product.title.hi || product.title.en || 'शीर्षक उपलब्ध नहीं'
      : product.title.en || product.title.hi || 'Untitled Craft';

  const displayDesc =
    currentLang === 'hi'
      ? product.description?.hi || product.description?.en || 'कोई विवरण नहीं'
      : product.description?.en || product.description?.hi || 'No description provided';

  const isPublished = product.status === 'published';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('product.detailTitle')}</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={t('product.deleteBtn')}
        >
          <Ionicons name="trash-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Carousel */}
        {product.images && product.images.length > 0 ? (
          <View style={styles.galleryWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {product.images.map((img, idx) => (
                <View key={img._id || idx} style={styles.slideContainer}>
                  <Image
                    source={{ uri: img.enhancedUrl || img.originalUrl }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                  {img.isEnhanced && (
                    <View style={styles.enhancedTag}>
                      <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                      <Text style={styles.enhancedTagText}>AI Enhanced</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {product.images.length > 1 && (
              <View style={styles.paginationDots}>
                {product.images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      activeImageIndex === idx && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noPhotoCard}>
            <Ionicons name="image-outline" size={48} color="#94A3B8" />
            <Text style={styles.noPhotoText}>No photos attached</Text>
          </View>
        )}

        {/* Status & Category Bar */}
        <View style={styles.statusCategoryRow}>
          <TouchableOpacity
            style={[styles.statusBadge, isPublished ? styles.statusPublished : styles.statusDraft]}
            onPress={handleToggleStatus}
            activeOpacity={0.8}
          >
            <View style={[styles.statusDot, isPublished && styles.statusDotPublished]} />
            <Text style={[styles.statusBadgeText, isPublished ? styles.textPublished : styles.textDraft]}>
              {isPublished ? t('catalog.statusPublished') : t('catalog.statusDraft')}
            </Text>
            <Ionicons
              name="sync-outline"
              size={14}
              color={isPublished ? '#15803D' : '#9A3412'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiStudioTriggerBtn}
            onPress={() => navigation.navigate('AIStudio', { productId: product._id })}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.aiStudioTriggerBtnText}>{t('product.openAIStudio')}</Text>
          </TouchableOpacity>
        </View>

        {/* Title & Description */}
        <View style={styles.infoCard}>
          <View style={styles.titleActionRow}>
            <Text style={styles.productTitle}>{displayTitle}</Text>
            <TouchableOpacity
              style={styles.editListingBtn}
              onPress={() => navigation.navigate('ProductReviewEdit', { productId: product._id })}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color="#EA580C" />
              <Text style={styles.editListingBtnText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.productDesc}>{displayDesc}</Text>

          {/* Quick Voice Auto-Cataloger Trigger */}
          <TouchableOpacity
            style={styles.voiceTriggerBanner}
            onPress={() => navigation.navigate('VoiceDescription', { productId: product._id })}
            activeOpacity={0.8}
          >
            <Ionicons name="mic-outline" size={18} color="#7C2D12" />
            <Text style={styles.voiceTriggerText}>
              {t('product.recordVoiceNote')} / Auto-Cataloger
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#7C2D12" />
          </TouchableOpacity>

          {/* Material Tags */}
          {product.materials && product.materials.length > 0 && (
            <View style={styles.materialsWrapper}>
              <Text style={styles.materialsLabel}>{t('product.materialsLabel')}:</Text>
              <View style={styles.tagsRow}>
                {product.materials.map((mat, i) => (
                  <View key={i} style={styles.materialTag}>
                    <Text style={styles.materialTagText}>{mat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Pricing Breakdown Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingHeaderRow}>
            <Text style={styles.sectionHeading}>Financial Breakdown</Text>
            <TouchableOpacity
              style={styles.pricingAssistantBtn}
              onPress={() => navigation.navigate('PricingAssistantDetail', { productId: product._id })}
              activeOpacity={0.8}
            >
              <Text style={styles.pricingAssistantBtnText}>✨ AI Pricing Assistant →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pricesRow}>
            {/* Raw Material Cost */}
            <View style={styles.priceBox}>
              <Text style={styles.priceBoxLabel}>Raw Material Cost</Text>
              <Text style={styles.priceBoxValue}>₹{product.rawMaterialCost || 0}</Text>
              <Text style={styles.costPrivateNotice}>(Private to you)</Text>
            </View>

            {/* Selling Price */}
            <View style={[styles.priceBox, styles.priceBoxHighlight]}>
              <Text style={styles.priceBoxLabelHighlight}>Selling Price</Text>
              <Text style={styles.priceBoxValueHighlight}>
                {product.finalPrice ? `₹${product.finalPrice}` : t('catalog.priceNotSet')}
              </Text>
              <Text style={styles.priceMarginText}>
                {product.finalPrice && product.rawMaterialCost
                  ? `Margin: ₹${product.finalPrice - product.rawMaterialCost}`
                  : (product.suggestedPrice?.amount ? `Suggested: ₹${product.suggestedPrice.amount}` : 'Ready for pricing')}
              </Text>
            </View>
          </View>
        </View>


        {/* Inventory & Stock Card */}
        <View style={styles.stockCard}>
          <View style={styles.stockInfo}>
            <Ionicons name="cube-outline" size={24} color="#EA580C" />
            <View>
              <Text style={styles.stockTitle}>{t('product.stockLabel')}</Text>
              <Text style={styles.stockCountText}>{t('catalog.stock', { count: product.stockCount })}</Text>
            </View>
          </View>
        </View>

        {/* Quick Action: Publish Toggle */}
        <TouchableOpacity
          style={[styles.publishToggleBtn, isPublished ? styles.publishToggleBtnDraft : styles.publishToggleBtnPublish]}
          onPress={handleToggleStatus}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isPublished ? 'pause-circle-outline' : 'cloud-upload-outline'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.publishToggleBtnText}>
            {isPublished ? t('product.markAsDraft') : t('product.markAsPublished')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  galleryWrapper: {
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  enhancedTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(194, 65, 12, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  enhancedTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },
  noPhotoCard: {
    height: 180,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noPhotoText: {
    color: '#64748B',
    fontWeight: '600',
  },
  statusCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
  },
  statusDraft: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  statusPublished: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },
  statusDotPublished: {
    backgroundColor: '#16A34A',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  textDraft: {
    color: '#9A3412',
  },
  textPublished: {
    color: '#15803D',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  aiStudioTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
  },
  aiStudioTriggerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 14,
  },
  titleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  editListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 4,
  },
  editListingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  voiceTriggerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    marginVertical: 4,
  },
  voiceTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C2D12',
    flex: 1,
  },
  productDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  materialsWrapper: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  materialsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  materialTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  pricingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingAssistantBtn: {
    backgroundColor: '#FFF7ED',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pricingAssistantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pricesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceBoxHighlight: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  priceBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  priceBoxLabelHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 4,
  },
  priceBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  priceBoxValueHighlight: {
    fontSize: 22,
    fontWeight: '900',
    color: '#EA580C',
  },
  costPrivateNotice: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  priceMarginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 4,
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stockCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  publishToggleBtn: {
    marginHorizontal: 16,
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  publishToggleBtnPublish: {
    backgroundColor: '#EA580C',
  },
  publishToggleBtnDraft: {
    backgroundColor: '#475569',
  },
  publishToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

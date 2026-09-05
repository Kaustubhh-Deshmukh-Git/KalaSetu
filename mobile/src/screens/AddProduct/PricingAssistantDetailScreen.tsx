import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore } from '../../store/productStore';
import { PriceBreakdown } from '../../components/PriceBreakdown/PriceBreakdown';

type Props = NativeStackScreenProps<RootStackParamList, 'PricingAssistantDetail'>;

export const PricingAssistantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';

  const { selectedProduct, suggestPrice, updateProduct, fetchProductDetail, isLoading } = useProductStore();

  const [customPrice, setCustomPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      const prod = await fetchProductDetail(productId);
      if (prod.finalPrice) {
        setCustomPrice(prod.finalPrice.toString());
      } else if (prod.suggestedPrice?.amount) {
        setCustomPrice(prod.suggestedPrice.amount.toString());
      }

      // If no suggested price yet, calculate it automatically
      if (!prod.suggestedPrice?.amount) {
        setIsCalculating(true);
        const res = await suggestPrice(productId);
        if (!customPrice) {
          setCustomPrice(res.suggestedPrice.toString());
        }
      }
    } catch (err: any) {
      console.error('Failed to load pricing data:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await suggestPrice(productId);
      setCustomPrice(res.suggestedPrice.toString());
      Alert.alert(t('common.success', 'Success'), t('pricing.recalculateSuccess', 'New price suggestion calculated!'));
    } catch (err: any) {
      Alert.alert(t('common.error', 'Error'), err.message || t('pricing.calcError', 'Failed to calculate price suggestion'));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplySuggested = (price: number) => {
    setCustomPrice(price.toString());
  };

  const handleSaveFinalPrice = async () => {
    const numericPrice = parseFloat(customPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert(t('common.error', 'Error'), t('pricing.invalidPrice', 'Please enter a valid selling price.'));
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct(productId, { finalPrice: numericPrice });
      Alert.alert(
        t('common.success', 'Success'),
        t('pricing.savedSuccess', 'Your selling price of ₹{{price}} has been saved.', { price: numericPrice }),
        [{ text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert(t('common.error', 'Error'), err.message || t('pricing.saveError', 'Failed to save price.'));
    } finally {
      setIsSaving(false);
    }
  };

  const product = selectedProduct;
  const title = product?.title?.[lang] || product?.title?.en || product?.title?.hi || t('catalog.untitled', 'Untitled Craft');
  const heroImage = product?.images?.[0]?.enhancedUrl || product?.images?.[0]?.originalUrl;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← {t('common.back', 'Back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pricing.screenTitle', 'Pricing Assistant')}</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRecalculate}
          disabled={isCalculating || isLoading}
        >
          {isCalculating ? (
            <ActivityIndicator size="small" color="#EA580C" />
          ) : (
            <Text style={styles.refreshText}>🔄 {t('pricing.recalculate', 'Refresh')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Product Snapshot Card */}
        <View style={styles.productCard}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.productThumb, styles.placeholderThumb]}>
              <Text style={styles.placeholderEmoji}>🎨</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.productCategory}>
              {product?.category ? product.category.toUpperCase() : 'HANDICRAFT'}
            </Text>
            {product?.materials && product.materials.length > 0 ? (
              <Text style={styles.productMaterials} numberOfLines={1}>
                🧵 {product.materials.join(', ')}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Dynamic Pricing Breakdown Component */}
        <PriceBreakdown
          suggestedPrice={product?.suggestedPrice?.amount}
          minPrice={product?.suggestedPrice?.minPrice}
          maxPrice={product?.suggestedPrice?.maxPrice}
          rawMaterialCost={product?.suggestedPrice?.breakdown?.rawMaterialCost || product?.rawMaterialCost}
          suggestedMargin={product?.suggestedPrice?.breakdown?.suggestedMargin}
          labourEstimate={product?.suggestedPrice?.breakdown?.labourEstimate}
          marketBenchmark={product?.suggestedPrice?.breakdown?.marketBenchmark}
          modelVersion={product?.suggestedPrice?.modelVersion}
          onApplySuggestedPrice={handleApplySuggested}
        />

        {/* Artisan Decision & Hand-Edit Section */}
        <View style={styles.decisionCard}>
          <Text style={styles.decisionTitle}>{t('pricing.yourFinalPrice', 'Your Final Selling Price (₹)')}</Text>
          <Text style={styles.decisionSubtitle}>
            {t('pricing.editNotice', 'You have full autonomy. Edit or set any price you want before publishing.')}
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              value={customPrice}
              onChangeText={setCustomPrice}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.btnDisabled]}
            onPress={handleSaveFinalPrice}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>{t('pricing.saveSellingPrice', 'Save Selling Price')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFE2D3',
  },
  productThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  placeholderThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  productCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  productMaterials: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  decisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DF',
    marginTop: 8,
    shadowColor: '#8C4A14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  decisionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  decisionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rupeeSymbol: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EA580C',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    paddingVertical: 10,
  },
  saveBtn: {
    backgroundColor: '#9A3412',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

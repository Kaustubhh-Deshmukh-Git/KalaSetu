import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore } from '../../store/productStore';
import { Ionicons } from '@expo/vector-icons';

type ReviewRouteProp = RouteProp<RootStackParamList, 'ProductReviewEdit'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProductReviewEditScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const route = useRoute<ReviewRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { productId } = route.params;

  const { fetchProductDetail, updateProduct, selectedProduct, isLoading } = useProductStore();

  const [activeTab, setActiveTab] = useState<'en' | 'hi'>(
    i18n.language === 'en' ? 'en' : 'hi'
  );

  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descHi, setDescHi] = useState('');
  const [tags, setTags] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockCount, setStockCount] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prod = await fetchProductDetail(productId);
        if (prod) {
          setTitleEn(prod.title?.en || '');
          setTitleHi(prod.title?.hi || '');
          setDescEn(prod.description?.en || '');
          setDescHi(prod.description?.hi || '');
          setTags((prod.tags || []).join(', '));
          setSellingPrice(prod.finalPrice ? prod.finalPrice.toString() : '');
          setStockCount(prod.stockCount || 1);
        }
      } catch (err: any) {
        console.warn('Failed to load product detail', err);
      }
    };
    loadData();
  }, [productId]);

  const handleSave = async (status?: 'draft' | 'published') => {
    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await updateProduct(productId, {
        title: { en: titleEn, hi: titleHi },
        description: { en: descEn, hi: descHi },
        tags: tagsArray,
        finalPrice: sellingPrice ? Number(sellingPrice) : null,
        stockCount,
        ...(status && { status }),
      });

      Alert.alert(t('common.success'), 'Product listing updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('MainTabs', { screen: 'CatalogTab' });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to update product');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('review.title')}</Text>
          <Text style={styles.headerSub}>Bilingual E-Commerce Catalog</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Language Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'hi' && styles.tabBtnActive]}
            onPress={() => setActiveTab('hi')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'hi' && styles.tabBtnTextActive]}>
              {t('review.tabHindi')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'en' && styles.tabBtnActive]}
            onPress={() => setActiveTab('en')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'en' && styles.tabBtnTextActive]}>
              {t('review.tabEnglish')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hand-Editable Content Form */}
        <View style={styles.formCard}>
          {activeTab === 'hi' ? (
            <>
              <Text style={styles.inputLabel}>
                {t('review.titleLabel')} (हिन्दी)
              </Text>
              <TextInput
                style={styles.titleInput}
                value={titleHi}
                onChangeText={setTitleHi}
                placeholder="हिन्दी में आकर्षक शीर्षक दर्ज करें"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>
                {t('review.descLabel')} (हिन्दी)
              </Text>
              <TextInput
                style={styles.descInput}
                value={descHi}
                onChangeText={setDescHi}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="शिल्प का विस्तृत हिन्दी विवरण..."
                placeholderTextColor="#94A3B8"
              />
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>
                {t('review.titleLabel')} (English)
              </Text>
              <TextInput
                style={styles.titleInput}
                value={titleEn}
                onChangeText={setTitleEn}
                placeholder="Enter catchy English title"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>
                {t('review.descLabel')} (English)
              </Text>
              <TextInput
                style={styles.descInput}
                value={descEn}
                onChangeText={setDescEn}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Detailed SEO English description..."
                placeholderTextColor="#94A3B8"
              />
            </>
          )}

          {/* Search Tags */}
          <Text style={styles.inputLabel}>{t('review.tagsLabel')}</Text>
          <TextInput
            style={styles.tagsInput}
            value={tags}
            onChangeText={setTags}
            placeholder="comma-separated tags (e.g. handloom, silk, banarasi)"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Price & Stock Card */}
        <View style={styles.priceStockCard}>
          <View style={styles.priceBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>{t('product.sellingPriceLabel')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PricingAssistantDetail', { productId })}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EA580C' }}>
                  ✨ {t('pricing.assistantBadge', 'AI Pricing')} →
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.currencyInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.currencyInput}
                value={sellingPrice}
                onChangeText={setSellingPrice}
                placeholder="1200"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>


          <View style={styles.stockBox}>
            <Text style={styles.inputLabel}>{t('product.stockLabel')}</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setStockCount((prev) => Math.max(0, prev - 1))}
              >
                <Ionicons name="remove" size={18} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{stockCount}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setStockCount((prev) => prev + 1)}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save & Publish Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={() => handleSave('draft')}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveDraftBtnText}>{t('review.saveChanges')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.publishBtn}
            onPress={() => handleSave('published')}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.publishBtnText}>{t('review.publishNow')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    minHeight: 46,
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#7C2D12',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  titleInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 48,
  },
  descInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 140,
    lineHeight: 22,
  },
  tagsInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    minHeight: 44,
  },
  priceStockCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  priceBox: {
    flex: 1,
  },
  stockBox: {
    flex: 1,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginTop: 6,
    minHeight: 48,
  },
  currencySymbol: {
    paddingLeft: 12,
    paddingRight: 6,
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginTop: 6,
    gap: 6,
    minHeight: 48,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperVal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveDraftBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDraftBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  publishBtn: {
    flex: 1.2,
    backgroundColor: '#EA580C',
    borderRadius: 16,
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

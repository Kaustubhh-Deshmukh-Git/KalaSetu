import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { CameraCapture } from '../../components/CameraCapture/CameraCapture';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 'handloom', labelKey: 'product.categories.handloom', icon: 'shirt-outline' },
  { id: 'pottery', labelKey: 'product.categories.pottery', icon: 'color-filter-outline' },
  { id: 'woodcraft', labelKey: 'product.categories.woodcraft', icon: 'hammer-outline' },
  { id: 'metalcraft', labelKey: 'product.categories.metalcraft', icon: 'hardware-chip-outline' },
  { id: 'jewelry', labelKey: 'product.categories.jewelry', icon: 'diamond-outline' },
  { id: 'painting', labelKey: 'product.categories.painting', icon: 'brush-outline' },
  { id: 'leather', labelKey: 'product.categories.leather', icon: 'briefcase-outline' },
  { id: 'bamboo', labelKey: 'product.categories.bamboo', icon: 'leaf-outline' },
];

export const AddProductScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { createProduct, isLoading, isUploading } = useProductStore();

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('handloom');
  const [materials, setMaterials] = useState('');
  const [rawCost, setRawCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockCount, setStockCount] = useState(1);

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('product.titlePlaceholder'));
      return;
    }

    try {
      const isHindi = i18n.language === 'hi';
      const materialsArray = materials
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const created = await createProduct(
        {
          title: {
            en: isHindi ? '' : title.trim(),
            hi: isHindi ? title.trim() : '',
          },
          category,
          materials: materialsArray,
          rawMaterialCost: Number(rawCost) || 0,
          finalPrice: sellingPrice ? Number(sellingPrice) : null,
          stockCount,
          status,
        },
        images
      );

      return created;
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to create product');
      return null;
    }
  };

  const handleSaveAndExit = async (status: 'draft' | 'published') => {
    const created = await handleSave(status);
    if (created) {
      navigation.goBack();
    }
  };

  const handleContinueToVoice = async () => {
    const created = await handleSave('draft');
    if (created) {
      (navigation as any).navigate('VoiceDescription', { productId: created._id });
    }
  };

  const isSubmitting = isLoading || isUploading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('product.addTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Photo Capture Section */}
        <View style={styles.card}>
          <CameraCapture images={images} onChangeImages={setImages} maxImages={5} />
        </View>

        {/* Product Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('product.basicInfo')}</Text>

          {/* Title Input */}
          <Text style={styles.inputLabel}>{t('product.titleLabel')} *</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('product.titlePlaceholder')}
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            accessibilityLabel={t('product.titleLabel')}
          />

          {/* Category Chips */}
          <Text style={styles.inputLabel}>{t('product.categoryLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={18}
                    color={isSelected ? '#FFFFFF' : '#475569'}
                  />
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Materials Input */}
          <Text style={styles.inputLabel}>{t('product.materialsLabel')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('product.materialsPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={materials}
            onChangeText={setMaterials}
            accessibilityLabel={t('product.materialsLabel')}
          />
        </View>

        {/* Pricing & Stock Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('product.costSection')}</Text>
          <Text style={styles.costHelpText}>{t('product.costHelp')}</Text>

          <View style={styles.priceRow}>
            {/* Raw Material Cost */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{t('product.costSection')}</Text>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder={t('product.costPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={rawCost}
                  onChangeText={setRawCost}
                />
              </View>
            </View>

            {/* Selling Price */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{t('product.sellingPriceLabel')}</Text>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder={t('product.sellingPricePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                />
              </View>
            </View>
          </View>

          {/* Stock Stepper */}
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.inputLabel}>{t('product.stockLabel')}</Text>
              <Text style={styles.stockSub}>Units ready for sale</Text>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setStockCount((prev) => Math.max(0, prev - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{stockCount}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setStockCount((prev) => prev + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.saveDraftBtn, isSubmitting && styles.btnDisabled]}
            onPress={() => handleSaveAndExit('draft')}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#475569" size="small" />
            ) : (
              <Text style={styles.saveDraftBtnText}>{t('product.saveDraft')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.voiceFlowBtn, isSubmitting && styles.btnDisabled]}
            onPress={handleContinueToVoice}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Ionicons name="mic" size={20} color="#FFFFFF" />
            <Text style={styles.voiceFlowBtnText}>{t('product.recordVoiceNote')}</Text>
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
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  costHelpText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 50,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 44,
  },
  categoryChipSelected: {
    backgroundColor: '#7C2D12',
    borderColor: '#FED7AA',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    minHeight: 50,
  },
  currencySymbol: {
    paddingLeft: 14,
    paddingRight: 6,
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stockSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 8,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 28,
    textAlign: 'center',
  },
  actionButtonsContainer: {
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
    color: '#475569',
    fontSize: 16,
    fontWeight: '800',
  },
  voiceFlowBtn: {
    flex: 1.2,
    backgroundColor: '#7C2D12',
    borderRadius: 16,
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  voiceFlowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

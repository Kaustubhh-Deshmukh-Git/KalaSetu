import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductStore } from '../../store/productStore';
import { AIStudioPreview } from '../../components/AIStudioPreview/AIStudioPreview';
import { Ionicons } from '@expo/vector-icons';

type StudioRouteProp = RouteProp<RootStackParamList, 'AIStudio'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AIStudioScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<StudioRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { productId } = route.params;

  const {
    fetchProductDetail,
    enhanceProductImage,
    overrideProductImage,
    selectedProduct,
    isLoading,
  } = useProductStore();

  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProductDetail(productId);
  }, [productId]);

  const handleEnhance = async (imageId: string, index: number) => {
    setEnhancingIndex(index);
    try {
      await enhanceProductImage(productId, { imageId, imageIndex: index });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'AI Enhancement failed');
    } finally {
      setEnhancingIndex(null);
    }
  };

  const handleOverride = async (
    imageId: string,
    index: number,
    choice: 'keep_original' | 'accept_enhanced'
  ) => {
    try {
      await overrideProductImage(productId, choice, { imageId, imageIndex: index });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to apply choice');
    }
  };

  const images = selectedProduct?.images || [];

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('studio.title')}</Text>
          <Text style={styles.headerSub}>{t('studio.subtitle')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Studio Photos List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading && !selectedProduct ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : images.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="images-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No photos uploaded to enhance</Text>
          </View>
        ) : (
          images.map((img, idx) => (
            <View key={img._id || idx} style={styles.photoStudioCard}>
              <View style={styles.photoHeader}>
                <Text style={styles.photoNumberText}>
                  Photo {idx + 1} of {images.length}
                </Text>
              </View>

              <AIStudioPreview
                originalUrl={img.originalUrl}
                enhancedUrl={img.enhancedUrl}
                isEnhanced={img.isEnhanced}
                enhancementStatus={img.enhancementStatus}
                isLoading={enhancingIndex === idx}
                onEnhance={() => handleEnhance(img._id || '', idx)}
                onKeepOriginal={() => handleOverride(img._id || '', idx, 'keep_original')}
                onAcceptEnhanced={() => handleOverride(img._id || '', idx, 'accept_enhanced')}
              />
            </View>
          ))
        )}

        {/* Done Action */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>{t('common.save')}</Text>
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  photoStudioCard: {
    gap: 8,
  },
  photoHeader: {
    paddingHorizontal: 4,
  },
  photoNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  doneBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

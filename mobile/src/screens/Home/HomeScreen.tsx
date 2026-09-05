import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { SahayakModal } from '../../components/SahayakModal';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [isSahayakOpen, setIsSahayakOpen] = React.useState(false);

  const handleNavigate = (route: any, params?: any) => {
    navigation.navigate(route, params);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C2D12" />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>
              {t('home.greeting')}, {user?.name || (user?.role === 'artisan' ? t('common.roleArtisan') : t('common.roleFacilitator'))}!
            </Text>
            <Text style={styles.greetingSub}>{t('home.subtitle')}</Text>
          </View>
          <LanguageSwitcher compact />
        </View>

        {/* Sahayak Assistant Floating/Inline Mic Prompt */}
        <TouchableOpacity
          style={styles.sahayakCard}
          activeOpacity={0.85}
          onPress={() => setIsSahayakOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Sahayak Voice AI Assistant"
        >
          <View style={styles.micCircle}>
            <Ionicons name="mic" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.sahayakDetails}>
            <Text style={styles.sahayakTitle}>Sahayak Voice AI (सहायक)</Text>
            <Text style={styles.sahayakSub}>{t('home.sahayakPrompt')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {/* Sahayak Modal */}
      <SahayakModal
        visible={isSahayakOpen}
        onClose={() => setIsSahayakOpen(false)}
      />

      {/* Body Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Core Feature Action Tiles (Voice-and-Icon First) */}
        <View style={styles.gridContainer}>
          {/* Tile 1: Add New Product */}
          <TouchableOpacity
            style={[styles.tileCard, styles.tileCardPrimary]}
            onPress={() => handleNavigate('AddProduct')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('home.addProduct')}
          >
            <View style={[styles.tileIconCircle, styles.tileIconCirclePrimary]}>
              <Ionicons name="camera" size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.tileTitle, styles.tileTitlePrimary]}>
              {t('home.addProduct')}
            </Text>
            <Text style={[styles.tileSub, styles.tileSubPrimary]}>
              {t('home.addProductSub')}
            </Text>
            <View style={styles.tileBadgePrimary}>
              <Ionicons name="sparkles" size={14} color="#C2410C" />
              <Text style={styles.tileBadgeTextPrimary}>AI Studio</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 2: My Catalog */}
          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => handleNavigate('MainTabs', { screen: 'CatalogTab' })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('home.myCatalog')}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="grid-outline" size={26} color="#16A34A" />
            </View>
            <Text style={styles.tileTitle}>{t('home.myCatalog')}</Text>
            <Text style={styles.tileSub}>{t('home.myCatalogSub')}</Text>
          </TouchableOpacity>

          {/* Tile 3: Orders & Sales */}
          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => handleNavigate('MainTabs', { screen: 'OrdersTab' })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('home.orders')}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="receipt-outline" size={26} color="#2563EB" />
            </View>
            <Text style={styles.tileTitle}>{t('home.orders')}</Text>
            <Text style={styles.tileSub}>{t('home.ordersSub')}</Text>
          </TouchableOpacity>

          {/* Tile 4: Marketplace Status */}
          <TouchableOpacity
            style={styles.tileCard}
            onPress={() => handleNavigate('Marketplace')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('home.marketplaceStatus')}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="globe-outline" size={26} color="#9333EA" />
            </View>
            <Text style={styles.tileTitle}>{t('home.marketplaceStatus')}</Text>
            <Text style={styles.tileSub}>{t('home.marketplaceStatusSub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentActivity')}</Text>
        </View>

        <View style={styles.emptyActivityCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="images-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyActivityText}>{t('home.noRecentActivity')}</Text>
          <TouchableOpacity
            style={styles.quickAddBtn}
            onPress={() => handleNavigate('AddProduct')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.quickAddBtnText}>{t('home.addProduct')}</Text>
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
    backgroundColor: '#7C2D12',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  greetingSub: {
    fontSize: 13,
    color: '#FFEDD5',
    marginTop: 2,
  },
  sahayakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    gap: 12,
  },
  micCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sahayakDetails: {
    flex: 1,
  },
  sahayakTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  sahayakSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  tileCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 140,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tileCardPrimary: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  tileIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileIconCirclePrimary: {
    backgroundColor: '#EA580C',
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  tileTitlePrimary: {
    color: '#9A3412',
  },
  tileSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  tileSubPrimary: {
    color: '#C2410C',
  },
  tileBadgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FED7AA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  tileBadgeTextPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    minHeight: 48,
    marginTop: 4,
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

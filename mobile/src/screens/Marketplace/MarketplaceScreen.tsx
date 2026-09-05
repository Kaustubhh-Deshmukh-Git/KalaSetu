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
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMarketplaceStore } from '../../store/marketplaceStore';

export const MarketplaceScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { channels, storefrontUrl, qrDataPayload, isLoading, fetchMarketplaceStatus, connectChannel, disconnectChannel } =
    useMarketplaceStore();

  const [showQrModal, setShowQrModal] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplaceStatus();
  }, []);

  const handleToggleChannel = async (provider: string, currentStatus: string) => {
    setConnectingProvider(provider);
    try {
      if (currentStatus === 'connected') {
        await disconnectChannel(provider);
        Alert.alert(t('common.success', 'Success'), `Disconnected from ${provider.toUpperCase()}`);
      } else {
        await connectChannel(provider);
        Alert.alert(t('common.success', 'Success'), `Connected successfully to ${provider.toUpperCase()}`);
      }
    } catch (err: any) {
      Alert.alert(t('common.error', 'Error'), err.message || 'Failed to update channel status');
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleCopyLink = () => {
    Alert.alert(
      t('marketplace.copyLink', 'Copy Storefront Link'),
      `${storefrontUrl || 'https://kalasetu.app/store'}\n\n${t('marketplace.linkCopied', 'Link copied to clipboard!')}`
    );
  };

  const getChannelIcon = (provider: string) => {
    switch (provider) {
      case 'gem':
        return 'business-outline';
      case 'karigar':
        return 'cart-outline';
      case 'samarth':
        return 'bag-handle-outline';
      default:
        return 'globe-outline';
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
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('marketplace.title', 'Marketplace Connect')}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchMarketplaceStatus()} disabled={isLoading}>
          <Ionicons name="refresh" size={20} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {t('marketplace.subtitle', 'Publish to personal storefront and national e-commerce channels')}
        </Text>

        {/* 1. Digital Storefront Card */}
        <View style={styles.storefrontCard}>
          <View style={styles.storefrontHeader}>
            <View style={styles.storefrontIconBg}>
              <Ionicons name="storefront" size={26} color="#C2410C" />
            </View>
            <View style={styles.storefrontTitles}>
              <Text style={styles.storefrontCardTitle}>
                {t('marketplace.storefrontCardTitle', 'Personal Shareable Storefront')}
              </Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE & ACTIVE</Text>
              </View>
            </View>
          </View>

          <Text style={styles.storefrontCardDesc}>
            {t('marketplace.storefrontCardDesc', 'Share with buyers on WhatsApp, Instagram, or physical craft exhibitions')}
          </Text>

          {/* Storefront Link Box */}
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {storefrontUrl || 'https://kalasetu.app/store/artisan'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.storefrontActionRow}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
              <Text style={styles.copyBtnText}>{t('marketplace.copyLink', 'Copy Link')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQrModal(true)} activeOpacity={0.8}>
              <Ionicons name="qr-code-outline" size={16} color="#7C2D12" />
              <Text style={styles.qrBtnText}>{t('marketplace.showQr', 'Store QR Code')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Channels Section */}
        <Text style={styles.sectionHeading}>
          {t('marketplace.channelsHeading', 'Government & B2B Channels')}
        </Text>

        {channels
          .filter((c) => c.provider !== 'storefront')
          .map((chan) => {
            const isConnected = chan.status === 'connected';
            const isThisLoading = connectingProvider === chan.provider;

            return (
              <View key={chan.provider} style={styles.channelCard}>
                <View style={styles.channelLeft}>
                  <View
                    style={[
                      styles.channelIconBox,
                      isConnected ? styles.channelIconBoxConnected : styles.channelIconBoxInactive,
                    ]}
                  >
                    <Ionicons
                      name={getChannelIcon(chan.provider)}
                      size={24}
                      color={isConnected ? '#059669' : '#6B7280'}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{chan.name}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, isConnected ? styles.dotConnected : styles.dotInactive]} />
                      <Text style={[styles.statusLabel, isConnected ? styles.textConnected : styles.textInactive]}>
                        {isConnected
                          ? `${t('marketplace.connected', 'Connected')} (${chan.externalAccountId || 'Active'})`
                          : t('marketplace.notConnected', 'Not Connected')}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.toggleBtn, isConnected ? styles.disconnectBtn : styles.connectBtn]}
                  onPress={() => handleToggleChannel(chan.provider, chan.status)}
                  disabled={isThisLoading}
                  activeOpacity={0.8}
                >
                  {isThisLoading ? (
                    <ActivityIndicator size="small" color={isConnected ? '#DC2626' : '#FFFFFF'} />
                  ) : (
                    <Text style={[styles.toggleBtnText, isConnected ? styles.disconnectBtnText : styles.connectBtnText]}>
                      {isConnected
                        ? t('marketplace.disconnectBtn', 'Disconnect')
                        : t('marketplace.connectBtn', 'Connect')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('marketplace.qrTitle', 'Artisan Store QR Code')}</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* QR Mock Display */}
            <View style={styles.qrDisplayBox}>
              <Ionicons name="qr-code" size={160} color="#7C2D12" />
              <Text style={styles.qrPayloadText}>{qrDataPayload || 'kalasetu://store'}</Text>
            </View>

            <Text style={styles.modalDesc}>
              {t(
                'marketplace.qrSubtitle',
                'Buyers can scan this code with their phone camera to browse your catalog and order directly from you.'
              )}
            </Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowQrModal(false)}>
              <Text style={styles.modalCloseBtnText}>{t('common.confirm', 'Done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  storefrontCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  storefrontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  storefrontIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storefrontTitles: {
    flex: 1,
  },
  storefrontCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  storefrontCardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  linkBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  linkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  storefrontActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  qrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  qrBtnText: {
    color: '#7C2D12',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3E8DF',
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelIconBoxConnected: {
    backgroundColor: '#ECFDF5',
  },
  channelIconBoxInactive: {
    backgroundColor: '#F3F4F6',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dotConnected: {
    backgroundColor: '#10B981',
  },
  dotInactive: {
    backgroundColor: '#9CA3AF',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  textConnected: {
    color: '#059669',
  },
  textInactive: {
    color: '#6B7280',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectBtn: {
    backgroundColor: '#0F172A',
  },
  disconnectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  connectBtnText: {
    color: '#FFFFFF',
  },
  disconnectBtnText: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  qrDisplayBox: {
    backgroundColor: '#FAF5EF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 16,
  },
  qrPayloadText: {
    fontSize: 11,
    color: '#7C2D12',
    fontWeight: '600',
    marginTop: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

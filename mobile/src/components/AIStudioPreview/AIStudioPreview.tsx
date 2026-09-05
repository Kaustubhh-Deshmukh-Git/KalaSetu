import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIStudioPreviewProps {
  originalUrl: string;
  enhancedUrl?: string | null;
  isEnhanced?: boolean;
  enhancementStatus?: string;
  onEnhance: () => Promise<void>;
  onKeepOriginal: () => Promise<void>;
  onAcceptEnhanced: () => Promise<void>;
  isLoading?: boolean;
}

export const AIStudioPreview: React.FC<AIStudioPreviewProps> = ({
  originalUrl,
  enhancedUrl,
  isEnhanced = false,
  enhancementStatus = 'pending',
  onEnhance,
  onKeepOriginal,
  onAcceptEnhanced,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'before' | 'after'>(
    enhancedUrl ? 'after' : 'before'
  );

  const displayUrl =
    activeTab === 'after' && enhancedUrl ? enhancedUrl : originalUrl;

  const isKeptOriginal = enhancementStatus === 'kept_original';
  const isCompleted = enhancementStatus === 'completed';

  return (
    <View style={styles.container}>
      {/* Before / After Toggle Switcher */}
      <View style={styles.switchHeader}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'before' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('before')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel={t('studio.before')}
          >
            <Ionicons
              name="image-outline"
              size={16}
              color={activeTab === 'before' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'before' && styles.toggleBtnTextActive,
              ]}
            >
              {t('studio.before')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === 'after' && styles.toggleBtnActiveStudio,
              !enhancedUrl && styles.toggleBtnDisabled,
            ]}
            onPress={() => enhancedUrl && setActiveTab('after')}
            disabled={!enhancedUrl}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel={t('studio.after')}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={activeTab === 'after' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'after' && styles.toggleBtnTextActive,
                !enhancedUrl && { color: '#94A3B8' },
              ]}
            >
              {t('studio.after')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Preview Container */}
      <View style={styles.previewBox}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.enhancingText}>{t('studio.enhancing')}</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: displayUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            {/* Badge Indicator */}
            <View style={styles.badgeContainer}>
              {activeTab === 'after' && enhancedUrl ? (
                <View style={styles.studioActiveBadge}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  <Text style={styles.studioActiveBadgeText}>
                    {t('studio.statusEnhanced')}
                  </Text>
                </View>
              ) : (
                <View style={styles.originalBadge}>
                  <Text style={styles.originalBadgeText}>{t('studio.before')}</Text>
                </View>
              )}
            </View>

            {/* Current Selection Status */}
            {enhancedUrl && (
              <View style={styles.decisionBanner}>
                <Ionicons
                  name={isKeptOriginal ? 'ellipse-outline' : 'checkmark-circle'}
                  size={16}
                  color={isKeptOriginal ? '#9A3412' : '#15803D'}
                />
                <Text
                  style={[
                    styles.decisionText,
                    isKeptOriginal ? styles.textKeptOriginal : styles.textEnhanced,
                  ]}
                >
                  {isKeptOriginal ? t('studio.statusKeptOriginal') : t('studio.statusEnhanced')}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Studio Action Controls */}
      <View style={styles.actionsSection}>
        {!enhancedUrl ? (
          <TouchableOpacity
            style={[styles.primaryEnhanceBtn, isLoading && styles.btnDisabled]}
            onPress={onEnhance}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('studio.enhanceBtn')}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.primaryEnhanceBtnText}>{t('studio.enhanceBtn')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.overrideButtonsRow}>
            {/* Keep Original Button */}
            <TouchableOpacity
              style={[
                styles.overrideBtn,
                styles.keepOriginalBtn,
                isKeptOriginal && styles.overrideBtnSelected,
              ]}
              onPress={onKeepOriginal}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={isKeptOriginal ? '#9A3412' : '#475569'}
              />
              <Text
                style={[
                  styles.overrideBtnText,
                  isKeptOriginal && styles.overrideBtnTextSelected,
                ]}
              >
                {t('studio.keepOriginal')}
              </Text>
            </TouchableOpacity>

            {/* Accept Enhanced Button */}
            <TouchableOpacity
              style={[
                styles.overrideBtn,
                styles.acceptEnhancedBtn,
                !isKeptOriginal && isCompleted && styles.acceptEnhancedBtnSelected,
              ]}
              onPress={onAcceptEnhanced}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color={!isKeptOriginal && isCompleted ? '#FFFFFF' : '#EA580C'}
              />
              <Text
                style={[
                  styles.acceptEnhancedBtnText,
                  !isKeptOriginal && isCompleted && { color: '#FFFFFF' },
                ]}
              >
                {t('studio.acceptEnhanced')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Retry / Re-enhance Action */}
        {enhancedUrl && (
          <TouchableOpacity
            style={styles.reEnhanceBtn}
            onPress={onEnhance}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color="#EA580C" />
            <Text style={styles.reEnhanceBtnText}>{t('studio.reEnhance')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  switchHeader: {
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    minHeight: 44,
  },
  toggleBtnActive: {
    backgroundColor: '#1E293B',
  },
  toggleBtnActiveStudio: {
    backgroundColor: '#EA580C',
  },
  toggleBtnDisabled: {
    opacity: 0.5,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  previewBox: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  enhancingText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  studioActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 4,
  },
  studioActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  originalBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  originalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  decisionBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
  },
  decisionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textKeptOriginal: {
    color: '#9A3412',
  },
  textEnhanced: {
    color: '#15803D',
  },
  actionsSection: {
    gap: 10,
  },
  primaryEnhanceBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 14,
    gap: 8,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  primaryEnhanceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  overrideButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overrideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1.5,
  },
  keepOriginalBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  overrideBtnSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  overrideBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  overrideBtnTextSelected: {
    color: '#9A3412',
  },
  acceptEnhancedBtn: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  acceptEnhancedBtnSelected: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  acceptEnhancedBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  reEnhanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  reEnhanceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

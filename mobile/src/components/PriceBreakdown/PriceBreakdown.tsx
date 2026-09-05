import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface PriceBreakdownProps {
  suggestedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  rawMaterialCost?: number;
  suggestedMargin?: number;
  labourEstimate?: number;
  marketBenchmark?: number;
  modelVersion?: string;
  onApplySuggestedPrice?: (price: number) => void;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  suggestedPrice = 0,
  minPrice = 0,
  maxPrice = 0,
  rawMaterialCost = 0,
  suggestedMargin = 0,
  labourEstimate = 0,
  marketBenchmark = 0,
  modelVersion,
  onApplySuggestedPrice,
}) => {
  const { t } = useTranslation();

  const isModelActive = Boolean(suggestedPrice && suggestedPrice > 0);

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.badgeText}>{t('pricing.assistantBadge', 'AI Dynamic Pricing')}</Text>
        </View>
        {modelVersion ? (
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>
              {modelVersion.includes('ml') ? 'ML Model v1' : 'Fair-Price Formula'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Suggested Price Highlight */}
      <View style={styles.mainPriceBox}>
        <Text style={styles.priceTitle}>{t('pricing.suggestedPriceTitle', 'Recommended Fair Price')}</Text>
        <Text style={styles.mainPriceText}>₹{suggestedPrice?.toLocaleString('en-IN') || '0'}</Text>
        {minPrice && maxPrice ? (
          <View style={styles.rangePill}>
            <Text style={styles.rangeText}>
              {t('pricing.range', 'Competitive Range')}: ₹{minPrice.toLocaleString('en-IN')} – ₹
              {maxPrice.toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Plain Language Cost Breakdown Cards */}
      <View style={styles.breakdownList}>
        <Text style={styles.sectionHeader}>{t('pricing.breakdownHeading', 'Plain-Language Cost Breakdown')}</Text>

        {/* 1. Raw Materials */}
        <View style={styles.breakdownRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>🧵</Text>
            <View>
              <Text style={styles.rowTitle}>{t('pricing.rawMaterials', 'Raw Material Cost')}</Text>
              <Text style={styles.rowSubtitle}>{t('pricing.privateNote', '🔒 Strictly private to you')}</Text>
            </View>
          </View>
          <Text style={styles.rowValue}>₹{rawMaterialCost?.toLocaleString('en-IN') || '0'}</Text>
        </View>

        {/* 2. Labour */}
        <View style={styles.breakdownRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>🔨</Text>
            <View>
              <Text style={styles.rowTitle}>{t('pricing.labourEstimate', 'Artisan Labour & Crafting')}</Text>
              <Text style={styles.rowSubtitle}>{t('pricing.labourNote', 'Fair hourly handicraft wage')}</Text>
            </View>
          </View>
          <Text style={styles.rowValue}>₹{labourEstimate?.toLocaleString('en-IN') || '0'}</Text>
        </View>

        {/* 3. Margin */}
        <View style={styles.breakdownRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowEmoji}>📈</Text>
            <View>
              <Text style={styles.rowTitle}>{t('pricing.suggestedMargin', 'Recommended Profit Margin')}</Text>
              <Text style={styles.rowSubtitle}>{t('pricing.marginNote', 'Sustainable business growth')}</Text>
            </View>
          </View>
          <Text style={[styles.rowValue, styles.marginHighlight]}>
            +₹{suggestedMargin?.toLocaleString('en-IN') || '0'}
          </Text>
        </View>

        {/* 4. Market Benchmark */}
        {marketBenchmark ? (
          <View style={[styles.breakdownRow, styles.benchmarkRow]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}>🏷️</Text>
              <View>
                <Text style={styles.rowTitle}>{t('pricing.marketBenchmark', 'Market Cluster Benchmark')}</Text>
                <Text style={styles.rowSubtitle}>{t('pricing.benchmarkNote', 'Similar craft listings')}</Text>
              </View>
            </View>
            <Text style={styles.benchmarkValue}>~₹{marketBenchmark.toLocaleString('en-IN')}</Text>
          </View>
        ) : null}
      </View>

      {/* Security & Artisan Control Note */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          {t(
            'pricing.editableDisclaimer',
            '💡 This is an AI recommendation. You have 100% control over your price and can edit it anytime.'
          )}
        </Text>
      </View>

      {/* Action Button */}
      {onApplySuggestedPrice && isModelActive ? (
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => onApplySuggestedPrice(suggestedPrice || 0)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyButtonText}>
            {t('pricing.useSuggestedPrice', 'Use Suggested Price (Editable)')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DF',
    shadowColor: '#8C4A14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  sparkleIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  versionBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  mainPriceBox: {
    backgroundColor: '#FAF5EF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFE2D3',
  },
  priceTitle: {
    fontSize: 13,
    color: '#6E482B',
    fontWeight: '600',
    marginBottom: 4,
  },
  mainPriceText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#9A3412',
    letterSpacing: -0.5,
  },
  rangePill: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7D5C4',
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C2D12',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  breakdownList: {
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  benchmarkRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginTop: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  marginHighlight: {
    color: '#059669',
  },
  benchmarkValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  noticeText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  applyButton: {
    backgroundColor: '#EA580C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

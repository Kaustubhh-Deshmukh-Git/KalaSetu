import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी', sub: 'Hindi', script: 'क' },
  { code: 'en', label: 'English', sub: 'अंग्रेज़ी', script: 'A' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const { setLanguage } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = async (code: string) => {
    await setLanguage(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.triggerBtn, compact && styles.triggerBtnCompact]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Change Language"
      >
        <Ionicons name="globe-outline" size={compact ? 18 : 22} color="#FFFFFF" />
        <Text style={[styles.triggerText, compact && styles.triggerTextCompact]}>
          {currentLang.label}
        </Text>
        <Ionicons name="chevron-down" size={compact ? 14 : 18} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="language" size={26} color="#9A3412" />
              <Text style={styles.modalTitle}>भाषा चुनें / Select Language</Text>
            </View>

            <View style={styles.optionsList}>
              {LANGUAGES.map((lang) => {
                const isSelected = i18n.language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.optionCard, isSelected && styles.optionCardActive]}
                    onPress={() => handleSelect(lang.code)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.scriptCircle, isSelected && styles.scriptCircleActive]}>
                      <Text style={[styles.scriptText, isSelected && styles.scriptTextActive]}>
                        {lang.script}
                      </Text>
                    </View>
                    <View style={styles.optionDetails}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                        {lang.label}
                      </Text>
                      <Text style={styles.optionSub}>{lang.sub}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#C2410C" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>बंद करें / Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9A3412',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    minHeight: 48,
  },
  triggerBtnCompact: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  triggerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  triggerTextCompact: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 60,
  },
  optionCardActive: {
    borderColor: '#C2410C',
    backgroundColor: '#FFF7ED',
  },
  scriptCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scriptCircleActive: {
    backgroundColor: '#C2410C',
  },
  scriptText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
  },
  scriptTextActive: {
    color: '#FFFFFF',
  },
  optionDetails: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionLabelActive: {
    color: '#9A3412',
  },
  optionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
});

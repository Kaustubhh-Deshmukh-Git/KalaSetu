import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LanguageSelection'>;

interface LangOption {
  code: string;
  name: string;
  nativeName: string;
  subtext: string;
  iconSymbol: string;
}

const LANGUAGES: LangOption[] = [
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    subtext: 'आवाज़ और तस्वीरों से अपना व्यापार बढ़ाएं',
    iconSymbol: 'क',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    subtext: 'Grow your craft business with AI studio & pricing',
    iconSymbol: 'A',
  },
];

export const LanguageSelectionScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { setLanguage } = useAuthStore();
  const [selectedLang, setSelectedLang] = useState<string>(i18n.language || 'hi');

  const handleLanguageChange = async (code: string) => {
    setSelectedLang(code);
    await setLanguage(code);
  };

  const handleProceed = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C2D12" />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Ionicons name="color-palette" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.appTitle}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.screenTitle}>{t('onboarding.chooseLanguage')}</Text>
          <Text style={styles.screenSubtitle}>{t('onboarding.chooseLanguageSubtitle')}</Text>
        </View>

        {/* Voice Cue Indicator */}
        <View style={styles.voiceCueBox}>
          <Ionicons name="volume-high" size={20} color="#EA580C" />
          <Text style={styles.voiceCueText}>{t('onboarding.voiceCue')}</Text>
        </View>

        {/* Language Cards */}
        <View style={styles.languagesList}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={lang.nativeName}
              >
                <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                  <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                    {lang.iconSymbol}
                  </Text>
                </View>

                <View style={styles.langTextContainer}>
                  <Text style={[styles.nativeName, isSelected && styles.nativeNameSelected]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={styles.langSubtext}>{lang.subtext}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleProceed}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('common.continue')}
        >
          <Text style={styles.continueBtnText}>{t('common.continue')}</Text>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7C2D12',
  },
  header: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#7C2D12',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9A3412',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#FFEDD5',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  titleContainer: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  voiceCueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  voiceCueText: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  languagesList: {
    gap: 16,
    marginBottom: 24,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 76,
  },
  langCardSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarCircleSelected: {
    backgroundColor: '#EA580C',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#475569',
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  langTextContainer: {
    flex: 1,
  },
  nativeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  nativeNameSelected: {
    color: '#9A3412',
  },
  langSubtext: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: '#EA580C',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EA580C',
  },
  continueBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 16,
    gap: 10,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

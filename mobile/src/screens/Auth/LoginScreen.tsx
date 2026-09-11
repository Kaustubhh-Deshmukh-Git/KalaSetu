import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { requestOtp, isLoading, error, clearError } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'artisan' | 'facilitator'>('artisan');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setLocalError(null);
    clearError();

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setLocalError(t('auth.invalidPhone'));
      return;
    }

    const fullPhone = cleanDigits.startsWith('91') && cleanDigits.length > 10
      ? `+${cleanDigits}`
      : `+91${cleanDigits.slice(-10)}`;

    try {
      await requestOtp(fullPhone);
      navigation.navigate('OtpVerify', { phone: fullPhone });
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C2D12" />

      {/* Top Bar with Language Switcher */}
      <View style={styles.topBar}>
        <View style={styles.appBadge}>
          <Ionicons name="sparkles" size={18} color="#FED7AA" />
          <Text style={styles.appNameBadge}>{t('appName')}</Text>
        </View>
        <LanguageSwitcher compact />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.screenTitle}>{t('auth.loginTitle')}</Text>
            <Text style={styles.screenSubtitle}>{t('auth.loginSubtitle')}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Role Switcher */}
            <Text style={styles.inputLabel}>{t('auth.selectRole')}</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleTab, role === 'artisan' && styles.roleTabActive]}
                onPress={() => setRole('artisan')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="hammer-outline"
                  size={18}
                  color={role === 'artisan' ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.roleTabText, role === 'artisan' && styles.roleTabTextActive]}>
                  {t('common.roleArtisan')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleTab, role === 'facilitator' && styles.roleTabActive]}
                onPress={() => setRole('facilitator')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={role === 'facilitator' ? '#FFFFFF' : '#475569'}
                />
                <Text
                  style={[styles.roleTabText, role === 'facilitator' && styles.roleTabTextActive]}
                >
                  {t('common.roleFacilitator')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phone Input */}
            <Text style={styles.inputLabel}>{t('auth.phoneLabel')}</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setLocalError(null);
                }}
                accessibilityLabel={t('auth.phoneLabel')}
              />
            </View>

            {/* Error Message */}
            {(localError || error) && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{localError || error}</Text>
              </View>
            )}

            {/* Voice Prompt Assistance */}
            <View style={styles.assistBox}>
              <Ionicons name="mic-outline" size={20} color="#EA580C" />
              <Text style={styles.assistText}>
                {t('common.devOtpHint')}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('auth.sendOtp')}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>{t('auth.sendOtp')}</Text>
                  <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7C2D12',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appNameBadge: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  headerCard: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9A3412',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#FFEDD5',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 36,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    minHeight: 48,
  },
  roleTabActive: {
    backgroundColor: '#7C2D12',
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 56,
  },
  countryCodeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  assistBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  assistText: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
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
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

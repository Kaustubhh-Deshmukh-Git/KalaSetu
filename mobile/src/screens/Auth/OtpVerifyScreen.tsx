import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

type OtpRouteProp = RouteProp<RootStackParamList, 'OtpVerify'>;

export const OtpVerifyScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<OtpRouteProp>();
  const { phone } = route.params;

  const { verifyOtp, requestOtp, isLoading, error, devOtp, clearError } = useAuthStore();

  const [otp, setOtp] = useState(devOtp || '');
  const [timer, setTimer] = useState(60);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (devOtp) {
      setOtp(devOtp);
    }
  }, [devOtp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    setLocalError(null);
    clearError();

    if (otp.length !== 6) {
      setLocalError(t('auth.invalidOtp'));
      return;
    }

    const success = await verifyOtp(phone, otp);
    if (!success && !error) {
      setLocalError(t('auth.invalidOtp'));
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await requestOtp(phone);
      setTimer(60);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C2D12" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="keypad-outline" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.screenTitle}>{t('auth.otpTitle')}</Text>
          <Text style={styles.screenSubtitle}>
            {t('auth.otpSubtitle')} <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </View>

        <View style={styles.content}>
          {/* Dev OTP auto-hint banner */}
          {devOtp && (
            <View style={styles.devHintBanner}>
              <Ionicons name="information-circle" size={20} color="#0369A1" />
              <Text style={styles.devHintText}>
                Dev OTP Code: <Text style={styles.devHintCode}>{devOtp}</Text> (Auto-filled)
              </Text>
            </View>
          )}

          {/* OTP Input Field */}
          <Text style={styles.inputLabel}>{t('auth.otpPlaceholder')}</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="• • • • • •"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setLocalError(null);
            }}
            accessibilityLabel={t('auth.otpPlaceholder')}
          />

          {/* Error Message */}
          {(localError || error) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, isLoading && styles.verifyBtnDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('auth.verifyOtp')}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.verifyBtnText}>{t('auth.verifyOtp')}</Text>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Resend Timer */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.resendTimerText}>
                {t('auth.resendIn', { seconds: timer })}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                <Ionicons name="refresh" size={18} color="#EA580C" />
                <Text style={styles.resendBtnText}>{t('auth.resendOtp')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7C2D12',
  },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 24,
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
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#FFEDD5',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneHighlight: {
    fontWeight: '800',
    color: '#FED7AA',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  devHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  devHintText: {
    color: '#0369A1',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  devHintCode: {
    fontWeight: '900',
    color: '#0C4A6E',
    letterSpacing: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0F172A',
    letterSpacing: 8,
    minHeight: 64,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  verifyBtn: {
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
    marginBottom: 20,
  },
  verifyBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  resendTimerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  resendBtnText: {
    fontSize: 15,
    color: '#EA580C',
    fontWeight: '700',
  },
});

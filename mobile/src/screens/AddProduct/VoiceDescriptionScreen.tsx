import React, { useState } from 'react';
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
import { VoiceRecorder } from '../../components/VoiceRecorder/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';

type VoiceRouteProp = RouteProp<RootStackParamList, 'VoiceDescription'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const VoiceDescriptionScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<VoiceRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { productId } = route.params;

  const { uploadVoiceNote, generateCatalogDescription, isUploading, isLoading } = useProductStore();

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [voiceNoteId, setVoiceNoteId] = useState<string | null>(null);

  const handleRecordingComplete = async (uri: string) => {
    setAudioUri(uri);
    if (uri) {
      try {
        const res = await uploadVoiceNote(productId, uri);
        setVoiceNoteId(res.voiceNoteId);
      } catch (err: any) {
        console.warn('Voice upload error:', err);
      }
    } else {
      setVoiceNoteId(null);
    }
  };

  const handleGenerate = async () => {
    try {
      await generateCatalogDescription(productId, {
        voiceNoteId: voiceNoteId || undefined,
      });

      navigation.navigate('ProductReviewEdit', { productId });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to generate catalog description');
    }
  };

  const isBusy = isLoading || isUploading;

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
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('voice.title')}</Text>
          <Text style={styles.headerSub}>Auto-Cataloger Pipeline</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="mic-circle" size={48} color="#EA580C" />
          </View>
          <Text style={styles.introTitle}>{t('voice.subtitle')}</Text>
          <Text style={styles.introText}>
            Our Multilingual NLP pipeline will transcribe your voice note and craft an SEO-ready title and description in both English and Hindi.
          </Text>
        </View>

        {/* Voice Recorder Component */}
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          recordedUri={audioUri}
        />

        {/* Action Button: Generate AI Catalog */}
        <TouchableOpacity
          style={[styles.generateBtn, isBusy && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={isBusy}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('voice.generateCatalogBtn')}
        >
          {isBusy ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.generateBtnText}>{t('voice.generating')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>{t('voice.generateCatalogBtn')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Skip to manual review */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.navigate('ProductReviewEdit', { productId })}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Skip and write description manually</Text>
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
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  introText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  generateBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginTop: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

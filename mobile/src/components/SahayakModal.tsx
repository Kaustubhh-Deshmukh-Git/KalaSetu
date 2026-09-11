import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAudio } from '../utils/safeAudio';
import { sahayakApi, SahayakPrompt, SahayakQueryResponse } from '../services/sahayakApi';
import { useTranslation } from 'react-i18next';

interface SahayakModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SahayakModal: React.FC<SahayakModalProps> = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const isHindiDefault = i18n.language === 'hi';
  const [activeLang, setActiveLang] = useState<'hi' | 'en'>(isHindiDefault ? 'hi' : 'en');

  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [prompts, setPrompts] = useState<SahayakPrompt[]>([]);
  const [latestResponse, setLatestResponse] = useState<SahayakQueryResponse | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Waveform animated values
  const waveAnim1 = useRef(new Animated.Value(15)).current;
  const waveAnim2 = useRef(new Animated.Value(30)).current;
  const waveAnim3 = useRef(new Animated.Value(20)).current;
  const waveAnim4 = useRef(new Animated.Value(40)).current;
  const waveAnim5 = useRef(new Animated.Value(15)).current;

  // Pulse animation for recording ring
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      loadPrompts();
      // Greet if empty
      if (!latestResponse) {
        setLatestResponse({
          query: '',
          intent: 'unknown',
          answer: {
            hi: 'नमस्ते! मैं आपका कलासेतु सहायक हूँ। आप मुझसे अपने नए ऑर्डर, लिस्टेड उत्पाद, या ऐप इस्तेमाल करने के तरीके के बारे में बोलकर पूछ सकते हैं।',
            en: 'Namaste! I am your KalaSetu Sahayak. Speak or tap below to check your live orders, catalog status, or how to use the app.',
          },
          data: null,
        });
      }
    }
  }, [visible]);

  useEffect(() => {
    if (isRecording) {
      const animateWave = (anim: Animated.Value, min: number, max: number, duration: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: max, duration, useNativeDriver: false }),
            Animated.timing(anim, { toValue: min, duration, useNativeDriver: false }),
          ])
        );
      };

      const a1 = animateWave(waveAnim1, 10, 45, 300);
      const a2 = animateWave(waveAnim2, 15, 60, 250);
      const a3 = animateWave(waveAnim3, 12, 50, 280);
      const a4 = animateWave(waveAnim4, 18, 65, 320);
      const a5 = animateWave(waveAnim5, 10, 40, 270);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );

      a1.start();
      a2.start();
      a3.start();
      a4.start();
      a5.start();
      pulse.start();

      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
        a4.stop();
        a5.stop();
        pulse.stop();
      };
    } else {
      waveAnim1.setValue(15);
      waveAnim2.setValue(25);
      waveAnim3.setValue(20);
      waveAnim4.setValue(30);
      waveAnim5.setValue(15);
      micPulse.setValue(1);
    }
  }, [isRecording]);

  const loadPrompts = async () => {
    try {
      const list = await sahayakApi.getQuickPrompts();
      setPrompts(list);
    } catch (e) {
      console.warn('Failed to load prompts', e);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await SafeAudio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert(activeLang === 'hi' ? 'माइक्रोफ़ोन अनुमति की आवश्यकता है।' : 'Microphone permission is required.');
        return;
      }

      await SafeAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await SafeAudio.createRecordingAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const response = await sahayakApi.sendQuery(undefined, uri);
        setLatestResponse(response);
        playSpeech(response.answer[activeLang]);
      }
    } catch (err: any) {
      console.error('Failed to process voice query', err);
      alert(err.message || 'Error processing audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async (textToSend?: string) => {
    const query = textToSend || textInput;
    if (!query.trim()) return;

    setTextInput('');
    setIsLoading(true);

    try {
      const response = await sahayakApi.sendQuery(query.trim());
      setLatestResponse(response);
      playSpeech(response.answer[activeLang]);
    } catch (err: any) {
      console.error('Failed to send text query', err);
      alert(err.message || 'Error processing query');
    } finally {
      setIsLoading(false);
    }
  };

  const playSpeech = (text: string) => {
    if (!text) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = activeLang === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95;
        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error', e);
      }
    }
  };

  const stopSpeech = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const getIntentBadge = (intent?: string) => {
    switch (intent) {
      case 'order_status':
        return {
          label: activeLang === 'hi' ? '📦 ऑर्डर स्थिति' : '📦 Order Updates',
          color: '#0284C7',
          bgColor: '#E0F2FE',
        };
      case 'listing_status':
        return {
          label: activeLang === 'hi' ? '🏷️ उत्पाद स्थिति' : '🏷️ Product Status',
          color: '#16A34A',
          bgColor: '#DCFCE7',
        };
      case 'how_to':
        return {
          label: activeLang === 'hi' ? '💡 मार्गदर्शन' : '💡 How-To Guide',
          color: '#EA580C',
          bgColor: '#FFEDD5',
        };
      default:
        return {
          label: activeLang === 'hi' ? '✨ सहायक AI' : '✨ Assistant',
          color: '#7C2D12',
          bgColor: '#FEF3C7',
        };
    }
  };

  const badge = getIntentBadge(latestResponse?.intent);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="robot-happy" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>सहायक / Sahayak</Text>
                <Text style={styles.headerSubtitle}>
                  {activeLang === 'hi' ? 'आपका निजी व्यावसायिक सहायक' : 'Your Virtual Business Copilot'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Language Switcher */}
              <TouchableOpacity
                style={styles.langToggle}
                onPress={() => setActiveLang(activeLang === 'hi' ? 'en' : 'hi')}
              >
                <Text style={styles.langToggleText}>
                  {activeLang === 'hi' ? 'EN' : 'हिं'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {/* User Question (if present) */}
            {latestResponse?.query ? (
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>"{latestResponse.query}"</Text>
              </View>
            ) : null}

            {/* Loading Indicator */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EA580C" />
                <Text style={styles.loadingText}>
                  {activeLang === 'hi' ? 'सहायक सोच रहा है...' : 'Sahayak is thinking...'}
                </Text>
              </View>
            ) : null}

            {/* Assistant Answer Box */}
            {!isLoading && latestResponse ? (
              <View style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <View style={[styles.intentBadge, { backgroundColor: badge.bgColor }]}>
                    <Text style={[styles.intentBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>

                  {/* Speaker TTS button */}
                  <TouchableOpacity
                    style={[styles.ttsButton, isPlayingAudio && styles.ttsButtonActive]}
                    onPress={() => {
                      if (isPlayingAudio) stopSpeech();
                      else playSpeech(latestResponse.answer[activeLang]);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isPlayingAudio ? 'volume-high' : 'volume-medium'}
                      size={20}
                      color={isPlayingAudio ? '#FFFFFF' : '#C2410C'}
                    />
                    <Text style={[styles.ttsButtonText, isPlayingAudio && styles.ttsButtonTextActive]}>
                      {isPlayingAudio ? (activeLang === 'hi' ? 'रोकें' : 'Stop') : (activeLang === 'hi' ? 'सुनें' : 'Listen')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.answerText}>
                  {latestResponse.answer[activeLang] || latestResponse.answer.hi || latestResponse.answer.en}
                </Text>

                {/* Statistics Highlight Chips */}
                {latestResponse.data && (
                  <View style={styles.statsContainer}>
                    {latestResponse.data.totalOrders !== undefined && (
                      <View style={styles.statChip}>
                        <Text style={styles.statLabel}>{activeLang === 'hi' ? 'कुल ऑर्डर' : 'Total Orders'}</Text>
                        <Text style={styles.statVal}>{latestResponse.data.totalOrders}</Text>
                      </View>
                    )}
                    {latestResponse.data.totalRevenue !== undefined && (
                      <View style={styles.statChip}>
                        <Text style={styles.statLabel}>{activeLang === 'hi' ? 'कमाई' : 'Revenue'}</Text>
                        <Text style={styles.statVal}>₹{latestResponse.data.totalRevenue.toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                    {latestResponse.data.totalProducts !== undefined && (
                      <View style={styles.statChip}>
                        <Text style={styles.statLabel}>{activeLang === 'hi' ? 'उत्पाद' : 'Products'}</Text>
                        <Text style={styles.statVal}>{latestResponse.data.totalProducts}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : null}

            {/* Quick Starter Chips */}
            <View style={styles.promptsSection}>
              <Text style={styles.promptsTitle}>
                {activeLang === 'hi' ? '💡 अक्सर पूछे जाने वाले सवाल:' : '💡 Quick Questions:'}
              </Text>
              <View style={styles.chipsWrap}>
                {prompts.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.chip}
                    onPress={() => handleSendText(p.query)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="chat-question" size={14} color="#EA580C" style={{ marginRight: 4 }} />
                    <Text style={styles.chipText}>
                      {activeLang === 'hi' ? p.labelHi : p.labelEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Voice & Text Interaction Bar */}
          <View style={styles.footer}>
            {/* Live Waveform when recording */}
            {isRecording && (
              <View style={styles.waveformContainer}>
                <Text style={styles.recordingLabel}>
                  {activeLang === 'hi' ? '🎙️ बोलिए, मैं सुन रहा हूँ...' : '🎙️ Listening to you...'}
                </Text>
                <View style={styles.waveformBars}>
                  <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
                  <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
                  <Animated.View style={[styles.waveBar, { height: waveAnim3 }]} />
                  <Animated.View style={[styles.waveBar, { height: waveAnim4 }]} />
                  <Animated.View style={[styles.waveBar, { height: waveAnim5 }]} />
                </View>
              </View>
            )}

            {/* Controls Row */}
            <View style={styles.controlsRow}>
              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder={activeLang === 'hi' ? 'यहाँ लिखें या बोलें...' : 'Type or speak here...'}
                placeholderTextColor="#9CA3AF"
                value={textInput}
                onChangeText={setTextInput}
                onSubmitEditing={() => handleSendText()}
                returnKeyType="send"
              />

              {textInput.trim() ? (
                <TouchableOpacity style={styles.sendButton} onPress={() => handleSendText()}>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                  <TouchableOpacity
                    style={[styles.micButton, isRecording && styles.micButtonRecording]}
                    onPress={isRecording ? stopRecordingAndSend : startRecording}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={isRecording ? 'stop' : 'microphone'}
                      size={26}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C2410C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggle: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    maxWidth: '85%',
  },
  userBubbleText: {
    fontSize: 15,
    color: '#9A3412',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  answerCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
    marginBottom: 20,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  intentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ttsButtonActive: {
    backgroundColor: '#C2410C',
  },
  ttsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
    marginLeft: 4,
  },
  ttsButtonTextActive: {
    color: '#FFFFFF',
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  statChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 16,
    color: '#C2410C',
    fontWeight: '800',
    marginTop: 2,
  },
  promptsSection: {
    marginTop: 4,
  },
  promptsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  chipText: {
    fontSize: 13,
    color: '#C2410C',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  waveformContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  recordingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 50,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#DC2626',
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#1F2937',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C2410C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C2410C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#DC2626',
  },
});

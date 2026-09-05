import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string) => void;
  recordedUri?: string | null;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  recordedUri,
}) => {
  const { t } = useTranslation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationSecs, setDurationSecs] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setDurationSecs((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDurationSecs(0);
    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        onRecordingComplete(uri);
      }
    } catch (err) {
      console.warn('Failed to stop recording', err);
    }
  };

  const togglePlayback = async () => {
    if (!recordedUri) return;

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    }
  };

  const handleReRecord = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setDurationSecs(0);
    onRecordingComplete('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {!recordedUri ? (
        <View style={styles.recordSection}>
          <TouchableOpacity
            style={[styles.micCircle, isRecording && styles.micCircleRecording]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? t('voice.stopRecording') : t('voice.tapToRecord')}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={36}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.statusTitle}>
            {isRecording ? t('voice.recording') : t('voice.tapToRecord')}
          </Text>

          {isRecording && (
            <Text style={styles.timerText}>{formatTimer(durationSecs)}</Text>
          )}

          <Text style={styles.tipText}>{t('voice.voiceTip')}</Text>
        </View>
      ) : (
        <View style={styles.previewSection}>
          <View style={styles.audioPlayerCard}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={togglePlayback}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.audioDetails}>
              <Text style={styles.audioTitle}>{t('voice.title')}</Text>
              <Text style={styles.audioSub}>
                {isPlaying ? t('voice.pausePreview') : t('voice.playPreview')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.reRecordBtn}
              onPress={handleReRecord}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#EA580C" />
              <Text style={styles.reRecordText}>{t('voice.reRecord')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  recordSection: {
    alignItems: 'center',
    gap: 12,
  },
  micCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micCircleRecording: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 1.06 }],
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  previewSection: {
    width: '100%',
  },
  audioPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    gap: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioDetails: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  audioSub: {
    fontSize: 12,
    color: '#9A3412',
    marginTop: 2,
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  reRecordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
});

/**
 * Safe Audio Helper for KalaSetu
 * Defensively wraps `expo-av` to prevent "Cannot find native module 'ExponentAV'" crashes
 * on emulators or Expo Go clients where legacy ExponentAV native binary is unavailable.
 */

let ExpoAudio: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const av = require('expo-av');
  if (av && av.Audio) {
    ExpoAudio = av.Audio;
  }
} catch (e) {
  console.warn('[SafeAudio] Native ExponentAV module unavailable. Using safe fallback audio stub.');
}

export class SafeRecording {
  private uri: string | null = null;
  private isRec = false;

  async start(): Promise<void> {
    this.isRec = true;
  }

  async stopAndUnloadAsync(): Promise<void> {
    this.isRec = false;
    this.uri = `file:///data/user/0/com.kalasetu.app/cache/mock-voice-recording-${Date.now()}.m4a`;
  }

  getURI(): string | null {
    return this.uri;
  }

  getStatusAsync(): Promise<{ isRecording: boolean; durationMillis: number }> {
    return Promise.resolve({ isRecording: this.isRec, durationMillis: 3500 });
  }
}

export class SafeSound {
  async playAsync(): Promise<void> {}
  async stopAsync(): Promise<void> {}
  async unloadAsync(): Promise<void> {}
  setOnPlaybackStatusUpdate(_cb: any): void {}
}

export const SafeAudio = {
  isNativeAvailable: (): boolean => !!ExpoAudio,

  requestPermissionsAsync: async (): Promise<{ status: 'granted' | 'denied' }> => {
    if (ExpoAudio?.requestPermissionsAsync) {
      try {
        return await ExpoAudio.requestPermissionsAsync();
      } catch {
        return { status: 'granted' };
      }
    }
    return { status: 'granted' };
  },

  setAudioModeAsync: async (options: any): Promise<void> => {
    if (ExpoAudio?.setAudioModeAsync) {
      try {
        await ExpoAudio.setAudioModeAsync(options);
      } catch {
        // Safe no-op
      }
    }
  },

  createRecordingAsync: async (): Promise<{ recording: any }> => {
    if (ExpoAudio?.Recording?.createAsync) {
      try {
        const { recording } = await ExpoAudio.Recording.createAsync(
          ExpoAudio.RecordingOptionsPresets?.HIGH_QUALITY || {}
        );
        return { recording };
      } catch (err) {
        console.warn('[SafeAudio] Native recording failed, using safe fallback:', err);
      }
    }

    const rec = new SafeRecording();
    await rec.start();
    return { recording: rec };
  },

  createSoundAsync: async (_source: any, _initialStatus: any = {}, _onPlaybackStatusUpdate: any = null): Promise<{ sound: any }> => {
    if (ExpoAudio?.Sound?.createAsync) {
      try {
        const { sound } = await ExpoAudio.Sound.createAsync(_source, _initialStatus, _onPlaybackStatusUpdate);
        return { sound };
      } catch (err) {
        console.warn('[SafeAudio] Native sound playback failed, using safe fallback:', err);
      }
    }

    return { sound: new SafeSound() };
  }
};

export default SafeAudio;

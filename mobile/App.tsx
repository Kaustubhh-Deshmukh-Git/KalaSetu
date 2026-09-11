import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ServerWakeBanner } from './src/components/ServerWakeBanner';
import './src/i18n';

LogBox.ignoreLogs(['[SafeAudio]', 'ExponentAV']);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ServerWakeBanner />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

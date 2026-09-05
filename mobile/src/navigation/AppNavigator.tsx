import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';

import { LanguageSelectionScreen } from '../screens/Onboarding/LanguageSelectionScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { OtpVerifyScreen } from '../screens/Auth/OtpVerifyScreen';
import { TabNavigator } from './TabNavigator';
import { AddProductScreen } from '../screens/AddProduct/AddProductScreen';
import { ProductDetailScreen } from '../screens/Catalog/ProductDetailScreen';
import { AIStudioScreen } from '../screens/AddProduct/AIStudioScreen';
import { VoiceDescriptionScreen } from '../screens/AddProduct/VoiceDescriptionScreen';
import { ProductReviewEditScreen } from '../screens/AddProduct/ProductReviewEditScreen';
import { PricingAssistantDetailScreen } from '../screens/AddProduct/PricingAssistantDetailScreen';
import { MarketplaceScreen } from '../screens/Marketplace/MarketplaceScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isInitializing, hasSelectedLanguage, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashTitle}>कलासेतु / KalaSetu</Text>
        <ActivityIndicator size="large" color="#EA580C" style={styles.splashSpinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            {!hasSelectedLanguage && (
              <Stack.Screen
                name="LanguageSelection"
                component={LanguageSelectionScreen}
              />
            )}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
            {hasSelectedLanguage && (
              <Stack.Screen
                name="LanguageSelection"
                component={LanguageSelectionScreen}
              />
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="AIStudio"
              component={AIStudioScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="VoiceDescription"
              component={VoiceDescriptionScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="ProductReviewEdit"
              component={ProductReviewEditScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="PricingAssistantDetail"
              component={PricingAssistantDetailScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="Marketplace"
              component={MarketplaceScreen}
              options={{ presentation: 'card' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};


const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#7C2D12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  splashSpinner: {
    marginTop: 20,
  },
});

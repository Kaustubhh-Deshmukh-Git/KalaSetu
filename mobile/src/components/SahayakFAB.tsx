import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SahayakFABProps {
  onPress: () => void;
}

export const SahayakFAB: React.FC<SahayakFABProps> = ({ onPress }) => {
  const { i18n } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isHindi = i18n.language === 'hi';

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityLabel="Sahayak AI Assistant"
        accessibilityRole="button"
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="microphone" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.title}>{isHindi ? 'सहायक AI' : 'Sahayak AI'}</Text>
          <Text style={styles.subtitle}>{isHindi ? 'बोलकर पूछें' : 'Voice Assistant'}</Text>
        </View>
        <MaterialCommunityIcons name="sparkles" size={16} color="#FDE047" style={styles.sparkle} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 85,
    right: 18,
    zIndex: 999,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C2410C',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#9A3412',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  labelContainer: {
    marginRight: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#FED7AA',
    fontSize: 10,
    fontWeight: '600',
  },
  sparkle: {
    marginLeft: 2,
  },
});

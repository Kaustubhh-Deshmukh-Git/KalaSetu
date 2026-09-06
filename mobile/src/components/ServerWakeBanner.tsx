import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { checkServerHealth } from '../services/api';

export const ServerWakeBanner: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'waking' | 'connected'>('idle');
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const performStartupCheck = async () => {
      // 5-second timer: if server hasn't responded by then, show wake-up banner
      const timer = setTimeout(() => {
        if (isMounted && status !== 'connected') {
          setStatus('waking');
          showBanner();
        }
      }, 5000);

      // Ping health endpoint
      const isAlive = await checkServerHealth(5000);
      clearTimeout(timer);

      if (!isMounted) return;

      if (isAlive) {
        // Server was already awake, no need to show intrusive banner
        if (status === 'waking') {
          handleConnected();
        } else {
          setStatus('connected');
        }
      } else {
        // Server is sleeping, ensure banner is displayed and poll until it wakes up
        setStatus('waking');
        showBanner();
        startPolling();
      }
    };

    performStartupCheck();

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setStatus('idle'));
  };

  const handleConnected = () => {
    setStatus('connected');
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Auto-dismiss after 2.5 seconds
    setTimeout(() => {
      hideBanner();
    }, 2500);
  };

  const startPolling = () => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(async () => {
      const isAlive = await checkServerHealth(4000);
      if (isAlive) {
        handleConnected();
      }
    }, 3500);
  };

  if (status === 'idle') {
    return null;
  }

  const isWaking = status === 'waking';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bannerCard,
          isWaking ? styles.wakingCard : styles.connectedCard,
        ]}
      >
        <View style={styles.iconContainer}>
          {isWaking ? (
            <ActivityIndicator size="small" color="#D97706" />
          ) : (
            <MaterialCommunityIcons name="check-circle" size={24} color="#059669" />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isWaking
              ? t('serverWake.wakingUp', 'Waking up the server, this may take a moment...')
              : t('serverWake.connected', 'Server connected & ready!')}
          </Text>
          <Text style={styles.subtitle}>
            {isWaking
              ? t('serverWake.subtext', 'Connecting to KalaSetu cloud services')
              : 'https://kalasetu-backend-trh4.onrender.com'}
          </Text>
        </View>

        {isWaking && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              const isAlive = await checkServerHealth(3000);
              if (isAlive) handleConnected();
            }}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#D97706" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 10,
    left: 12,
    right: 12,
    zIndex: 99999,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
  },
  wakingCard: {
    backgroundColor: '#FEF3C7', // Amber-100
    borderColor: '#F59E0B',
  },
  connectedCard: {
    backgroundColor: '#ECFDF5', // Emerald-100
    borderColor: '#10B981',
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  retryButton: {
    padding: 6,
    marginLeft: 6,
  },
});

export default ServerWakeBanner;

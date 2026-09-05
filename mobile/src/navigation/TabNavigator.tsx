import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { CatalogScreen } from '../screens/Catalog/CatalogScreen';
import { OrdersScreen } from '../screens/Orders/OrdersScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { SahayakFAB } from '../components/SahayakFAB';
import { SahayakModal } from '../components/SahayakModal';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const [isSahayakOpen, setIsSahayakOpen] = React.useState(false);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#EA580C',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'HomeTab') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'CatalogTab') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'OrdersTab') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            } else if (route.name === 'ProfileTab') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons name={iconName} size={24} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{ tabBarLabel: t('tabs.home') }}
        />
        <Tab.Screen
          name="CatalogTab"
          component={CatalogScreen}
          options={{ tabBarLabel: t('tabs.catalog') }}
        />
        <Tab.Screen
          name="OrdersTab"
          component={OrdersScreen}
          options={{ tabBarLabel: t('tabs.orders') }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ tabBarLabel: t('tabs.profile') }}
        />
      </Tab.Navigator>

      {/* Floating Sahayak Voice Assistant Button */}
      <SahayakFAB onPress={() => setIsSahayakOpen(true)} />

      {/* Sahayak Voice Interaction Modal */}
      <SahayakModal
        visible={isSahayakOpen}
        onClose={() => setIsSahayakOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBarItem: {
    minHeight: 48,
  },
  iconWrapper: {
    padding: 2,
  },
  iconWrapperActive: {
    transform: [{ scale: 1.08 }],
  },
});

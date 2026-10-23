import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import HomeStackNavigator from './HomeStackNavigator';
import TripsScreen from '../screens/trip/TripsScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors, typography } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: any; inactive: any }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  TripsTab: { active: 'car', inactive: 'car-outline' },
  WalletTab: { active: 'wallet', inactive: 'wallet-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

const LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Inicio',
  TripsTab: 'Corridas',
  WalletTab: 'Carteira',
  ProfileTab: 'Perfil',
};

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: typography.captionMedium.fontFamily, fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = ICONS[route.name as keyof MainTabParamList];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: LABELS.HomeTab }} />
      <Tab.Screen name="TripsTab" component={TripsScreen} options={{ title: LABELS.TripsTab }} />
      <Tab.Screen name="WalletTab" component={WalletScreen} options={{ title: LABELS.WalletTab }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: LABELS.ProfileTab }} />
    </Tab.Navigator>
  );
}



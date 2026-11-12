import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/profile/ProfileScreen';
import VehicleScreen from '../screens/vehicle/VehicleScreen';
import IncentivesScreen from '../screens/profile/IncentivesScreen';
import DocumentCenterScreen from '../screens/profile/DocumentCenterScreen';
import LostItemsScreen from '../screens/profile/LostItemsScreen';
import TourismProfileScreen from '../screens/profile/TourismProfileScreen';
import MonthlyServicesScreen from '../screens/profile/MonthlyServicesScreen';
import RatingsScreen from '../screens/profile/RatingsScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Vehicle" component={VehicleScreen} />
      <Stack.Screen name="Incentives" component={IncentivesScreen} />
      <Stack.Screen name="DocumentCenter" component={DocumentCenterScreen} />
      <Stack.Screen name="LostItems" component={LostItemsScreen} />
      <Stack.Screen name="TourismProfile" component={TourismProfileScreen} />
      <Stack.Screen name="MonthlyServices" component={MonthlyServicesScreen} />
      <Stack.Screen name="Ratings" component={RatingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}







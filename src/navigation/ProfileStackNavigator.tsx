import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/profile/ProfileScreen';
import VehicleScreen from '../screens/vehicle/VehicleScreen';
import IncentivesScreen from '../screens/profile/IncentivesScreen';
import DocumentCenterScreen from '../screens/profile/DocumentCenterScreen';
import LostItemsScreen from '../screens/profile/LostItemsScreen';
import TourismProfileScreen from '../screens/profile/TourismProfileScreen';

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
    </Stack.Navigator>
  );
}







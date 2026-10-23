import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import IncomingTripScreen from '../screens/trip/IncomingTripScreen';
import TripNavigationScreen from '../screens/trip/TripNavigationScreen';
import DemandMapScreen from '../screens/home/DemandMapScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="IncomingTrip" component={IncomingTripScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="TripNavigation" component={TripNavigationScreen} />
      <Stack.Screen name="DemandMap" component={DemandMapScreen} />
    </Stack.Navigator>
  );
}



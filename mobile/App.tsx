import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainTabNavigator from './src/navigation/MainTabNavigator';
import SearchScreen from './src/screens/SearchScreen';
import AuthScreen from './src/screens/AuthScreen';
import ClientProfileScreen from './src/screens/ClientProfileScreen';
import SalonDetailScreen from './src/screens/SalonDetailScreen';
import ServicesListScreen from './src/screens/ServicesListScreen';
import BookingWizardScreen from './src/screens/BookingWizardScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import SalonDashboardScreen from './src/screens/SalonDashboardScreen';
import SalonConfigScreen from './src/screens/SalonConfigScreen';
import SalonAbsencesScreen from './src/screens/SalonAbsencesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Main Tab App */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />

          {/* Client Booking Flow */}
          <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ServicesList" component={ServicesListScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Booking" component={BookingWizardScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Confirmation" component={ConfirmationScreen} options={{ animation: 'fade' }} />

          {/* Auth / Profile */}
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ animation: 'slide_from_right' }} />

          {/* Salon Dashboard (Pro) */}
          <Stack.Screen name="SalonDashboard" component={SalonDashboardScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SalonConfig" component={SalonConfigScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SalonAbsences" component={SalonAbsencesScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Linking } from 'react-native';
import { supabase } from './src/lib/supabase';

import { registerForPushNotificationsAsync } from './src/lib/pushNotifications';
import { registerPushToken } from './src/lib/apiService';

import MainTabNavigator from './src/navigation/MainTabNavigator';
import SearchScreen from './src/screens/SearchScreen';
import AuthScreen from './src/screens/AuthScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ClientProfileScreen from './src/screens/ClientProfileScreen';
import SalonDetailScreen from './src/screens/SalonDetailScreen';
import ServicesListScreen from './src/screens/ServicesListScreen';
import BookingWizardScreen from './src/screens/BookingWizardScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import SalonDashboardScreen from './src/screens/SalonDashboardScreen';
import SalonConfigScreen from './src/screens/SalonConfigScreen';
import SalonAbsencesScreen from './src/screens/SalonAbsencesScreen';
import SalonSettingsScreen from './src/screens/SalonSettingsScreen';
import ProLandingScreen from './src/screens/ProLandingScreen';
import SubscriptionRequestScreen from './src/screens/SubscriptionRequestScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef<any>(null);
  const handleSupabaseUrl = async (url: string | null) => {
    if (!url) return;
    if (!url.includes('type=recovery') && !url.includes('reset-password') && !url.includes('type=invite')) return;

    // Helper : parse les params en respectant les = dans les valeurs (JWT base64)
    const parseParams = (str: string): Record<string, string> => {
      const result: Record<string, string> = {};
      str.split('&').filter(Boolean).forEach(p => {
        const eqIdx = p.indexOf('=');
        if (eqIdx > -1) {
          result[p.slice(0, eqIdx)] = decodeURIComponent(p.slice(eqIdx + 1));
        }
      });
      return result;
    };

    try {
      // 1. Essayer le flux PKCE (code dans les query params)
      const queryPart = url.split('?')[1]?.split('#')[0] || '';
      const queryParams = parseParams(queryPart);

      if (queryParams.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(queryParams.code);
        if (!error) {
          setTimeout(() => navigationRef.current?.navigate('ResetPassword' as never), 800);
        }
        return;
      }

      // 2. Flux implicite (tokens dans le fragment #)
      const fragment = url.split('#')[1] || '';
      const fragParams = parseParams(fragment);

      if (fragParams.access_token && fragParams.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: fragParams.access_token,
          refresh_token: fragParams.refresh_token,
        });
        if (!error) {
          setTimeout(() => navigationRef.current?.navigate('ResetPassword' as never), 800);
        }
      }
    } catch (e) {
      console.error('Error parsing deep link', e);
    }
  };

  const linking = {
    prefixes: ['reservy://', 'exp://'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
      },
    },
    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (url) {
        const isRecoveryOrInvite = url.includes('type=recovery') || url.includes('reset-password') || url.includes('type=invite');
        if (isRecoveryOrInvite) {
          // On gère la navigation manuellement dans handleSupabaseUrl
          // On retourne null pour que React Navigation ne tente pas de router en même temps
          await handleSupabaseUrl(url);
          return null;
        }
      }
      return url;
    },
    subscribe(listener: (url: string) => void) {
      const onReceiveURL = async ({ url }: { url: string }) => {
        const isRecoveryOrInvite = url.includes('type=recovery') || url.includes('reset-password') || url.includes('type=invite');
        if (isRecoveryOrInvite) {
          // On gère nous-mêmes, pas besoin d'appeler listener
          await handleSupabaseUrl(url);
          return;
        }
        listener(url);
      };
      const subscription = Linking.addEventListener('url', onReceiveURL);
      return () => subscription.remove();
    },
  };

  // Écouter l'événement PASSWORD_RECOVERY pour naviguer vers l'écran de réinitialisation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Attendre que le navigateur soit prêt avant de naviguer
        setTimeout(() => {
          navigationRef.current?.navigate('ResetPassword');
        }, 300);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Demander la permission et récupérer le token Push au lancement de l'application
    const setupPushNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await AsyncStorage.setItem('expo_push_token', token);
          // Synchroniser le token avec le backend si un numéro vérifié existe déjà
          const verifiedPhone = await AsyncStorage.getItem('verified_phone');
          if (verifiedPhone) {
            await registerPushToken(verifiedPhone, token);
          }
        }
      } catch (error) {
        console.error("Erreur d'initialisation des notifications:", error);
      }
    };
    
    setupPushNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer 
          ref={navigationRef}
          linking={linking}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Main Tab App */}
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />

            {/* Client Booking Flow */}
            <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ServicesList" component={ServicesListScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Booking" component={BookingWizardScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} options={{ animation: 'fade' }} />

            {/* Auth / Profile */}
            <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />

            {/* Salon Dashboard (Pro) */}
            <Stack.Screen name="SalonDashboard" component={SalonDashboardScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SalonConfig" component={SalonConfigScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SalonAbsences" component={SalonAbsencesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SalonSettings" component={SalonSettingsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ animation: 'slide_from_bottom' }} />

            {/* Pro Onboarding */}
            <Stack.Screen name="ProLanding" component={ProLandingScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="SubscriptionRequest" component={SubscriptionRequestScreen} options={{ animation: 'slide_from_right' }} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

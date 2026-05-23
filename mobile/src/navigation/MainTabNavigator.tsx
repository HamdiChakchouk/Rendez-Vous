import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Heart, Bell, LayoutDashboard, CalendarOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

import LandingScreen from '../screens/LandingScreen';
import BookingsScreen from '../screens/BookingsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SalonDashboardScreen from '../screens/SalonDashboardScreen';
import SalonAbsencesScreen from '../screens/SalonAbsencesScreen';

const Tab = createBottomTabNavigator();

type UserRole = 'super_admin' | 'manager' | 'coiffeur' | 'client' | null;

export default function MainTabNavigator() {
    const insets = useSafeAreaInsets();
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRole(userId: string) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .maybeSingle();
                
                if (error) throw error;
                setRole((data?.role as UserRole) || 'client');
            } catch (err) {
                console.error('Erreur récupération rôle navigator:', err);
                setRole('client');
            } finally {
                setLoading(false);
            }
        }

        async function initAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchRole(session.user.id);
            } else {
                setRole('client');
                setLoading(false);
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setLoading(true);
                await fetchRole(session.user.id);
            } else {
                setRole('client');
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#1152d4" />
            </View>
        );
    }

    const isPro = role === 'manager' || role === 'coiffeur';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#1152d4',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#F3F4F6',
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 8),
                    height: 60 + Math.max(insets.bottom, 0),
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
                tabBarIcon: ({ color }) => {
                    if (route.name === 'Accueil') return <Home size={22} color={color} />;
                    if (route.name === 'Dashboard') return <LayoutDashboard size={22} color={color} />;
                    if (route.name === 'RDV') return <Calendar size={22} color={color} />;
                    if (route.name === 'Absences') return <CalendarOff size={22} color={color} />;
                    if (route.name === 'Favoris') return <Heart size={22} color={color} />;
                    if (route.name === 'Notifications') return <Bell size={22} color={color} />;
                    return null;
                },
            })}>
            {isPro ? (
                <>
                    <Tab.Screen name="Dashboard" component={SalonDashboardScreen} options={{ tabBarLabel: 'Espace Salon' }} />
                    <Tab.Screen name="Absences" component={SalonAbsencesScreen} options={{ tabBarLabel: role === 'coiffeur' ? 'Mes Absences' : 'Absences' }} />
                    <Tab.Screen name="Notifications" component={NotificationsScreen} />
                </>
            ) : (
                <>
                    <Tab.Screen name="Accueil" component={LandingScreen} />
                    <Tab.Screen name="RDV" component={BookingsScreen} />
                    <Tab.Screen name="Favoris" component={FavoritesScreen} />
                    <Tab.Screen name="Notifications" component={NotificationsScreen} />
                </>
            )}
        </Tab.Navigator>
    );
}

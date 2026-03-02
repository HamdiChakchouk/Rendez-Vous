import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Heart, User } from 'lucide-react-native';
import LandingScreen from '../screens/LandingScreen';
import BookingsScreen from '../screens/BookingsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
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
                    paddingBottom: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
                tabBarIcon: ({ color }) => {
                    if (route.name === 'Accueil') return <Home size={22} color={color} />;
                    if (route.name === 'RDV') return <Calendar size={22} color={color} />;
                    if (route.name === 'Favoris') return <Heart size={22} color={color} />;
                    if (route.name === 'Profil') return <User size={22} color={color} />;
                    return null;
                },
            })}>
            <Tab.Screen name="Accueil" component={LandingScreen} />
            <Tab.Screen name="RDV" component={BookingsScreen} />
            <Tab.Screen name="Favoris" component={FavoritesScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

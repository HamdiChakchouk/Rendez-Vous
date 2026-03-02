import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, Star, HelpCircle, LogOut, ChevronRight, Shield } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const MENU_ITEMS = [
    { icon: User, label: 'Mon profil', screen: 'ClientProfile' },
    { icon: Bell, label: 'Notifications', screen: null },
    { icon: Star, label: 'Mes avis', screen: null },
    { icon: Shield, label: 'Confidentialité', screen: null },
    { icon: HelpCircle, label: 'Aide & Support', screen: null },
    { icon: Settings, label: 'Paramètres', screen: null },
];

export default function ProfileScreen({ navigation }: any) {
    async function handleLogout() {
        await supabase.auth.signOut();
        navigation.replace('Landing');
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>GLOWUP</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <User size={44} color="#9CA3AF" />
                    </View>
                    <Text style={styles.userName}>Mon compte</Text>
                    <Text style={styles.userEmail}>client@glowup.tn</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ClientProfile')}>
                        <Text style={styles.editBtnText}>Modifier mon profil</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>RDV à venir</Text>
                    </View>
                    <View style={styles.statSeparator} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>RDV passés</Text>
                    </View>
                    <View style={styles.statSeparator} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>5</Text>
                        <Text style={styles.statLabel}>Favoris</Text>
                    </View>
                </View>

                {/* Menu */}
                <View style={styles.menuSection}>
                    {MENU_ITEMS.map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.menuItem}
                            onPress={() => item.screen && navigation.navigate(item.screen)}>
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIconBox}>
                                    <item.icon size={20} color="#374151" />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <ChevronRight size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    avatarSection: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, marginBottom: 12 },
    avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    userName: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
    editBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#111' },
    editBtnText: { fontSize: 14, fontWeight: '700', color: '#111' },
    statsRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, marginBottom: 12 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#6B7280' },
    statSeparator: { width: 1, backgroundColor: '#E5E7EB' },
    menuSection: { backgroundColor: '#fff', marginBottom: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    menuIconBox: { width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { fontSize: 15, fontWeight: '600', color: '#111' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 14 },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});

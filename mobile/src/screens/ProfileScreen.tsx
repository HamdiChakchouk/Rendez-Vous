import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    User, Settings, Bell, HelpCircle, LogOut,
    ChevronRight, Shield, LayoutDashboard, ExternalLink,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

type Role = 'super_admin' | 'manager' | 'coiffeur' | 'client' | null;

const ROLE_LABELS: Record<string, string> = {
    super_admin: '⭐ Super Admin',
    manager: '🏪 Manager',
    coiffeur: '✂️ Coiffeur',
    client: '👤 Client',
};

// URL de votre app web en production (ou localhost en dev)
const WEB_BASE_URL = 'http://192.168.1.39:3000';

export default function ProfileScreen({ navigation }: any) {
    const [userEmail, setUserEmail] = useState('');
    const [displayName, setDisplayName] = useState('Mon compte');
    const [role, setRole] = useState<Role>(null);
    const [initials, setInitials] = useState('?');

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserEmail(user.email || '');

        const { data: profile } = await supabase
            .from('profiles')
            .select('nom, prenom, role')
            .eq('id', user.id)
            .maybeSingle();

        if (profile) {
            setRole(profile.role as Role);
            const name = [profile.prenom, profile.nom].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Mon compte';
            setDisplayName(name);
            setInitials(name.slice(0, 2).toUpperCase());
        } else {
            const fallback = user.email?.split('@')[0] || 'Mon compte';
            setDisplayName(fallback);
            setInitials(fallback.slice(0, 2).toUpperCase());
        }
    }

    async function handleLogout() {
        Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Se déconnecter',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    navigation.replace('Landing');
                },
            },
        ]);
    }

    function openWebUrl(path: string) {
        Linking.openURL(`${WEB_BASE_URL}${path}`).catch(() =>
            Alert.alert('Erreur', "Impossible d'ouvrir le lien.")
        );
    }

    // ── Menu items based on role ──────────────────────────────
    const menuItems = [
        {
            icon: User,
            label: 'Personnaliser le profil',
            color: '#111',
            bg: '#F3F4F6',
            onPress: () => navigation.navigate('ClientProfile'),
            always: true,
        },
        {
            icon: LayoutDashboard,
            label: 'Espace Salon',
            color: '#1152d4',
            bg: '#EEF2FF',
            onPress: () => openWebUrl('/dashboard'),
            roles: ['super_admin', 'manager', 'coiffeur'],
            badge: 'Web',
        },
        {
            icon: Shield,
            label: 'Administration',
            color: '#7C3AED',
            bg: '#F5F3FF',
            onPress: () => openWebUrl('/admin'),
            roles: ['super_admin'],
            badge: 'Web',
        },
        {
            icon: Bell,
            label: 'Notifications',
            color: '#374151',
            bg: '#F3F4F6',
            onPress: () => Alert.alert('Bientôt disponible', 'Les notifications push arrivent prochainement.'),
            always: true,
        },
        {
            icon: HelpCircle,
            label: 'Aide & Support',
            color: '#374151',
            bg: '#F3F4F6',
            onPress: () => Linking.openURL('mailto:support@reservy.tn'),
            always: true,
        },
        {
            icon: Settings,
            label: 'Paramètres',
            color: '#374151',
            bg: '#F3F4F6',
            onPress: () => Alert.alert('Bientôt disponible', ''),
            always: true,
        },
    ].filter(item => item.always || (item.roles && role && item.roles.includes(role)));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>RESERVY</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ── Avatar Section ─────────────────────────── */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{userEmail}</Text>
                    {role && (
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>{ROLE_LABELS[role] || role}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ClientProfile')}>
                        <Text style={styles.editBtnText}>Modifier mon profil</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Menu ───────────────────────────────────── */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, idx) => (
                        <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.menuItemRight}>
                                {item.badge && (
                                    <View style={styles.webBadge}>
                                        <ExternalLink size={10} color="#6B7280" />
                                        <Text style={styles.webBadgeText}>{item.badge}</Text>
                                    </View>
                                )}
                                <ChevronRight size={18} color="#D1D5DB" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Logout ─────────────────────────────────── */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Reservy v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    avatarSection: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, marginBottom: 12 },
    avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 28, fontWeight: '900', color: '#fff' },
    userName: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
    userEmail: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
    roleBadge: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16 },
    roleBadgeText: { fontSize: 13, fontWeight: '700', color: '#374151' },
    editBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#111' },
    editBtnText: { fontSize: 14, fontWeight: '700', color: '#111' },
    menuSection: { backgroundColor: '#fff', marginBottom: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    menuIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { fontSize: 15, fontWeight: '600', color: '#111' },
    webBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    webBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 14 },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
    version: { textAlign: 'center', fontSize: 11, color: '#D1D5DB', marginBottom: 32 },
});

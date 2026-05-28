import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ArrowLeft, Check, CheckSquare, User, Globe, ChevronDown } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface Notification {
    id: string;
    user_id: string;
    titre: string;
    contenu: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications(silent = false) {
        if (!silent) setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(!!user);
            
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (e: any) {
            console.error('Erreur lors du chargement des notifications:', e);
            Alert.alert('Erreur', 'Impossible de récupérer vos notifications.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function markAsRead(id: string) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (e: any) {
            console.error('Erreur de marquage comme lu:', e);
        }
    }

    async function markAllAsRead() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (e: any) {
            console.error('Erreur pour tout marquer comme lu:', e);
            Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues.');
        }
    }

    function formatDate(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Page Title Row */}
                <View style={styles.pageTitleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pageTitle}>Notifications</Text>
                        <Text style={styles.pageSubtitle}>Gérez vos alertes</Text>
                    </View>
                </View>
                <ActivityIndicator size="large" color="#111" style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Page Title Row */}
            <View style={styles.pageTitleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Notifications</Text>
                    <Text style={styles.pageSubtitle}>Gérez vos alertes</Text>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                        <CheckSquare size={20} color="#1152d4" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {isLoggedIn === false ? (
                <View style={styles.emptyState}>
                    <User size={60} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>Vous n'êtes pas connecté</Text>
                    <Text style={styles.emptySubtitle}>
                        Connectez-vous pour voir vos notifications.
                    </Text>
                    <TouchableOpacity
                        style={[styles.markAllBtn, { backgroundColor: '#111', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 12 }]}
                        onPress={() => navigation.navigate('Auth')}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Bell size={60} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>Aucune notification</Text>
                    <Text style={styles.emptySubtitle}>
                        Vous n'avez pas encore reçu de notification sur votre compte.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />
                    }
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.card, !item.is_read && styles.cardUnread]}
                            onPress={() => markAsRead(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardTitle, !item.is_read && styles.textBold]}>
                                    {item.titre}
                                </Text>
                                {!item.is_read && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.cardContent}>{item.contenu}</Text>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardTime}>{formatDate(item.created_at)}</Text>
                                {item.is_read && (
                                    <View style={styles.readIndicator}>
                                        <Check size={14} color="#9CA3AF" />
                                        <Text style={styles.readText}>Lu</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    langBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    langText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111',
    },
    logo: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 4,
        color: '#111',
    },
    profileBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#111',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    pageTitleRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 14, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#F3F4F6' 
    },
    pageTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    pageSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    markAllBtn: {
        padding: 4,
    },
    list: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardUnread: {
        backgroundColor: '#F9FAFB',
        borderColor: '#EBF5FF',
        borderLeftWidth: 4,
        borderLeftColor: '#1152d4',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    textBold: {
        fontWeight: '800',
        color: '#111',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1152d4',
        marginLeft: 8,
    },
    cardContent: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTime: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    readIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    readText: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronRight, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'En attente', color: '#92400E', bg: '#FEF3C7' },
    confirmed: { label: 'Confirmé', color: '#065F46', bg: '#D1FAE5' },
    reminded: { label: 'Rappelé', color: '#1D4ED8', bg: '#DBEAFE' },
    completed: { label: 'Terminé', color: '#374151', bg: '#F3F4F6' },
    no_show: { label: 'Non présenté', color: '#991B1B', bg: '#FEE2E2' },
    cancelled_client: { label: 'Annulé (Vous)', color: '#991B1B', bg: '#FEE2E2' },
    cancelled_salon: { label: 'Annulé (Salon)', color: '#991B1B', bg: '#FEE2E2' },
};

export default function BookingsScreen({ navigation }: any) {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsLoggedIn(!!user);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session?.user);
        });
        return () => subscription.unsubscribe();
    }, []);

    const fetchBookings = async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('rendez_vous')
                .select(`
                    id,
                    date_rdv,
                    heure_rdv,
                    statut,
                    salons ( id, nom_salon, adresse ),
                    services ( nom_service, prix )
                `)
                .eq('client_id', user.id)
                .order('date_rdv', { ascending: false })
                .order('heure_rdv', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            Alert.alert('Erreur', 'Impossible de récupérer vos rendez-vous.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (isLoggedIn) {
                fetchBookings();
            } else {
                setLoading(false);
            }
        }, [isLoggedIn])
    );

    const cancelBooking = async (id: string) => {
        Alert.alert('Annuler le RDV', 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui, annuler',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase
                        .from('rendez_vous')
                        .update({ statut: 'cancelled_client' })
                        .eq('id', id);
                    if (error) {
                        Alert.alert('Erreur', "L'annulation a échoué.");
                    } else {
                        fetchBookings();
                    }
                }
            }
        ]);
    };

    const renderBooking = ({ item }: { item: any }) => {
        const cfg = STATUS_CONFIG[item.statut] || STATUS_CONFIG.pending;
        const salon = item.salons || {};
        const service = item.services || {};

        // Format de date simple
        const dateObj = new Date(item.date_rdv);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        const heure = item.heure_rdv ? item.heure_rdv.substring(0, 5) : '';

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.salonName}>{salon.nom_salon || 'Salon Inconnu'}</Text>
                        <Text style={styles.serviceName}>{service.nom_service || 'Service Inconnu'}</Text>
                        <View style={styles.dateRow}>
                            <Calendar size={13} color="#6B7280" />
                            <Text style={styles.dateText}>{formattedDate} à {heure}</Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={styles.prix}>{service.prix ? `${service.prix} TND` : '-'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>
                </View>
                
                {(item.statut === 'pending' || item.statut === 'confirmed' || item.statut === 'reminded') && (
                    <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelBooking(item.id)}>
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.detailBtn}
                            onPress={() => navigation.navigate('SalonDetail', { salonId: salon.id })}
                        >
                            <Text style={styles.detailBtnText}>Voir le salon</Text>
                            <ChevronRight size={14} color="#1152d4" />
                        </TouchableOpacity>
                    </View>
                )}
                {item.statut === 'completed' && salon.id && (
                    <TouchableOpacity 
                        style={styles.rebookBtn}
                        onPress={() => navigation.navigate('SalonDetail', { salonId: salon.id })}
                    >
                        <Text style={styles.rebookBtnText}>Reprendre RDV</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>RESERVY</Text>
                <Text style={styles.headerSub}>Mes Rendez-vous</Text>
            </View>

            {isLoggedIn === false ? (
                <View style={styles.emptyState}>
                    <User size={60} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>Vous n'êtes pas connecté</Text>
                    <Text style={[styles.emptySubtitle, { textAlign: 'center', marginBottom: 12, paddingHorizontal: 20 }]}>
                        Connectez-vous pour voir et gérer vos rendez-vous.
                    </Text>
                    <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Auth')}>
                        <Text style={styles.bookBtnText}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            ) : loading ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={<Text style={styles.pageTitle}>Mes Rendez-vous</Text>}
                    renderItem={renderBooking}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Calendar size={60} color="#E5E7EB" />
                            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
                            <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Search')}>
                                <Text style={styles.bookBtnText}>Réserver maintenant</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    headerSub: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
    pageTitle: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 16 },
    list: { padding: 20, paddingBottom: 40 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
    cardLeft: { flex: 1, marginRight: 12 },
    salonName: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 4 },
    serviceName: { fontSize: 14, color: '#374151', marginBottom: 8 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 13, color: '#6B7280' },
    cardRight: { alignItems: 'flex-end', gap: 8 },
    prix: { fontSize: 16, fontWeight: '800', color: '#111' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '700' },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    cancelBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailBtnText: { color: '#1152d4', fontSize: 13, fontWeight: '700' },
    rebookBtn: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', alignItems: 'center' },
    rebookBtnText: { color: '#111', fontSize: 14, fontWeight: '700' },
    loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12, marginTop: 40 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
    bookBtn: { backgroundColor: '#111', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
    bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

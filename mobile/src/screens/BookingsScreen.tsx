import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';

const MOCK_BOOKINGS = [
    { id: '1', salon: 'Élégance de Carthage', service: 'Coupe + Soin', date: '10 Mar 2026', heure: '14:30', statut: 'confirme', prix: '55 TND' },
    { id: '2', salon: 'Studio Belle', service: 'Manucure gel', date: '15 Mar 2026', heure: '10:00', statut: 'en_attente', prix: '35 TND' },
    { id: '3', salon: 'Élégance de Carthage', service: 'Coupe + Brushing', date: '20 Fév 2026', heure: '11:00', statut: 'termine', prix: '45 TND' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    confirme: { label: 'Confirmé', color: '#065F46', bg: '#D1FAE5' },
    en_attente: { label: 'En attente', color: '#92400E', bg: '#FEF3C7' },
    termine: { label: 'Terminé', color: '#374151', bg: '#F3F4F6' },
    annule: { label: 'Annulé', color: '#991B1B', bg: '#FEE2E2' },
};

export default function BookingsScreen({ navigation }: any) {
    const renderBooking = ({ item }: { item: typeof MOCK_BOOKINGS[0] }) => {
        const cfg = STATUS_CONFIG[item.statut] || STATUS_CONFIG.en_attente;
        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.salonName}>{item.salon}</Text>
                        <Text style={styles.serviceName}>{item.service}</Text>
                        <View style={styles.dateRow}>
                            <Calendar size={13} color="#6B7280" />
                            <Text style={styles.dateText}>{item.date} à {item.heure}</Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={styles.prix}>{item.prix}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>
                </View>
                {item.statut === 'confirme' && (
                    <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.detailBtn}>
                            <Text style={styles.detailBtnText}>Voir le salon</Text>
                            <ChevronRight size={14} color="#1152d4" />
                        </TouchableOpacity>
                    </View>
                )}
                {item.statut === 'termine' && (
                    <TouchableOpacity style={styles.rebookBtn}>
                        <Text style={styles.rebookBtnText}>Reprendre RDV</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>GLOWUP</Text>
            </View>
            <FlatList
                data={MOCK_BOOKINGS}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 16 },
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
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
    bookBtn: { backgroundColor: '#111', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
    bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Scissors, Clock } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ServicesListScreen({ navigation, route }: any) {
    const { salonId, salonName } = route.params || {};
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let query = supabase
            .from('services')
            .select('*, salons(id, nom_salon, adresse, horaires_ouverture)');
        if (salonId) {
            query = query.eq('salon_id', salonId) as any;
        }
        query.then(({ data, error }) => {
            if (!error) setServices(data || []);
            setLoading(false);
        });
    }, [salonId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#111" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.logo}>RESERVY</Text>
                <View style={{ width: 22 }} />
            </View>

            <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <>
                        <Text style={styles.pageTitle}>Nos Services</Text>
                        <Text style={styles.pageSubtitle}>Choisissez votre soin pour continuer</Text>
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('Booking', { service: item })}>
                        <View style={styles.iconBox}>
                            <Scissors size={22} color="#374151" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.serviceName}>{item.nom_service || item.nom}</Text>
                            <View style={styles.metaRow}>
                                <Clock size={12} color="#9CA3AF" />
                                <Text style={styles.metaText}>{item.duree_minutes} min</Text>
                                <Text style={styles.price}>{item.prix} TND</Text>
                            </View>
                            {item.salons && (
                                <Text style={styles.salonTag}>{item.salons.nom_salon}</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Aucun service disponible pour le moment.</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.promoBanner}>
                        <Text style={styles.promoLabel}>OFFRE BIENVENUE</Text>
                        <Text style={styles.promoText}>
                            Profitez de -10% sur votre première réservation aujourd'hui !
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    list: { padding: 20, paddingBottom: 40 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 4 },
    pageSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6', gap: 14 },
    iconBox: { width: 52, height: 52, backgroundColor: '#F3F4F6', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1 },
    serviceName: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: '#9CA3AF', flex: 1 },
    price: { fontSize: 14, fontWeight: '800', color: '#111' },
    salonTag: { fontSize: 12, color: '#1152d4', fontWeight: '600', marginTop: 4 },
    empty: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    emptyText: { color: '#9CA3AF', fontWeight: '700' },
    promoBanner: { backgroundColor: '#111', borderRadius: 20, padding: 24, marginTop: 16, alignItems: 'center' },
    promoLabel: { fontSize: 10, fontWeight: '900', color: '#1152d4', letterSpacing: 2, marginBottom: 8 },
    promoText: { fontSize: 14, color: '#F3F4F6', textAlign: 'center', fontStyle: 'italic' },
});

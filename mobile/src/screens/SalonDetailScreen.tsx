import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, Star, Clock, Heart, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const DAYS_FR: Record<string, string> = {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mer',
    thursday: 'Jeu',
    friday: 'Ven',
    saturday: 'Sam',
    sunday: 'Dim',
};

export default function SalonDetailScreen({ navigation, route }: any) {
    const { salon } = route.params;
    const [services, setServices] = useState<any[]>([]);
    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        supabase
            .from('services')
            .select('*')
            .eq('salon_id', salon.id)
            .then(({ data }) => setServices(data || []));
    }, []);

    const heroUri =
        salon.logo_url ||
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop';

    const horaires = salon.horaires_ouverture || {};

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero */}
                <View style={styles.heroWrapper}>
                    <Image source={{ uri: heroUri }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />

                    {/* Back + Fav */}
                    <SafeAreaView style={styles.heroTopBar}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                            <ArrowLeft size={22} color="#111" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconBtn, isFav && styles.iconBtnActive]}
                            onPress={() => setIsFav(!isFav)}>
                            <Heart size={20} color={isFav ? '#e11d48' : '#111'} fill={isFav ? '#e11d48' : 'none'} />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Rating badge on image */}
                    <View style={styles.ratingBadge}>
                        <Star size={13} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>4.9 • 128 avis</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Salon Name */}
                    <Text style={styles.salonName}>{salon.nom_salon}</Text>

                    <View style={styles.infoRow}>
                        <MapPin size={15} color="#6B7280" />
                        <Text style={styles.infoText}>{salon.adresse}</Text>
                    </View>

                    {salon.telephone && (
                        <View style={styles.infoRow}>
                            <Phone size={15} color="#6B7280" />
                            <Text style={styles.infoText}>{salon.telephone}</Text>
                        </View>
                    )}

                    {/* Services */}
                    {services.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nos services</Text>
                            {services.map((s: any) => (
                                <TouchableOpacity key={s.id} style={styles.serviceCard}>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{s.nom}</Text>
                                        {s.duree_minutes && (
                                            <View style={styles.durationRow}>
                                                <Clock size={12} color="#9CA3AF" />
                                                <Text style={styles.durationText}>{s.duree_minutes} min</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.serviceRight}>
                                        <Text style={styles.servicePrice}>{s.prix} TND</Text>
                                        <ChevronRight size={16} color="#9CA3AF" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Horaires */}
                    {Object.keys(horaires).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Horaires</Text>
                            <View style={styles.horaireGrid}>
                                {Object.entries(horaires).map(([day, h]: any) => (
                                    <View key={day} style={styles.horaireRow}>
                                        <Text style={styles.horaireDay}>{DAYS_FR[day] || day}</Text>
                                        <Text style={styles.horaireTime}>
                                            {h.isOpen === false || h.open === 'closed'
                                                ? 'Fermé'
                                                : `${h.open} – ${h.close_pm || h.close}`}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* CTA bottom */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => navigation.navigate('ServicesList', { salonId: salon.id, salonName: salon.nom_salon })}>
                    <Text style={styles.bookBtnText}>Prendre rendez-vous</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    // Hero
    heroWrapper: { width: width, height: 280, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
    heroTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    iconBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    iconBtnActive: { backgroundColor: '#FFF1F2' },
    ratingBadge: {
        position: 'absolute',
        bottom: 14,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        elevation: 2,
    },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#111' },

    // Content
    content: { padding: 20, paddingBottom: 100 },
    salonName: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    infoText: { fontSize: 14, color: '#6B7280', flex: 1 },

    // Section
    section: { marginTop: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 14 },

    // Service
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { fontSize: 12, color: '#9CA3AF' },
    serviceRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    servicePrice: { fontSize: 16, fontWeight: '800', color: '#111' },

    // Horaires
    horaireGrid: { gap: 8 },
    horaireRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    horaireDay: { fontSize: 14, fontWeight: '700', color: '#374151', width: 42 },
    horaireTime: { fontSize: 14, color: '#6B7280' },

    // CTA Bottom
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        elevation: 10,
    },
    bookBtn: {
        backgroundColor: '#111',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

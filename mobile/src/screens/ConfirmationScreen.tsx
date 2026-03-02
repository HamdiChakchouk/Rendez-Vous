import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Calendar, Clock, MapPin, User } from 'lucide-react-native';

export default function ConfirmationScreen({ navigation, route }: any) {
    const { phone, bookingData, serviceDetails } = route.params || {};

    const formattedDate = bookingData?.date
        ? new Date(bookingData.date).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        : 'Date inconnue';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Success Icon */}
                <View style={styles.iconWrapper}>
                    <View style={styles.iconCircle}>
                        <CheckCircle2 size={48} color="#10B981" />
                    </View>
                </View>

                <Text style={styles.title}>C'est confirmé !</Text>
                <Text style={styles.subtitle}>
                    Votre rendez-vous est enregistré.{'\n'}Vous recevrez un rappel 2h avant.
                </Text>

                {/* Details Card */}
                <View style={styles.card}>
                    <DetailRow
                        icon={<Calendar size={20} color="#1152d4" />}
                        label="Date & Heure"
                        value={`${formattedDate} à ${bookingData?.time || ''}`}
                    />
                    <View style={styles.separator} />
                    <DetailRow
                        icon={<User size={20} color="#1152d4" />}
                        label="Service & Coiffeur"
                        value={serviceDetails?.serviceName || ''}
                        sub={`avec ${serviceDetails?.employeeName || "N'importe qui"}`}
                    />
                    <View style={styles.separator} />
                    <DetailRow
                        icon={<MapPin size={20} color="#1152d4" />}
                        label="Lieu"
                        value={serviceDetails?.salonName || ''}
                        sub={serviceDetails?.address || ''}
                    />
                    {phone && (
                        <>
                            <View style={styles.separator} />
                            <DetailRow
                                icon={<User size={20} color="#1152d4" />}
                                label="Numéro confirmé"
                                value={phone}
                            />
                        </>
                    )}
                </View>

                {/* Actions */}
                <TouchableOpacity style={styles.addCalBtn}>
                    <Calendar size={18} color="#fff" />
                    <Text style={styles.addCalBtnText}>Ajouter au calendrier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeBtn}
                    onPress={() => navigation.navigate('MainTabs')}>
                    <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({ icon, label, value, sub }: any) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>{icon}</View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
                {sub && <Text style={styles.detailSub}>{sub}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    body: { padding: 24, alignItems: 'center', paddingBottom: 60 },
    iconWrapper: { marginVertical: 28 },
    iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    card: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: '#F3F4F6', gap: 16, marginBottom: 24 },
    detailRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    detailIcon: { width: 40, height: 40, backgroundColor: '#EEF2FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    detailValue: { fontSize: 15, fontWeight: '800', color: '#111' },
    detailSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    separator: { height: 1, backgroundColor: '#E5E7EB' },
    addCalBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111', paddingVertical: 16, borderRadius: 14, width: '100%', justifyContent: 'center', marginBottom: 12 },
    addCalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    homeBtn: { paddingVertical: 14, width: '100%', alignItems: 'center' },
    homeBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
});

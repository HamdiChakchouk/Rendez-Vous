import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, XCircle, Store, Users, MapPin, Phone, Building } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function AdminDashboardScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<'demandes' | 'salons'>('demandes');
    const [requests, setRequests] = useState<any[]>([]);
    const [salons, setSalons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch pending requests
            const { data: reqData, error: reqErr } = await supabase
                .from('subscription_requests')
                .select('*')
                .eq('statut', 'pending')
                .order('created_at', { ascending: false });

            if (!reqErr && reqData) setRequests(reqData);

            // Fetch active salons
            const { data: salonData, error: salonErr } = await supabase
                .from('salons')
                .select(`
                    *,
                    profiles ( nom, prenom, role, telephone )
                `)
                .order('created_at', { ascending: false });

            if (!salonErr && salonData) setSalons(salonData);

        } catch (error) {
            console.error('Admin fetch error', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(requestId: string) {
        Alert.alert('Accepter ce salon ?', "Une fois accepté, le salon sera créé et le gérant recevra un email d'activation.", [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Accepter', style: 'default', onPress: async () => {
                    setProcessing(requestId);
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/admin/approve-subscription`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session?.access_token}`
                            },
                            body: JSON.stringify({ request_id: requestId })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'acceptation');

                        Alert.alert('Succès', 'Le salon a été créé et le pro a été notifié !');
                        fetchData();
                    } catch (error: any) {
                        Alert.alert('Erreur', error.message);
                    } finally {
                        setProcessing(null);
                    }
                }
            }
        ]);
    }

    async function handleReject(requestId: string) {
        // Soft reject for now, we just update status to rejected locally
        Alert.alert('Refuser', "Êtes-vous sûr de vouloir refuser cette demande ?", [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Refuser', style: 'destructive', onPress: async () => {
                    setProcessing(requestId);
                    try {
                        const { error } = await supabase.from('subscription_requests')
                            .update({ statut: 'rejected' })
                            .eq('id', requestId);
                        if (error) throw error;
                        fetchData();
                        Alert.alert('Succès', 'Demande refusée.');
                    } catch (error: any) {
                        Alert.alert('Erreur', error.message);
                    } finally {
                        setProcessing(null);
                    }
                }
            }
        ]);
    }

    function showSalonDetails(salon: any) {
        const d = new Date(salon.created_at).toLocaleDateString('fr-FR');
        const manager = salon.profiles?.find((p: any) => p.role === 'manager');
        const managerInfo = manager
            ? `Nom: ${manager.prenom} ${manager.nom}\nTél : ${manager.telephone || 'Non renseigné'}`
            : 'Aucun manager assigné.';

        const message = `🏢 INFOS SALON\nNom : ${salon.nom_salon}\nAdresse : ${salon.adresse || 'Non renseignée'}\nTél : ${salon.telephone || 'Non renseigné'}\nInscrit le : ${d}\n\n👤 MANAGER\n${managerInfo}`;
        
        Alert.alert('Détails du Salon', message);
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.title}>Tour de Contrôle Admin</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Metrics */}
            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{requests.length}</Text>
                    <Text style={styles.metricLabel}>En attente</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{salons.length}</Text>
                    <Text style={styles.metricLabel}>Salons Actifs</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'demandes' && styles.tabActive]}
                    onPress={() => setActiveTab('demandes')}
                >
                    <Text style={[styles.tabText, activeTab === 'demandes' && styles.tabTextActive]}>Demandes</Text>
                    {requests.length > 0 && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{requests.length}</Text></View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'salons' && styles.tabActive]}
                    onPress={() => setActiveTab('salons')}
                >
                    <Text style={[styles.tabText, activeTab === 'salons' && styles.tabTextActive]}>Salons Actifs</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#111" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {activeTab === 'demandes' && (
                            <View style={styles.list}>
                                {requests.length === 0 ? (
                                    <Text style={styles.emptyText}>Aucune nouvelle demande.</Text>
                                ) : (
                                    requests.map(req => (
                                        <View key={req.id} style={styles.card}>
                                            <View style={styles.cardHeader}>
                                                <Text style={styles.salonName}>{req.nom_salon}</Text>
                                                <View style={styles.typeBadge}>
                                                    <Text style={styles.typeBadgeText}>{req.type_salon.replace('_', ' ')}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.infoRow}>
                                                <Users size={14} color="#6B7280" />
                                                <Text style={styles.infoText}>{req.nom_prenom}</Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <Phone size={14} color="#6B7280" />
                                                <Text style={styles.infoText}>{req.telephone} • {req.email}</Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <MapPin size={14} color="#6B7280" />
                                                <Text style={styles.infoText}>{req.ville}</Text>
                                            </View>

                                            {req.message && (
                                                <View style={styles.messageBox}>
                                                    <Text style={styles.messageText}>"{req.message}"</Text>
                                                </View>
                                            )}

                                            <View style={styles.actionsBox}>
                                                <TouchableOpacity
                                                    style={styles.rejectBtn}
                                                    onPress={() => handleReject(req.id)}
                                                    disabled={processing !== null}
                                                >
                                                    <XCircle size={18} color="#EF4444" />
                                                    <Text style={styles.rejectBtnText}>Refuser</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.approveBtn}
                                                    onPress={() => handleApprove(req.id)}
                                                    disabled={processing !== null}
                                                >
                                                    {processing === req.id ? (
                                                        <ActivityIndicator size="small" color="#fff" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={18} color="#fff" />
                                                            <Text style={styles.approveBtnText}>Accepter</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {activeTab === 'salons' && (
                            <View style={styles.list}>
                                {salons.length === 0 ? (
                                    <Text style={styles.emptyText}>Aucun salon actif trouvé.</Text>
                                ) : (
                                    salons.map(salon => (
                                        <TouchableOpacity 
                                            key={salon.id} 
                                            style={styles.card}
                                            onPress={() => showSalonDetails(salon)}
                                        >
                                            <View style={styles.cardHeader}>
                                                <Text style={styles.salonName}>{salon.nom_salon}</Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <Building size={14} color="#6B7280" />
                                                <Text style={styles.infoText}>Inscrit le {new Date(salon.created_at).toLocaleDateString('fr-FR')}</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#2563EB', marginTop: 10, fontWeight: '600' }}>
                                                Voir les informations complètes &rarr;
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 18, fontWeight: '800', color: '#111' },
    backBtn: { padding: 4 },
    metricsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    metricCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderColor: '#F3F4F6', borderWidth: 1 },
    metricValue: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 4 },
    metricLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    tabs: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 10, gap: 10 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    tabActive: { backgroundColor: '#111', borderColor: '#111' },
    tabText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    tabTextActive: { color: '#fff' },
    badge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    list: { gap: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    salonName: { fontSize: 18, fontWeight: '800', color: '#111', flex: 1 },
    typeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    infoText: { fontSize: 14, color: '#4B5563' },
    messageBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginTop: 8, marginBottom: 16 },
    messageText: { fontStyle: 'italic', color: '#6B7280', fontSize: 13 },
    actionsBox: { flexDirection: 'row', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#FEF2F2' },
    rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#10B981' },
    approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 15 }
});

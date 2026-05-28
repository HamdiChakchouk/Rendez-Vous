import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, TextInput, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Calendar, Plus, CheckCircle, XCircle, LogOut,
    Settings, CalendarOff, Clock, User, Phone, ChevronRight,
    TrendingUp, RefreshCw,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

const STATUT_COLORS: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    completed: '#6366F1',
    cancelled_salon: '#EF4444',
    cancelled_client: '#EF4444',
    no_show: '#9CA3AF',
};

const STATUT_LABELS: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    completed: 'Terminé',
    cancelled_salon: 'Annulé',
    cancelled_client: 'Annulé',
    no_show: 'No-show',
};

export default function SalonDashboardScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [salonName, setSalonName] = useState('Mon Salon');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [employeId, setEmployeId] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [stats, setStats] = useState({ rdv: 0, ca: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newApt, setNewApt] = useState({ nom_client: '', telephone: '', service_id: '', employe_id: '', date: new Date() });
    const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);
    const [filterEmployeId, setFilterEmployeId] = useState<string | null>(null);
    const [period, setPeriod] = useState<'today' | 'tomorrow' | 'week' | 'month'>('today');

    useEffect(() => { loadData(); }, [period, filterEmployeId]);

    async function loadData(silent = false) {
        if (!silent) setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('salon_id, role').eq('id', user.id).maybeSingle();
            if (!profile?.salon_id) { setLoading(false); return; }
            setUserRole(profile.role ?? null);

            const sid = profile.salon_id;
            const role = profile.role ?? null;
            setSalonId(sid);
            setUserRole(role);

            // Pour un coiffeur, trouver son employe_id lié
            let linkedEmployeId: string | null = null;
            if (role === 'coiffeur') {
                const { data: emp } = await supabase
                    .from('employes')
                    .select('id')
                    .eq('salon_id', sid)
                    .eq('profile_id', user.id)
                    .maybeSingle();
                linkedEmployeId = emp?.id ?? null;
                setEmployeId(linkedEmployeId);
            }

            const [salonRes, svcsRes, empsRes] = await Promise.all([
                supabase.from('salons').select('nom_salon').eq('id', sid).single(),
                supabase.from('services').select('id, nom_service, prix').eq('salon_id', sid).order('nom_service'),
                supabase.from('employes').select('id, nom_employe').eq('salon_id', sid).order('nom_employe'),
            ]);

            if (salonRes.data) setSalonName(salonRes.data.nom_salon);
            if (svcsRes.data) setServices(svcsRes.data);
            if (empsRes.data) setEmployees(empsRes.data);

            const todayObj = new Date();
            const todayStr = todayObj.toISOString().split('T')[0];
            let startDateStr = todayStr;
            let endDateStr = todayStr;

            if (period === 'tomorrow') {
                const tomorrow = new Date(todayObj);
                tomorrow.setDate(todayObj.getDate() + 1);
                startDateStr = tomorrow.toISOString().split('T')[0];
                endDateStr = startDateStr;
            } else if (period === 'week') {
                const nextWeek = new Date(todayObj);
                nextWeek.setDate(todayObj.getDate() + 7);
                endDateStr = nextWeek.toISOString().split('T')[0];
            } else if (period === 'month') {
                const nextMonth = new Date(todayObj);
                nextMonth.setMonth(todayObj.getMonth() + 1);
                endDateStr = nextMonth.toISOString().split('T')[0];
            }

            // Construire la requête RDV selon le rôle
            let aptsQuery = supabase
                .from('rendez_vous')
                .select('*, client:clients(nom_client, telephone), service:services(nom_service, prix), employe:employes(nom_employe)')
                .eq('salon_id', sid)
                .gte('date_rdv', startDateStr)
                .lte('date_rdv', endDateStr)
                .order('date_rdv')
                .order('heure_rdv');

            // Le coiffeur ne voit que ses propres RDV
            if (role === 'coiffeur' && linkedEmployeId) {
                aptsQuery = aptsQuery.eq('employe_id', linkedEmployeId);
            } else if (role !== 'coiffeur' && filterEmployeId) {
                aptsQuery = aptsQuery.eq('employe_id', filterEmployeId);
            }

            const { data: apts } = await aptsQuery;

            if (apts) {
                setAppointments(apts);
                // Les stats (CA, total) ne sont calculées que pour les managers
                if (role !== 'coiffeur') {
                    const ca = apts.filter(a => !a.statut.startsWith('cancelled') && a.statut !== 'no_show')
                        .reduce((s, a) => s + Number(a.service?.prix || 0), 0);
                    setStats({ rdv: apts.length, ca });
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }

    async function confirmApt(id: string) {
        await supabase.from('rendez_vous').update({ statut: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', id);
        loadData(true);
    }

    async function cancelApt(id: string) {
        Alert.alert('Annuler', 'Annuler ce rendez-vous ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui', style: 'destructive', onPress: async () => {
                    await supabase.from('rendez_vous').update({ statut: 'cancelled_salon' }).eq('id', id);
                    loadData(true);
                }
            },
        ]);
    }

    const handleLogout = async () => {
        Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui', style: 'destructive', onPress: async () => {
                    await supabase.auth.signOut();
                }
            }
        ]);
    };

    async function handleAddApt() {
        if (!salonId || !newApt.nom_client || !newApt.telephone || !newApt.service_id) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires'); return;
        }
        setSaving(true);
        try {
            // Trouver ou créer le client
            let clientId: string;
            const { data: existingClient } = await supabase.from('clients').select('id').eq('telephone', newApt.telephone).maybeSingle();
            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const { data: newClient, error } = await supabase.from('clients').insert({ telephone: newApt.telephone, nom_client: newApt.nom_client }).select().single();
                if (error) throw error;
                clientId = newClient.id;
            }

            const Y = newApt.date.getFullYear();
            const M = (newApt.date.getMonth() + 1).toString().padStart(2, '0');
            const D = newApt.date.getDate().toString().padStart(2, '0');
            const dateStr = `${Y}-${M}-${D}`;
            
            const h = newApt.date.getHours().toString().padStart(2, '0');
            const m = newApt.date.getMinutes().toString().padStart(2, '0');
            const timeStr = `${h}:${m}:00`;

            const targetEmployeId = userRole === 'coiffeur' ? employeId : (newApt.employe_id || null);

            const { error } = await supabase.from('rendez_vous').insert({
                salon_id: salonId, client_id: clientId,
                service_id: newApt.service_id, employe_id: targetEmployeId,
                date_rdv: dateStr, heure_rdv: timeStr, statut: 'confirmed',
            });
            if (error) throw error;

            setShowAddModal(false);
            setNewApt({ nom_client: '', telephone: '', service_id: '', employe_id: '', date: new Date() });
            loadData(true);
        } catch (e: any) {
            Alert.alert('Erreur', e.message || 'Impossible d\'ajouter le RDV');
        } finally { setSaving(false); }
    }

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#111" style={{ flex: 1 }} />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.salonName}>{salonName}</Text>
                    <Text style={styles.headerSub}>
                        {userRole === 'coiffeur' ? 'Espace Collaborateur' : (userRole === 'manager' || userRole === 'super_admin') ? 'Dashboard Manager' : ''}
                    </Text>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
                    <User size={22} color="#111" />
                </TouchableOpacity>
            </View>

            {/* Stats Row — managers uniquement */}
            {(userRole === 'manager' || userRole === 'super_admin') && (
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Calendar size={18} color="#1152d4" />
                        <Text style={styles.statValue}>{stats.rdv}</Text>
                        <Text style={styles.statLabel}>RDV ({period === 'today' ? 'Aujourd\'hui' : period === 'tomorrow' ? 'Demain' : period === 'week' ? '7 Jours' : 'Ce Mois'})</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: '#D1FAE5' }]}>
                        <TrendingUp size={18} color="#10B981" />
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.ca} DT</Text>
                        <Text style={styles.statLabel}>CA ({period === 'today' ? 'Jour' : period === 'tomorrow' ? 'Demain' : period === 'week' ? '7 Jours' : 'Ce Mois'})</Text>
                    </View>
                </View>
            )}

            {/* Period Filters */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {(['today', 'tomorrow', 'week', 'month'] as const).map(p => (
                        <TouchableOpacity 
                            key={p} 
                            onPress={() => setPeriod(p)}
                            style={[styles.periodChip, period === p && styles.periodChipActive]}
                        >
                            <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>
                                {p === 'today' ? 'Aujourd\'hui' : p === 'tomorrow' ? 'Demain' : p === 'week' ? '7 Jours' : 'Ce Mois'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Employee Filters (Manager/Admin only) */}
            {userRole !== 'coiffeur' && employees.length > 0 && (
                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        <TouchableOpacity 
                            onPress={() => setFilterEmployeId(null)}
                            style={[styles.periodChip, filterEmployeId === null && styles.periodChipActive]}
                        >
                            <Text style={[styles.periodChipText, filterEmployeId === null && styles.periodChipTextActive]}>
                                Tous les coiffeurs
                            </Text>
                        </TouchableOpacity>
                        {employees.map(emp => (
                            <TouchableOpacity 
                                key={emp.id} 
                                onPress={() => setFilterEmployeId(emp.id)}
                                style={[styles.periodChip, filterEmployeId === emp.id && styles.periodChipActive]}
                            >
                                <Text style={[styles.periodChipText, filterEmployeId === emp.id && styles.periodChipTextActive]}>
                                    {emp.nom_employe}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Appointments */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {period === 'today' ? 'Rendez-vous du jour' : period === 'tomorrow' ? 'Rendez-vous de demain' : period === 'week' ? 'Les 7 prochains jours' : 'Mois en cours'}
                </Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addBtnText}>Nouveau</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={appointments}
                keyExtractor={i => i.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Calendar size={40} color="#E5E7EB" />
                        <Text style={styles.emptyText}>Aucun rendez-vous sur cette période</Text>
                        <TouchableOpacity style={styles.addBtnOutline} onPress={() => setShowAddModal(true)}>
                            <Text style={styles.addBtnOutlineText}>+ Ajouter un RDV</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item: apt }) => (
                    <View style={styles.aptCard}>
                        <View style={styles.aptTime}>
                            {period === 'week' || period === 'month' ? (
                                <>
                                    <Text style={[styles.aptTimeText, { fontSize: 11, color: '#6B7280' }]}>{apt.date_rdv?.substring(5, 10).replace('-', '/')}</Text>
                                    <Text style={[styles.aptTimeText, { fontSize: 13 }]}>{apt.heure_rdv?.substring(0, 5)}</Text>
                                </>
                            ) : (
                                <Text style={styles.aptTimeText}>{apt.heure_rdv?.substring(0, 5)}</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.aptClient}>{apt.client?.nom_client || 'Client Anonyme'}</Text>
                            <Text style={styles.aptDetails}>{apt.service?.nom_service} • {apt.employe?.nom_employe || 'Non assigné'}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: (STATUT_COLORS[apt.statut] || '#9CA3AF') + '20' }]}>
                                <Text style={[styles.statusText, { color: STATUT_COLORS[apt.statut] || '#9CA3AF' }]}>
                                    {STATUT_LABELS[apt.statut] || apt.statut}
                                </Text>
                            </View>
                        </View>
                        {(apt.statut === 'pending' || apt.statut === 'confirmed') && (
                            <View style={{ gap: 8 }}>
                                {apt.statut === 'pending' && (
                                    <TouchableOpacity onPress={() => confirmApt(apt.id)} style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]}>
                                        <CheckCircle size={18} color="#059669" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => cancelApt(apt.id)} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
                                    <XCircle size={18} color="#DC2626" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            />

            {/* Quick Add Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nouveau Rendez-vous</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <XCircle size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>Client *</Text>
                                <TextInput style={styles.input} placeholder="Nom du client" value={newApt.nom_client} onChangeText={v => setNewApt({ ...newApt, nom_client: v })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>Téléphone *</Text>
                                <TextInput style={styles.input} placeholder="+216..." keyboardType="phone-pad" value={newApt.telephone} onChangeText={v => setNewApt({ ...newApt, telephone: v })} />
                            </View>
                        </View>

                        <Text style={styles.fieldLabel}>Service * </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            {services.map(s => (
                                <TouchableOpacity key={s.id} onPress={() => setNewApt({ ...newApt, service_id: s.id })}
                                    style={[styles.chip, newApt.service_id === s.id && styles.chipActive]}>
                                    <Text style={[styles.chipText, newApt.service_id === s.id && { color: '#fff' }]}>{s.nom_service} — {s.prix} DT</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {userRole !== 'coiffeur' && (
                            <>
                                <Text style={styles.fieldLabel}>Employé (optionnel)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                    <TouchableOpacity onPress={() => setNewApt({ ...newApt, employe_id: '' })}
                                        style={[styles.chip, !newApt.employe_id && styles.chipActive]}>
                                        <Text style={[styles.chipText, !newApt.employe_id && { color: '#fff' }]}>N'importe qui</Text>
                                    </TouchableOpacity>
                                    {employees.map(e => (
                                        <TouchableOpacity key={e.id} onPress={() => setNewApt({ ...newApt, employe_id: e.id })}
                                            style={[styles.chip, newApt.employe_id === e.id && styles.chipActive]}>
                                            <Text style={[styles.chipText, newApt.employe_id === e.id && { color: '#fff' }]}>{e.nom_employe}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <Text style={styles.fieldLabel}>Date et Heure du rendez-vous *</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                            <TouchableOpacity style={[styles.input, { flex: 1, alignItems: 'center' }]} onPress={() => setShowPicker('date')}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111' }}>
                                    {newApt.date.toLocaleDateString('fr-FR')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.input, { flex: 1, alignItems: 'center' }]} onPress={() => setShowPicker('time')}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111' }}>
                                    {newApt.date.getHours().toString().padStart(2, '0')}:{newApt.date.getMinutes().toString().padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {showPicker && (
                            <DateTimePicker
                                value={newApt.date}
                                mode={showPicker}
                                is24Hour={true}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowPicker(null);
                                    if (selectedDate) setNewApt({ ...newApt, date: selectedDate });
                                }}
                            />
                        )}

                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAddApt} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Bloquer le créneau</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    salonName: { fontSize: 16, fontWeight: '900', color: '#111' },
    headerSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    iconBtn: { width: 38, height: 38, backgroundColor: '#F3F4F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    statsRow: { flexDirection: 'row', gap: 12, padding: 20 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#EEF2FF' },
    statValue: { fontSize: 22, fontWeight: '900', color: '#1152d4' },
    statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    addBtnOutline: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#111' },
    addBtnOutlineText: { fontSize: 14, fontWeight: '700', color: '#111' },
    periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
    periodChipActive: { backgroundColor: '#111', borderColor: '#111' },
    periodChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    periodChipTextActive: { color: '#fff' },
    emptyBox: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed' },
    emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 12 },
    aptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    aptTime: { width: 56, height: 56, backgroundColor: '#F9FAFB', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    aptTimeText: { fontSize: 14, fontWeight: '900', color: '#111' },
    aptClient: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 2 },
    aptDetails: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
    chipActive: { backgroundColor: '#111', borderColor: '#111' },
    chipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
    saveBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 32 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

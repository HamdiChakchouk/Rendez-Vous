import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Save, Users, X, UserPlus, Mail } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

// Use the env variable for the API URL
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/manager/create-coiffeur`; 

export default function SalonSettingsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    
    const [showEmpModal, setShowEmpModal] = useState(false);
    const [empType, setEmpType] = useState<'simple' | 'access'>('simple');
    const [newEmpForm, setNewEmpForm] = useState({ nom: '', prenom: '', email: '', telephone: '' });
    const [savingEmp, setSavingEmp] = useState(false);

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from('profiles').select('salon_id').eq('id', user.id).maybeSingle();
            if (!profile?.salon_id) { setLoading(false); return; }
            const sid = profile.salon_id;
            setSalonId(sid);
            
            const { data: empsRes } = await supabase.from('employes').select('*').eq('salon_id', sid).order('nom_employe');
            if (empsRes) setEmployees(empsRes);
        } catch (e) {
             console.error(e); 
        } finally { 
            setLoading(false); 
        }
    }

    async function addEmployee() {
        if (!salonId || !newEmpForm.nom.trim() || !newEmpForm.prenom.trim()) { 
            Alert.alert('Erreur', 'Veuillez saisir le prénom et le nom'); 
            return; 
        }
        
        if (empType === 'access' && (!newEmpForm.email.trim() || !newEmpForm.email.includes('@'))) {
            Alert.alert('Erreur', 'Email valide obligatoire pour donner l\'accès'); 
            return;
        }

        setSavingEmp(true);
        try {
            if (empType === 'simple') {
                // Simple DB insertion
                const nom_complet = `${newEmpForm.prenom.trim()} ${newEmpForm.nom.trim()}`;
                const { error } = await supabase.from('employes').insert({ 
                    salon_id: salonId, 
                    nom_employe: nom_complet 
                });
                if (error) throw error;
                Alert.alert('Succès', 'Collaborateur ajouté au planning !');
            } else {
                // Call NextJS API for proper creation and invite
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) throw new Error('Token manquant');
                
                // Si on est en dev local on pourait utiliser le réseau local. On garde l'URL de prod pour l'instant.
                // Replace strictly with your active backend domain if needed.
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        nom: newEmpForm.nom.trim(),
                        prenom: newEmpForm.prenom.trim(),
                        email: newEmpForm.email.trim(),
                        telephone: newEmpForm.telephone.trim()
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Erreur API inconnue');
                }
                Alert.alert('Succès', data.message || 'Invitation envoyée avec succès !');
            }

            setShowEmpModal(false);
            setNewEmpForm({ nom: '', prenom: '', email: '', telephone: '' });
            fetchData();
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Une erreur est survenue');
        } finally {
            setSavingEmp(false);
        }
    }

    async function deleteEmployee(id: string) {
        Alert.alert('Retirer', 'Êtes-vous sûr de vouloir retirer ce collaborateur ? S\'il a accès à l\'application, son compte sera définitivement désactivé.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    setLoading(true);
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) throw new Error('Token manquant');
                        
                        const delUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/manager/delete-coiffeur`;
                        const res = await fetch(delUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ employe_id: id })
                        });
                        
                        const data = await res.json();
                        if (!res.ok) {
                            throw new Error(data.error || 'Erreur lors de la suppression');
                        }
                        
                        Alert.alert('Succès', data.message || 'Collaborateur retiré avec succès');
                    } catch (error: any) {
                        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
                    } finally {
                        fetchData();
                    }
                }
            },
        ]);
    }

    if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#111" style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color="#111" /></TouchableOpacity>
                <Text style={s.title}>Gestion de l'Équipe</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }}>
                {/* Employés */}
                <View style={[s.section, { paddingBottom: 24 }]}>
                    <View style={s.secHead}>
                        <Users size={16} color="#10B981" />
                        <Text style={s.secTitle}>Votre Personnel</Text>
                        <TouchableOpacity style={s.addCircle} onPress={() => setShowEmpModal(true)}>
                            <Plus size={16} color="#10B981" />
                        </TouchableOpacity>
                    </View>
                    <Text style={s.hint}>Gérez qui apparaît sur votre planning et qui a accès à l'application.</Text>
                    
                    {employees.length === 0 && <Text style={s.emptyTxt}>Aucun collaborateur pour le moment</Text>}
                    <View style={s.empGrid}>
                        {employees.map(emp => (
                            <View key={emp.id} style={s.empCard}>
                                <View style={[s.empIconWrap, emp.user_id && { backgroundColor: '#D1FAE5' }]}>
                                    <Text style={[s.empInitial, emp.user_id && { color: '#059669' }]}>
                                        {emp.nom_employe ? emp.nom_employe[0].toUpperCase() : '?'}
                                    </Text>
                                    {emp.user_id && (
                                        <View style={s.accessBadge}>
                                            <Mail size={8} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <Text style={s.empName}>{emp.nom_employe}</Text>
                                <Text style={s.empSub}>{emp.user_id ? 'Appli activée' : 'Planning seul'}</Text>
                                <TouchableOpacity style={s.empDel} onPress={() => deleteEmployee(emp.id)}>
                                    <X size={11} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Modal Ajoutez un Employé */}
            <Modal visible={showEmpModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEmpModal(false)}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHead}>
                        <Text style={s.modalTitle}>Nouveau Collaborateur</Text>
                        <TouchableOpacity onPress={() => setShowEmpModal(false)}><X size={22} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    
                    <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                        
                        <View style={s.tabs}>
                            <TouchableOpacity onPress={() => setEmpType('simple')} style={[s.tab, empType === 'simple' && s.tabActive]}>
                                <UserPlus size={16} color={empType === 'simple' ? "#111" : "#6B7280"} />
                                <Text style={[s.tabTxt, empType === 'simple' && s.tabTxtActive]}>Collaborateur Simple</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEmpType('access')} style={[s.tab, empType === 'access' && s.tabActive]}>
                                <Mail size={16} color={empType === 'access' ? "#111" : "#6B7280"} />
                                <Text style={[s.tabTxt, empType === 'access' && s.tabTxtActive]}>Avec Accès Appli</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={s.descTxt}>
                            {empType === 'simple' 
                                ? "Création locale. Le collaborateur s'affichera dans l'application ou l'agenda, mais ne pourra pas se connecter lui-même."
                                : "Un compte sécurisé sera créé pour lui et une invitation sera envoyée par e-mail afin qu'il puisse se connecter à Reservy."}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Prénom *</Text>
                                <TextInput style={s.input} placeholder="Ex: Amine" value={newEmpForm.prenom} onChangeText={v => setNewEmpForm({ ...newEmpForm, prenom: v })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Nom *</Text>
                                <TextInput style={s.input} placeholder="Ex: Benz" value={newEmpForm.nom} onChangeText={v => setNewEmpForm({ ...newEmpForm, nom: v })} />
                            </View>
                        </View>

                        {empType === 'access' && (
                            <>
                                <Text style={s.fieldLabel}>Adresse Email *</Text>
                                <TextInput style={s.input} placeholder="aminebenz@email.com" keyboardType="email-address" autoCapitalize="none" 
                                    value={newEmpForm.email} onChangeText={v => setNewEmpForm({ ...newEmpForm, email: v })} />
                                    
                                <Text style={s.fieldLabel}>Téléphone (Optionnel)</Text>
                                <TextInput style={s.input} placeholder="+216 -- --- ---" keyboardType="phone-pad"
                                    value={newEmpForm.telephone} onChangeText={v => setNewEmpForm({ ...newEmpForm, telephone: v })} />
                            </>
                        )}
                        
                        <TouchableOpacity style={[s.actionBtn, savingEmp && { opacity: 0.6 }]} onPress={addEmployee} disabled={savingEmp}>
                            {savingEmp ? <ActivityIndicator color="#fff" /> : <Text style={s.actionBtnTxt}>Créer et Ajouter</Text>}
                        </TouchableOpacity>
                        
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 18, fontWeight: '900', color: '#111', flex: 1 },
    section: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    secTitle: { fontSize: 16, fontWeight: '900', color: '#111', flex: 1 },
    hint: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
    addCircle: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
    emptyTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
    empGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    empCard: { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F3F4F6' },
    empIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    empInitial: { fontSize: 20, fontWeight: '900', color: '#1D4ED8' },
    accessBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#10B981', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    empName: { fontSize: 13, fontWeight: '800', color: '#111', textAlign: 'center' },
    empSub: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
    empDel: { position: 'absolute', top: 6, right: 6, padding: 6 },
    
    modal: { flex: 1, backgroundColor: '#fff' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 12 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    tabTxt: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    tabTxtActive: { color: '#111' },
    descTxt: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginBottom: 20, lineHeight: 18 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 16 },
    actionBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12, marginBottom: 32 },
    actionBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

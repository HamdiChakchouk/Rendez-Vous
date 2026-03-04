import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar, Users, BarChart3, Clock, Shield, Globe,
    ArrowRight, Check, ChevronRight, Star, Scissors,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const FEATURES = [
    { icon: Calendar, title: 'Agenda temps réel', desc: 'Gérez vos RDV sur mobile et web.', color: '#6366F1' },
    { icon: Users, title: 'Gestion équipe', desc: 'Créez les comptes de vos coiffeurs.', color: '#10B981' },
    { icon: BarChart3, title: 'Stats & CA', desc: 'Chiffre d\'affaires et KPIs en temps réel.', color: '#F59E0B' },
    { icon: Clock, title: 'Congés & Absences', desc: 'Validez les demandes de congés.', color: '#EC4899' },
    { icon: Shield, title: 'Zéro no-show', desc: 'Confirmations SMS et clients à risque.', color: '#3B82F6' },
    { icon: Globe, title: 'Visibilité en ligne', desc: 'Référencé sur Reservy pour attirer des clients.', color: '#8B5CF6' },
];

const PERKS = ['Aucun frais de démarrage', 'Accès mobile inclus', 'Support dédié', 'Mise en ligne rapide'];

export default function ProLandingScreen({ navigation }: any) {
    const [checking, setChecking] = useState(false);

    async function handleCTA() {
        setChecking(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Déjà connecté → aller directement au formulaire
                navigation.navigate('SubscriptionRequest', { email: user.email });
            } else {
                // Pas connecté → aller au formulaire (il pourra se connecter ou continuer sans compte)
                navigation.navigate('SubscriptionRequest', { email: '' });
            }
        } catch {
            navigation.navigate('SubscriptionRequest', { email: '' });
        } finally {
            setChecking(false);
        }
    }

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* ── Hero ─────────────────────────────────────────────── */}
                <LinearGradient colors={['#0F172A', '#1E1B4B', '#0F172A']} style={s.hero}>
                    <SafeAreaView>
                        {/* Nav */}
                        <View style={s.nav}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBack}>
                                <Text style={s.navBackTxt}>← Accueil</Text>
                            </TouchableOpacity>
                            <View style={s.navBadge}>
                                <Scissors size={12} color="#A78BFA" />
                                <Text style={s.navBadgeTxt}>PRO</Text>
                            </View>
                        </View>

                        <View style={s.heroContent}>
                            <View style={s.heroBadge}>
                                <Text style={s.heroBadgeTxt}>✨ Réservé aux professionnels</Text>
                            </View>

                            <Text style={s.heroTitle}>
                                Gérez votre{'\n'}
                                <Text style={s.heroTitleAccent}>salon comme{'\n'}un pro</Text>
                            </Text>

                            <Text style={s.heroSub}>
                                La plateforme tout-en-un pour les salons de coiffure et instituts de beauté en Tunisie.
                            </Text>

                            {/* Perks */}
                            <View style={s.perks}>
                                {PERKS.map(p => (
                                    <View key={p} style={s.perk}>
                                        <Check size={13} color="#34D399" />
                                        <Text style={s.perkTxt}>{p}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* CTA Button */}
                            <TouchableOpacity style={s.ctaBtn} onPress={handleCTA} disabled={checking} activeOpacity={0.9}>
                                <Text style={s.ctaBtnTxt}>{checking ? 'Chargement...' : 'Rejoindre Reservy'}</Text>
                                <ArrowRight size={20} color="#111" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* ── Features ─────────────────────────────────────────── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Tout ce dont vous avez besoin</Text>
                    <Text style={s.sectionSub}>Une suite complète pensée pour les professionnels tunisiens.</Text>
                    <View style={s.featGrid}>
                        {FEATURES.map(f => (
                            <View key={f.title} style={s.featCard}>
                                <View style={[s.featIcon, { backgroundColor: f.color + '20' }]}>
                                    <f.icon size={20} color={f.color} />
                                </View>
                                <Text style={s.featTitle}>{f.title}</Text>
                                <Text style={s.featDesc}>{f.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Testimonials ─────────────────────────────────────── */}
                <View style={[s.section, { backgroundColor: '#F9FAFB' }]}>
                    <Text style={s.sectionTitle}>Ils nous font confiance</Text>
                    {[
                        { name: 'Haifa B.', role: 'Salon Élégance Carthage', text: 'Mes réservations ont augmenté de 40% depuis Reservy.' },
                        { name: 'Mehdi T.', role: 'Barbershop La Marsa', text: 'Mes coiffeurs gèrent leurs plannings eux-mêmes via l\'app.' },
                    ].map(t => (
                        <View key={t.name} style={s.testimonial}>
                            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" />)}
                            </View>
                            <Text style={s.testimonialText}>"{t.text}"</Text>
                            <View style={{ marginTop: 12 }}>
                                <Text style={s.testimonialName}>{t.name}</Text>
                                <Text style={s.testimonialRole}>{t.role}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Final CTA ────────────────────────────────────────── */}
                <LinearGradient colors={['#0F172A', '#1E1B4B']} style={s.finalCta}>
                    <Text style={s.finalCtaTitle}>Prêt à rejoindre Reservy ?</Text>
                    <Text style={s.finalCtaSub}>Notre équipe valide votre accès dans les 24h.</Text>
                    <TouchableOpacity style={s.ctaBtn} onPress={handleCTA} disabled={checking} activeOpacity={0.9}>
                        <Text style={s.ctaBtnTxt}>Envoyer ma demande</Text>
                        <ArrowRight size={20} color="#111" />
                    </TouchableOpacity>
                </LinearGradient>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    hero: { paddingBottom: 40 },
    nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
    navBack: { paddingVertical: 8 },
    navBackTxt: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    navBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(167,139,250,0.15)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    navBadgeTxt: { color: '#A78BFA', fontSize: 12, fontWeight: '800' },
    heroContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
    heroBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 20 },
    heroBadgeTxt: { color: '#CBD5E1', fontSize: 12, fontWeight: '600' },
    heroTitle: { fontSize: 40, fontWeight: '900', color: '#fff', lineHeight: 44, marginBottom: 16, letterSpacing: -1 },
    heroTitleAccent: { color: '#A78BFA' },
    heroSub: { color: '#94A3B8', fontSize: 15, lineHeight: 22, marginBottom: 24 },
    perks: { gap: 8, marginBottom: 32 },
    perk: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    perkTxt: { color: '#CBD5E1', fontSize: 13, fontWeight: '500' },
    ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 28, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
    ctaBtnTxt: { fontSize: 17, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
    section: { padding: 24, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5, marginBottom: 8 },
    sectionSub: { color: '#6B7280', fontSize: 14, marginBottom: 20 },
    featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    featCard: { width: (width - 60) / 2, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    featIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    featTitle: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 4 },
    featDesc: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
    testimonial: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    testimonialText: { color: '#374151', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
    testimonialName: { fontSize: 13, fontWeight: '800', color: '#111' },
    testimonialRole: { fontSize: 11, color: '#9CA3AF' },
    finalCta: { padding: 32, paddingBottom: 48, alignItems: 'center', gap: 12 },
    finalCtaTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
    finalCtaSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 8 },
});

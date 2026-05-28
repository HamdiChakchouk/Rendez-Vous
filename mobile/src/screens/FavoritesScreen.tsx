import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MapPin, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen({ navigation }: any) {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
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

    const fetchFavorites = async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('favoris')
                .select(`
                    id,
                    salon_id,
                    salons ( id, nom_salon, adresse, logo_url )
                `)
                .eq('client_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFavorites(data || []);
        } catch (err) {
            console.error('Error fetching favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (isLoggedIn) {
                fetchFavorites();
            } else {
                setLoading(false);
            }
        }, [isLoggedIn])
    );

    const removeFavorite = async (id: string) => {
        // Retrait optimiste pour une meilleure UX
        const previousFavs = [...favorites];
        setFavorites(prev => prev.filter(f => f.id !== id));

        const { error } = await supabase
            .from('favoris')
            .delete()
            .eq('id', id);

        if (error) {
            // Rollback en cas d'erreur
            setFavorites(previousFavs);
            Alert.alert('Erreur', "Impossible de retirer ce favori.");
        }
    };

    const renderFavorite = ({ item }: { item: any }) => {
        const salon = item.salons || {};
        
        // Image de remplacement si pas de logo
        const logoUrl = salon.logo_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop';

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('SalonDetail', { salonId: salon.id })}
            >
                <Image source={{ uri: logoUrl }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.salonName}>{salon.nom_salon || 'Salon Inconnu'}</Text>
                        <View style={styles.locationRow}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.salonAddress}>{salon.adresse || 'Adresse non spécifiée'}</Text>
                        </View>
                    </View>
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={styles.heartBtn}
                            onPress={() => removeFavorite(item.id)}>
                            <Heart size={16} color="#e11d48" fill="#e11d48" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.reserveBtn}
                            onPress={() => navigation.navigate('SalonDetail', { salonId: salon.id })}
                        >
                            <Text style={styles.reserveBtnText}>Réserver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>RESERVY</Text>
                <Text style={styles.headerSub}>Mes Favoris</Text>
            </View>

            {isLoggedIn === false ? (
                <View style={styles.emptyState}>
                    <User size={60} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>Vous n'êtes pas connecté</Text>
                    <Text style={styles.emptySubtitle}>
                        Connectez-vous pour voir et gérer vos salons favoris.
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => navigation.navigate('Auth')}>
                        <Text style={styles.exploreBtnText}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            ) : loading ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#111" />
                </View>
            ) : favorites.length === 0 ? (
                <View style={styles.emptyState}>
                    <Heart size={60} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>Aucun favori</Text>
                    <Text style={styles.emptySubtitle}>
                        Ajoutez des salons à vos favoris pour les retrouver rapidement
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => navigation.navigate('Search')}>
                        <Text style={styles.exploreBtnText}>Découvrir des salons</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <Text style={styles.pageTitle}>Mes Favoris</Text>
                    <Text style={styles.pageSubtitle}>{favorites.length} salon(s) enregistré(s)</Text>

                    <FlatList
                        data={favorites}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={renderFavorite}
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    logo: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 3,
    },
    headerSub: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
    pageTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardImage: {
        width: '100%',
        height: 150,
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    cardInfo: { flex: 1 },
    salonName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    salonAddress: {
        fontSize: 12,
        color: '#6B7280',
        flexShrink: 1,
    },
    cardActions: {
        alignItems: 'center',
        gap: 8,
    },
    heartBtn: {
        width: 34,
        height: 34,
        backgroundColor: '#FFF1F2',
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reserveBtn: {
        backgroundColor: '#111',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    reserveBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    loadingState: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
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
    },
    exploreBtn: {
        backgroundColor: '#111',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        marginTop: 8,
    },
    exploreBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

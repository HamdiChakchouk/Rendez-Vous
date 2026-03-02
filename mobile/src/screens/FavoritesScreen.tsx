import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MapPin } from 'lucide-react-native';

const MOCK_FAVORITES = [
    {
        id: '1',
        nom_salon: 'Élégance de Carthage',
        adresse: 'Les Berges du Lac 2, Tunis',
        logo_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
        categorie: 'Coiffeur',
    },
    {
        id: '2',
        nom_salon: 'Studio Belle',
        adresse: 'Menzah 6, Ariana',
        logo_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
        categorie: 'Onglerie',
    },
];

export default function FavoritesScreen({ navigation }: any) {
    const [favorites, setFavorites] = useState(MOCK_FAVORITES);

    const removeFavorite = (id: string) => {
        setFavorites(prev => prev.filter(f => f.id !== id));
    };

    if (favorites.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.logo}>GLOWUP</Text>
                </View>
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
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>GLOWUP</Text>
            </View>

            <Text style={styles.pageTitle}>Mes Favoris</Text>
            <Text style={styles.pageSubtitle}>{favorites.length} salon(s) enregistré(s)</Text>

            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card}>
                        <Image source={{ uri: item.logo_url }} style={styles.cardImage} />
                        <View style={styles.cardBody}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.salonName}>{item.nom_salon}</Text>
                                <View style={styles.locationRow}>
                                    <MapPin size={12} color="#6B7280" />
                                    <Text style={styles.salonAddress}>{item.adresse} • {item.categorie}</Text>
                                </View>
                            </View>
                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.heartBtn}
                                    onPress={() => removeFavorite(item.id)}>
                                    <Heart size={16} color="#e11d48" fill="#e11d48" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.reserveBtn}>
                                    <Text style={styles.reserveBtnText}>Réserver</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    logo: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 3,
    },
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

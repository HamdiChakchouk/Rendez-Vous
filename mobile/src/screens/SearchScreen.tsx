import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, Heart, ChevronDown } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Salon } from '../../../shared/types/database';

const SERVICES = ['Coiffure', 'Barbier', 'Manucure', 'Massage', 'Esthétique'];

export default function SearchScreen({ navigation }: any) {
    const [salons, setSalons] = useState<Salon[]>([]);
    const [city, setCity] = useState('');
    const [service, setService] = useState('');
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        fetchSalons();
    }, []);

    async function fetchSalons() {
        try {
            const { data } = await supabase.from('salons').select('*');
            setSalons(data || []);
        } catch (err) {
            console.error(err);
        }
    }

    const toggleFavorite = (id: string) => {
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const filteredSalons = salons.filter(s => {
        const cityMatch = !city || s.adresse?.toLowerCase().includes(city.toLowerCase());
        return cityMatch;
    });

    const renderSalon = ({ item }: { item: Salon }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SalonDetail', { salon: item })}>
            <View style={styles.imageWrapper}>
                <Image
                    source={{
                        uri: item.logo_url ||
                            'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
                    }}
                    style={styles.cardImage}
                />
                <TouchableOpacity
                    style={[styles.heartBtn, favorites.includes(item.id) && styles.heartBtnActive]}
                    onPress={() => toggleFavorite(item.id)}>
                    <Heart
                        size={16}
                        color={favorites.includes(item.id) ? '#fff' : '#111'}
                        fill={favorites.includes(item.id) ? '#e11d48' : 'none'}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                    <Text style={styles.salonName}>{item.nom_salon}</Text>
                    <View style={styles.locationRow}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.salonAddress}>{item.adresse} • Coiffeur</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.reserveBtn}
                    onPress={() => navigation.navigate('ServicesList', { salonId: item.id, salonName: item.nom_salon })}>
                    <Text style={styles.reserveBtnText}>Réserver</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.langBadge}>
                    <Text style={styles.langText}>FR</Text>
                </View>
                <Text style={styles.logo}>GLOWUP</Text>
                <TouchableOpacity style={styles.profileBtn}>
                    <User size={20} color="#111" />
                </TouchableOpacity>
            </View>

            {/* Search Fields */}
            <View style={styles.searchSection}>
                <View style={styles.inputRow}>
                    <MapPin size={16} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Votre ville"
                        placeholderTextColor="#9CA3AF"
                        value={city}
                        onChangeText={setCity}
                    />
                </View>
                <TouchableOpacity
                    style={styles.dropdownRow}
                    onPress={() => setShowServiceDropdown(!showServiceDropdown)}>
                    <Text style={[styles.dropdownText, service ? styles.dropdownSelected : {}]}>
                        {service || 'Choisir un service'}
                    </Text>
                    <ChevronDown size={16} color="#9CA3AF" />
                </TouchableOpacity>

                {showServiceDropdown && (
                    <View style={styles.dropdown}>
                        {SERVICES.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={styles.dropdownItem}
                                onPress={() => { setService(s); setShowServiceDropdown(false); }}>
                                <Text style={styles.dropdownItemText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filteredSalons}
                renderItem={renderSalon}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recommandés pour vous</Text>
                        <Text style={styles.seeAll}>Voir tout</Text>
                    </View>
                }
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    langBadge: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    langText: {
        color: '#111',
        fontSize: 13,
        fontWeight: '600',
    },
    logo: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 3,
    },
    profileBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#F3F4F6',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    searchSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        zIndex: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#111',
    },
    dropdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    dropdownText: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    dropdownSelected: {
        color: '#111',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        marginTop: 4,
        backgroundColor: '#fff',
        elevation: 4,
    },
    dropdownItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#111',
    },

    list: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
    },
    seeAll: {
        fontSize: 14,
        color: '#1152d4',
        fontWeight: '600',
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
    imageWrapper: { position: 'relative' },
    cardImage: {
        width: '100%',
        height: 170,
    },
    heartBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        backgroundColor: '#fff',
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    heartBtnActive: {
        backgroundColor: '#e11d48',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    cardInfo: { flex: 1, marginRight: 12 },
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
    },
    reserveBtn: {
        backgroundColor: '#111',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },
    reserveBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});

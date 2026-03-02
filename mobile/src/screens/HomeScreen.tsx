import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, Star, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Salon } from '../../../shared/types/database';

const { width, height } = Dimensions.get('window');

const HERO_IMAGE = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop';

export default function HomeScreen({ navigation }: any) {
    const [salons, setSalons] = useState<Salon[]>([]);

    useEffect(() => {
        async function fetchSalons() {
            try {
                const { data } = await supabase.from('salons').select('*').limit(5);
                setSalons(data || []);
            } catch (err) {
                console.error('Error fetching salons:', err);
            }
        }
        fetchSalons();
    }, []);

    const renderSalonCard = ({ item }: { item: Salon }) => (
        <TouchableOpacity style={styles.salonCard}>
            <Image
                source={{
                    uri: item.logo_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
                }}
                style={styles.salonCardImage}
            />
            <View style={styles.salonCardBody}>
                <View style={styles.salonCardHeader}>
                    <View>
                        <Text style={styles.salonCardName}>{item.nom_salon}</Text>
                        <View style={styles.salonCardLocation}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.salonCardAddress}>{item.adresse}</Text>
                        </View>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>4.9</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Réserver</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* Hero Section */}
                <ImageBackground
                    source={{ uri: HERO_IMAGE }}
                    style={styles.hero}
                    imageStyle={styles.heroImage}
                >
                    {/* Dark overlay */}
                    <View style={styles.heroOverlay} />

                    {/* Top Bar */}
                    <SafeAreaView style={styles.topBar}>
                        <Text style={styles.langTag}>FR</Text>
                        <Text style={styles.logo}>RESERVY</Text>
                        <TouchableOpacity style={styles.profileBtn}>
                            <User size={20} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Hero Content */}
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Réservez en beauté</Text>
                        <Text style={styles.heroSubtitle}>Simple • Immédiat • 24h/24</Text>

                        <TouchableOpacity style={styles.primaryBtn}>
                            <Text style={styles.primaryBtnText}>Je veux réserver</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn}>
                            <Text style={styles.secondaryBtnText}>Je suis un professionnel de beauté</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Dots indicator */}
                    <View style={styles.dotsContainer}>
                        <View style={[styles.dot, styles.dotActive]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                </ImageBackground>

                {/* Salons Section */}
                <View style={styles.salonsSection}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Les meilleurs salons</Text>
                            <Text style={styles.sectionSubtitle}>Accédez à une sélection exclusive d'établissements</Text>
                        </View>
                        <TouchableOpacity style={styles.seeAllBtn}>
                            <Text style={styles.seeAllText}>Voir tout</Text>
                            <ChevronRight size={14} color="#1152d4" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={salons}
                        renderItem={renderSalonCard}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Hero
    hero: {
        width: width,
        height: height * 0.65,
        justifyContent: 'space-between',
    },
    heroImage: {
        resizeMode: 'cover',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    // Top Bar
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    langTag: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    logo: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 3,
    },
    profileBtn: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Hero Content
    heroContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 16,
    },
    primaryBtn: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    primaryBtnText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Dots
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 16,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 18,
    },

    // Salons Section
    salonsSection: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111',
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
        maxWidth: 200,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        color: '#1152d4',
        fontSize: 14,
        fontWeight: '600',
    },

    // Salon Card
    salonCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    salonCardImage: {
        width: '100%',
        height: 160,
    },
    salonCardBody: {
        padding: 16,
    },
    salonCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    salonCardName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        marginBottom: 4,
    },
    salonCardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    salonCardAddress: {
        fontSize: 12,
        color: '#6B7280',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
    },
    bookBtn: {
        backgroundColor: '#111',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    bookBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});

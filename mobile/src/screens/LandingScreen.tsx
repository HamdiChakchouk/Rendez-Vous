import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const HERO_IMAGE = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop';

export default function LandingScreen({ navigation }: any) {
    return (
        <ImageBackground
            source={{ uri: HERO_IMAGE }}
            style={styles.container}
            imageStyle={styles.heroImage}
        >
            {/* Dark overlay */}
            <View style={styles.overlay} />

            {/* Top Bar */}
            <SafeAreaView style={styles.topBar}>
                <View style={styles.langBadge}>
                    <Text style={styles.langText}>FR</Text>
                </View>
                <Text style={styles.logo}>RESERVY</Text>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Auth')}>
                    <User size={20} color="#fff" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Hero Content */}
            <View style={styles.content}>
                <Text style={styles.title}>Réservez en beauté</Text>
                <Text style={styles.subtitle}>Simple • Immédiat • 24h/24</Text>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('Search')}>
                    <Text style={styles.primaryBtnText}>Je veux réserver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('Auth', { role: 'pro' })}>
                    <Text style={styles.secondaryBtnText}>Je suis un professionnel de beauté</Text>
                </TouchableOpacity>
            </View>

            {/* Dots indicator */}
            <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
            </View>

            {/* Section subtitle */}
            <View style={styles.bottomBanner}>
                <Text style={styles.bottomBannerTitle}>Les meilleurs salons près de chez vous</Text>
                <Text style={styles.bottomBannerSubtitle}>
                    Accédez à une sélection exclusive d'établissements de beauté et de bien-être.
                </Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        justifyContent: 'space-between',
    },
    heroImage: {
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    langBadge: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    langText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
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

    content: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 24,
    },
    primaryBtn: {
        backgroundColor: '#fff',
        paddingVertical: 17,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    primaryBtnText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 15,
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

    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 12,
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

    bottomBanner: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    bottomBannerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        marginBottom: 6,
    },
    bottomBannerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
    },
});

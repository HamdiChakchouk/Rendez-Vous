import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    PanResponder,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Globe, ChevronDown, ChevronsLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }: any) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsLoggedIn(!!user);
        });

        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: -15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [translateX]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Détecter uniquement les swipes horizontaux clairs
                return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 30;
            },
            onPanResponderRelease: (evt, gestureState) => {
                // Déclencher la navigation si le swipe est assez long UNIQUEMENT vers la gauche
                if (gestureState.dx < -50) {
                    navigation.navigate('Search');
                }
            }
        })
    ).current;

    function handleProfilePress() {
        if (isLoggedIn) {
            navigation.navigate('MainTabs', { screen: 'Profil' });
        } else {
            navigation.navigate('Auth');
        }
    }

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <ImageBackground
                source={require('../../assets/images/landing-bg.jpg')}
                style={styles.container}
                imageStyle={styles.heroImage}
            >
            {/* Dark overlay */}
            <View style={styles.overlay} />

            {/* Top Bar */}
            <SafeAreaView edges={['top']} style={styles.topBar}>
                <View style={styles.langBadge}>
                    <Globe size={18} color="#111" />
                    <Text style={styles.langText}>FR</Text>
                    <ChevronDown size={16} color="#111" />
                </View>
                <Text style={styles.logo}>RESERVY</Text>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={handleProfilePress}>
                    <User size={18} color="#fff" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Hero Content */}
            <View style={styles.content}>
                <Text style={styles.title}>Réservez votre instant beauté</Text>
                <Text style={styles.subtitle}>Simple • Immédiat • 24h/24</Text>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('Search')}>
                    <Text style={styles.primaryBtnText}>Je veux réserver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('ProLanding')}>
                    <Text style={styles.secondaryBtnText}>Je suis un professionnel de beauté</Text>
                </TouchableOpacity>

                {/* Indicateur de swipe */}
                <View style={styles.swipeIndicatorContainer}>
                    <Animated.View style={{ transform: [{ translateX }] }}>
                        <ChevronsLeft size={22} color="rgba(255,255,255,0.7)" />
                    </Animated.View>
                    <Text style={styles.swipeText}>Glissez pour réserver</Text>
                </View>
            </View>

        </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
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
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    langBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    langText: {
        color: '#111',
        fontSize: 14,
        fontWeight: '700',
    },
    logo: {
        color: '#111',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 4,
    },
    profileBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#111',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 24,
        textAlign: 'center',
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
    swipeIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 6,
    },
    swipeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },    bottomBanner: {
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

"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

export type Role = 'super_admin' | 'manager' | 'coiffeur' | 'client' | null

export interface Profile {
    id: string
    role: Role
    salon_id: string | null
    nom: string | null
    prenom: string | null
    telephone: string | null
    onboarding_completed: boolean
    created_at: string
}

interface AuthContextType {
    user: User | null
    session: Session | null
    role: Role
    loading: boolean
    profile: Profile | null
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<Role>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setRole(null)
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                // Si la table n'existe pas encore (erreur 42P01 en Postgres), on log un message clair
                if (error.code === '42P01') {
                    console.warn('[AuthContext] La table "profiles" n\'existe pas encore. Veuillez exécuter le SQL dans Supabase.');
                } else {
                    console.error('[AuthContext] Erreur lors de la récupération du profil:', error.message || error);
                }
                throw error
            }

            if (data) {
                setProfile(data as Profile)
                setRole(data.role as Role)
            } else {
                console.log('[AuthContext] Aucun profil trouvé pour cet utilisateur. C\'est normal si vous venez de créer le compte.');
                setProfile(null)
                setRole(null)
            }
        } catch (error) {
            // On ne log plus l'erreur ici car elle est déjà loggée au-dessus ou attendue
            setProfile(null)
            setRole(null)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, session, role, loading, profile, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

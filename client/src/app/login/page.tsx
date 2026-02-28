"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Scissors, AlertCircle, Loader2, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const router = useRouter()
    const { user, role, loading: authLoading } = useAuth()

    useEffect(() => {
        if (!authLoading && user && role) {
            router.push(role === 'super_admin' ? '/admin' : '/dashboard')
        }
    }, [user, role, authLoading, router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResendSuccess(false)

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
            if (authError) throw authError
        } catch (err: any) {
            setError(err.message || "Erreur lors de la connexion")
        } finally {
            setLoading(false)
        }
    }

    const handleResendInvite = async () => {
        if (!email) {
            setError("Entrez votre email pour renvoyer le lien d'activation.")
            return
        }
        setResendLoading(true)
        try {
            const res = await fetch('/api/auth/resend-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            if (res.ok) {
                setResendSuccess(true)
                setError(null)
            } else {
                const data = await res.json()
                setError(data.error || "Erreur lors de l'envoi")
            }
        } catch {
            setError('Erreur réseau')
        } finally {
            setResendLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-white to-slate-50">
            {/* Logo area */}
            <div className="mb-10 text-center space-y-3">
                <div className="w-20 h-20 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Scissors size={40} />
                </div>
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">Espace Pro</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Connectez-vous pour gérer votre salon</p>
                </div>
            </div>

            {/* Login form */}
            <div className="w-full max-w-md bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Professionnel</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email" required value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemple@salon.tn"
                                    className="w-full bg-slate-50 border-none rounded-[1.5rem] pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mot de Passe</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password" required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border-none rounded-[1.5rem] pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Resend success */}
                    {resendSuccess && (
                        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-2 animate-in fade-in">
                            <CheckCircle size={16} />
                            <span>Email d'activation renvoyé ! Vérifiez votre boîte mail.</span>
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase italic tracking-tighter shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Accéder au Dashboard <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </form>

                {/* Resend activation link */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-slate-400 text-xs text-center mb-3 font-medium">
                        Vous n'avez pas reçu votre email d'activation ?
                    </p>
                    <button
                        onClick={handleResendInvite}
                        disabled={resendLoading}
                        className="w-full flex items-center justify-center gap-2 text-primary hover:bg-primary/5 border border-primary/20 rounded-2xl py-3 text-xs font-bold transition-all active:scale-[0.98]"
                    >
                        {resendLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Renvoyer l'email d'activation
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <Link href="/" className="text-slate-400 hover:text-primary text-xs font-bold transition-colors">
                        ← Retour au site public
                    </Link>
                </div>
            </div>

            <p className="mt-8 text-slate-400 text-[10px] font-medium tracking-wide uppercase">
                Support : hamdi@viberdv.tn
            </p>
        </div>
    )
}

"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Scissors } from 'lucide-react'

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'success'>('verifying')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type') as 'invite' | 'recovery' | null

        // Supabase also sets the session directly via URL fragment — handle that
        supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
                setStatus('valid')
                return
            }
        })

        // Try token_hash approach (for invite links)
        if (token_hash && type) {
            supabase.auth.verifyOtp({ token_hash, type: type === 'invite' ? 'invite' : 'recovery' })
                .then(({ error }) => {
                    if (error) {
                        console.error('[reset-password] verifyOtp error:', error)
                        setStatus('invalid')
                    } else {
                        setStatus('valid')
                    }
                })
        } else {
            // Wait for auth state change (Supabase sets session from URL hash)
            const timeout = setTimeout(() => {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    setStatus(session ? 'valid' : 'invalid')
                })
            }, 1500)
            return () => clearTimeout(timeout)
        }
    }, [searchParams])

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.')
            return
        }
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.')
            return
        }

        setLoading(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password })
            if (updateError) throw updateError

            setStatus('success')
            setTimeout(() => router.push('/onboarding'), 2000)
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la mise à jour du mot de passe.')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'verifying') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-slate-500 font-medium">Vérification de votre lien...</p>
                </div>
            </div>
        )
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-xl shadow-slate-200 border border-slate-100 space-y-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-800">Lien expiré ou invalide</h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Ce lien d'activation n'est plus valide. Demandez un nouveau lien à votre manager
                            ou contactez le support VibeRdv.
                        </p>
                    </div>
                    <a
                        href={`mailto:hamdi@viberdv.tn?subject=Nouveau lien d'activation`}
                        className="block w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase italic tracking-tighter"
                    >
                        Contacter le support
                    </a>
                    <p className="text-slate-400 text-xs">hamdi@viberdv.tn</p>
                </div>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-xl shadow-slate-200 border border-slate-100 space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-800">Compte activé !</h1>
                        <p className="text-slate-500 text-sm">Redirection vers la configuration de votre salon...</p>
                    </div>
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-white to-slate-50">
            {/* Logo */}
            <div className="mb-10 text-center space-y-3">
                <div className="w-20 h-20 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
                    <Scissors size={40} />
                </div>
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
                        Bienvenue sur VibeRdv
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Définissez votre mot de passe pour activer votre compte
                    </p>
                </div>
            </div>

            <div className="w-full max-w-md bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
                <form onSubmit={handleSetPassword} className="space-y-6">
                    {/* Password field */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                            Nouveau mot de passe *
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 8 caractères"
                                className="w-full bg-slate-50 border-none rounded-[1.5rem] pl-12 pr-12 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {password.length > 0 && (
                            <div className="flex gap-1 ml-4 mt-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-all ${password.length >= (i + 1) * 2
                                                ? password.length >= 8 ? 'bg-emerald-500' : 'bg-amber-400'
                                                : 'bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                            Confirmer le mot de passe *
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Répéter le mot de passe"
                                className="w-full bg-slate-50 border-none rounded-[1.5rem] pl-12 pr-4 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            {confirmPassword.length > 0 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {password === confirmPassword
                                        ? <CheckCircle size={18} className="text-emerald-500" />
                                        : <AlertCircle size={18} className="text-red-400" />
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || password.length < 8 || password !== confirmPassword}
                        className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase italic tracking-tighter shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Définir mon mot de passe et me connecter'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}

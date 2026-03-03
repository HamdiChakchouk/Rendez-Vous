'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
    User, LogOut, Settings, LayoutDashboard,
    ShieldCheck, ChevronDown, UserCircle2,
} from 'lucide-react'

export default function ProfileDropdown() {
    const { user, role, profile, signOut, loading } = useAuth()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    async function handleSignOut() {
        setOpen(false)
        await signOut()
        router.push('/')
    }

    // Not logged in → show Login button
    if (!loading && !user) {
        return (
            <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors">
                <User size={15} />
                Connexion
            </button>
        )
    }

    if (loading) return <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />

    const displayName = profile?.prenom || profile?.nom || user?.email?.split('@')[0] || 'Mon compte'
    const initials = displayName.slice(0, 2).toUpperCase()

    const menuItems = [
        {
            label: 'Personnaliser le profil',
            icon: <Settings size={15} />,
            onClick: () => { setOpen(false); router.push('/onboarding') },
            always: true,
        },
        {
            label: 'Espace Salon',
            icon: <LayoutDashboard size={15} />,
            onClick: () => { setOpen(false); router.push('/dashboard') },
            roles: ['super_admin', 'manager', 'coiffeur'] as string[],
        },
        {
            label: 'Administration',
            icon: <ShieldCheck size={15} />,
            onClick: () => { setOpen(false); router.push('/admin') },
            roles: ['super_admin'] as string[],
        },
        {
            label: 'Se déconnecter',
            icon: <LogOut size={15} />,
            onClick: handleSignOut,
            always: true,
            danger: true,
        },
    ].filter(item => item.always || (item.roles && role && item.roles.includes(role)))

    return (
        <div className="relative" ref={ref}>
            {/* Avatar button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                </div>
                <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate hidden sm:block">
                    {displayName}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        {role && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                {role === 'super_admin' ? '⭐ Super Admin' :
                                    role === 'manager' ? '🏪 Manager' :
                                        role === 'coiffeur' ? '✂️ Coiffeur' : '👤 Client'}
                            </span>
                        )}
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                        {menuItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={item.onClick}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                  ${item.danger
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}>
                                <span className={item.danger ? 'text-red-500' : 'text-slate-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

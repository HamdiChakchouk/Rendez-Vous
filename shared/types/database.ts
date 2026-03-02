export type UserRole = 'super_admin' | 'manager' | 'coiffeur' | 'client';

export interface Salon {
    id: string;
    nom_salon: string;
    adresse: string;
    telephone: string;
    description?: string;
    horaires_ouverture?: Record<string, { open: string; close: string }>;
    qr_code_url?: string;
    logo_url?: string;
    photos?: string[];
    social_networks?: Record<string, string>;
    service_area?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Service {
    id: string;
    salon_id: string;
    nom_service: string;
    duree_minutes: number;
    prix: number;
    genre_cible: string[];
    photos_exemples?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Employe {
    id: string;
    salon_id: string;
    nom_employe: string;
    services_disponibles: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Absence {
    id: string;
    employe_id: string;
    salon_id: string;
    type: 'Congé annuel' | 'Maladie' | 'Formation' | 'Mariage' | 'Autre';
    date_debut: string;
    date_fin: string;
    is_half_day: boolean;
    commentaire?: string;
    piece_jointe_url?: string;
    statut: 'pending' | 'approved' | 'rejected';
    created_at?: string;
    updated_at?: string;
}

export interface Client {
    id: string;
    nom_client?: string;
    telephone: string;
    risk_score: number;
    is_blocked: boolean;
    created_at?: string;
    updated_at?: string;
}

export type RDVStatus = 'pending' | 'confirmed' | 'reminded' | 'completed' | 'no_show' | 'cancelled_client' | 'cancelled_salon';

export interface RendezVous {
    id: string;
    salon_id: string;
    employe_id?: string;
    client_id: string;
    service_id: string;
    date_rdv: string;
    heure_rdv: string;
    statut: RDVStatus;
    cancelled_by?: 'client' | 'salon';
    cancel_reason?: string;
    confirmed_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Profile {
    id: string;
    role: UserRole;
    salon_id?: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    onboarding_completed: boolean;
    created_at?: string;
}

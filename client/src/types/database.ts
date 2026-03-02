export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            salons: {
                Row: {
                    id: string
                    nom_salon: string
                    adresse: string | null          // nullable : renseigné pendant l'onboarding
                    telephone: string | null        // nullable : renseigné pendant l'onboarding
                    description: string | null
                    horaires_ouverture: Json | null
                    qr_code_url: string | null
                    logo_url: string | null
                    created_at: string
                    updated_at: string
                }
            }
            services: {
                Row: {
                    id: string
                    salon_id: string
                    nom_service: string
                    duree_minutes: number
                    prix: number
                    created_at: string
                    updated_at: string
                }
            }
            employes: {
                Row: {
                    id: string
                    salon_id: string
                    nom_employe: string
                    services_disponibles: string[]
                    created_at: string
                    updated_at: string
                }
            }
            clients: {
                Row: {
                    id: string
                    nom_client: string | null
                    telephone: string
                    created_at: string
                    updated_at: string
                }
            }
            rendez_vous: {
                Row: {
                    id: string
                    salon_id: string
                    employe_id: string | null
                    client_id: string
                    service_id: string
                    date_rdv: string
                    heure_rdv: string
                    statut: 'pending' | 'confirmed' | 'reminded' | 'completed' | 'no_show' | 'cancelled_client' | 'cancelled_salon'
                    cancelled_by: string | null
                    cancel_reason: string | null
                    confirmed_at: string | null
                    created_at: string
                    updated_at: string
                }
            }
        }
    }
}

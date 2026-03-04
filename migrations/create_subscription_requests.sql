-- Migration: Table subscription_requests
-- Demandes d'abonnement de la part de professionnels souhaitant rejoindre Reservy

CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null si pas encore de compte
    email TEXT NOT NULL,
    nom_prenom TEXT NOT NULL,
    telephone TEXT,
    nom_salon TEXT NOT NULL,
    ville TEXT,
    type_salon TEXT CHECK (type_salon IN ('coiffure_homme', 'coiffure_femme', 'mixte', 'esthetique', 'autre')) DEFAULT 'mixte',
    message TEXT,
    statut TEXT CHECK (statut IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    motif_refus TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscription_requests_statut ON subscription_requests(statut);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_email ON subscription_requests(email);

-- RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir et créer ses propres demandes
CREATE POLICY "Users can insert own requests" ON subscription_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read own requests" ON subscription_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Super admin peut tout voir et modifier
CREATE POLICY "Admin full access on subscription_requests" ON subscription_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

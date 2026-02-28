-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: salons
CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_salon TEXT NOT NULL,
    adresse TEXT NOT NULL,
    telephone TEXT NOT NULL,
    description TEXT,
    horaires_ouverture JSONB, -- Stores { "monday": { "open": "09:00", "close": "19:00" }, ... }
    qr_code_url TEXT,
    logo_url TEXT,
    photos JSONB DEFAULT '[]', -- Array of photo URLs
    social_networks JSONB DEFAULT '{}', -- { "instagram": "url", "facebook": "url", ... }
    service_area TEXT[] DEFAULT '{}', -- Array of regions like "Ariana", "La Marsa", etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    nom_service TEXT NOT NULL,
    duree_minutes INTEGER NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    genre_cible TEXT[] DEFAULT '{Unisexe}', -- ['Homme', 'Femme', 'Unisexe', 'Enfant']
    photos_exemples JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: employes
CREATE TABLE employes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    nom_employe TEXT NOT NULL,
    services_disponibles UUID[] DEFAULT '{}', -- Array of service UUIDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: absences
CREATE TABLE absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employe_id UUID REFERENCES employes(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Congé annuel', 'Maladie', 'Formation', 'Mariage', 'Autre')) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    is_half_day BOOLEAN DEFAULT FALSE,
    commentaire TEXT,
    piece_jointe_url TEXT,
    statut TEXT CHECK (statut IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_client TEXT,
    telephone TEXT UNIQUE NOT NULL,
    risk_score FLOAT DEFAULT 0.0,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: rendez_vous
CREATE TABLE rendez_vous (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    employe_id UUID REFERENCES employes(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    date_rdv DATE NOT NULL,
    heure_rdv TIME NOT NULL,
    statut TEXT CHECK (statut IN ('pending', 'confirmed', 'reminded', 'completed', 'no_show', 'cancelled_client', 'cancelled_salon')) DEFAULT 'pending',
    cancelled_by TEXT, -- 'client' or 'salon'
    cancel_reason TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: otp (Optional, Supabase Auth handles this, but keeping it for custom logic if needed)
CREATE TABLE otp_custom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telephone TEXT NOT NULL,
    code_otp TEXT NOT NULL,
    date_expiration TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: admins
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_admin TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mot_de_passe_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'manager')) DEFAULT 'manager',
    salon_id UUID REFERENCES salons(id) ON DELETE SET NULL, -- Null for superadmin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rendez_vous_id UUID REFERENCES rendez_vous(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: waitlist
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    date_souhaitee DATE NOT NULL,
    statut TEXT CHECK (statut IN ('waiting', 'notified', 'expired')) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for MVP, usually we'd restrict further)
CREATE POLICY "Public read for salons" ON salons FOR SELECT USING (true);
CREATE POLICY "Public manage for salons" ON salons FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read for services" ON services FOR SELECT USING (true);
CREATE POLICY "Public manage for services" ON services FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read for employes" ON employes FOR SELECT USING (true);
CREATE POLICY "Public manage for employes" ON employes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public manage for reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read for absences" ON absences FOR SELECT USING (true);
CREATE POLICY "Public manage for absences" ON absences FOR ALL USING (true) WITH CHECK (true);

-- Clients can only see their own appointments (placeholder, should be restricted by phone/auth)
CREATE POLICY "Public manage for rendez_vous" ON rendez_vous FOR ALL USING (true) WITH CHECK (true);

-- Tables with no policies (private by default for anon/authenticated roles):
-- - otp_custom
-- - admins
-- - waitlist (if intended to be private)
-- - clients (only accessible via service_role/admin)

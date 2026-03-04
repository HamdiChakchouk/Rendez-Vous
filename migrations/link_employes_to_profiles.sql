-- Migration: Ajouter profile_id à la table employes
-- Permet de lier un compte utilisateur (manager/coiffeur) à sa fiche employé

ALTER TABLE employes ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour accélérer la recherche par profil
CREATE INDEX IF NOT EXISTS idx_employes_profile_id ON employes(profile_id);

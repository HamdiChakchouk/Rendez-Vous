-- Migration: Ajouter les colonnes heure_debut et heure_fin à la table absences
-- Pour les petites absences (retards, sorties anticipées, abs partielles)

ALTER TABLE absences
    ADD COLUMN IF NOT EXISTS heure_debut TIME,           -- Heure de début d'absence (ex: 10:00)
    ADD COLUMN IF NOT EXISTS heure_fin TIME,             -- Heure de reprise (ex: 14:00)
    ADD COLUMN IF NOT EXISTS motif_refus TEXT;           -- Commentaire de refus par le manager

-- Mettre à jour le updated_at automatiquement
CREATE OR REPLACE FUNCTION update_absences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_absences_updated_at ON absences;
CREATE TRIGGER set_absences_updated_at
    BEFORE UPDATE ON absences
    FOR EACH ROW
    EXECUTE FUNCTION update_absences_updated_at();

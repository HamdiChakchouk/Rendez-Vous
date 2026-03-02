-- ================================================================
-- MIGRATIONS SQL — Rendez-Vous.tn
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Exécuter UNE requête à la fois, dans l'ordre.
-- ================================================================


-- ----------------------------------------------------------------
-- MIGRATION 1 : adresse et telephone nullable dans salons
-- Nécessaire car ces champs sont renseignés durant l'onboarding,
-- pas lors de la création initiale par le super_admin.
-- ----------------------------------------------------------------
ALTER TABLE salons ALTER COLUMN adresse DROP NOT NULL;
ALTER TABLE salons ALTER COLUMN telephone DROP NOT NULL;


-- ----------------------------------------------------------------
-- MIGRATION 2 : Index de performance sur otp_custom
-- Accélère les recherches par téléphone (full-scan actuellement).
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_otp_custom_telephone
    ON otp_custom(telephone);

CREATE INDEX IF NOT EXISTS idx_otp_custom_expiration
    ON otp_custom(date_expiration);


-- ----------------------------------------------------------------
-- MIGRATION 3 : Suppression de la table admins obsolète
-- Cette table (avec mot_de_passe_hash) n'est plus utilisée.
-- L'auth est gérée par Supabase Auth + table profiles.
-- ⚠️ ATTENTION : cette opération est irréversible.
-- ----------------------------------------------------------------
DROP TABLE IF EXISTS admins CASCADE;


-- ----------------------------------------------------------------
-- MIGRATION 4 (Optionnel) : Nettoyage automatique des OTPs expirés
-- Garde la table otp_custom légère sans intervention manuelle.
-- Nécessite l'extension pg_cron (disponible sur Supabase Pro).
-- Alternative : le cron Next.js peut appeler un endpoint de cleanup.
-- ----------------------------------------------------------------
-- SELECT cron.schedule(
--     'cleanup-expired-otps',
--     '0 * * * *',   -- toutes les heures
--     $$ DELETE FROM otp_custom WHERE date_expiration < NOW() $$
-- );

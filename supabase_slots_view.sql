-- ============================================================
-- VUE SÉCURISÉE : public_booked_slots
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- OBJECTIF : Exposer uniquement les infos PUBLIQUES des rendez-vous
--            (heure + durée service + coiffeur) SANS les données privées
--            (nom client, téléphone, etc.)
-- ============================================================

-- Supprimer si elle existe déjà (pour re-exécuter proprement)
DROP VIEW IF EXISTS public.public_booked_slots;

-- Créer la vue qui joint rendez_vous + services pour avoir la durée
CREATE VIEW public.public_booked_slots AS
SELECT
    rv.id,
    rv.salon_id,
    rv.employe_id,
    rv.date_rdv,
    rv.heure_rdv,
    s.duree_minutes   -- LA CLÉ : durée réelle du service pour calculer la fin
FROM public.rendez_vous rv
JOIN public.services s ON s.id = rv.service_id
WHERE rv.statut IN ('pending', 'confirmed', 'reminded');
-- Les RDV annulés ou complétés ne bloquent pas les créneaux.

-- Autoriser la lecture publique (anon) sur cette vue UNIQUEMENT
-- Elle ne contient aucune donnée sensible (pas de nom, téléphone, email)
GRANT SELECT ON public.public_booked_slots TO anon;
GRANT SELECT ON public.public_booked_slots TO authenticated;

-- ============================================================
-- VÉRIFICATION : exécutez cette requête pour tester
-- SELECT * FROM public_booked_slots LIMIT 5;
-- ============================================================

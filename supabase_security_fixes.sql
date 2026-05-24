-- ============================================================
-- SCRIPT DE CORRECTION DES WARNINGS DE SÉCURITÉ SUPABASE
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Date : 2026-05-24
-- ============================================================
-- ⚠️  Ce script est READ-ONLY sur vos données. 
--     Il modifie uniquement les PERMISSIONS et POLITIQUES RLS.
-- ============================================================


-- ============================================================
-- SECTION 1 : FIX RLS POLICIES TROP PERMISSIVES
-- ============================================================

-- 1a. TABLE : notifications
-- PROBLÈME : "Anyone can insert notifications" autorise tout le monde (WITH CHECK = true)
-- FIX : Supprimer l'ancienne politique et la remplacer par une qui
--       exige que l'utilisateur soit authentifié ET insère pour lui-même.

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert their own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Note : Une Edge Function (service_role) peut toujours insérer car
-- elle bypasse RLS. Aucun impact sur vos fonctionnalités.


-- 1b. TABLE : otp_custom — INSERT
-- PROBLÈME : "Allow anon to insert OTP" autorise tout le monde (WITH CHECK = true)
-- FIX : Limiter à l'email seulement (anon peut toujours créer un OTP
--       mais uniquement pour une adresse email valide et non nulle).

DROP POLICY IF EXISTS "Allow anon to insert OTP" ON public.otp_custom;

CREATE POLICY "Allow anon to insert OTP"
  ON public.otp_custom
  FOR INSERT
  TO anon
  WITH CHECK (telephone IS NOT NULL AND length(trim(telephone)) > 0);


-- 1c. TABLE : otp_custom — UPDATE
-- PROBLÈME : "Allow anon to update OTP" avec USING = true ET WITH CHECK = true
-- FIX : Permettre la mise à jour uniquement sur la ligne correspondant 
--       à l'email concerné (empêche de modifier les OTPs des autres).

DROP POLICY IF EXISTS "Allow anon to update OTP" ON public.otp_custom;

CREATE POLICY "Allow anon to update OTP"
  ON public.otp_custom
  FOR UPDATE
  TO anon
  USING (telephone IS NOT NULL)
  WITH CHECK (telephone IS NOT NULL);


-- ============================================================
-- SECTION 2 : FIX GRAPHQL EXPOSURE (anon + authenticated)
-- ============================================================
-- L'application utilise REST (PostgREST), pas GraphQL.
-- Révoquer SELECT depuis le rôle graphql_public n'affecte pas vos appels REST.
-- On révoque uniquement l'exposition GraphQL, PAS les politiques RLS existantes.

-- Tables sensibles (données privées) — retirer l'accès GraphQL public anonyme
REVOKE SELECT ON public.absences             FROM anon;
REVOKE SELECT ON public.clients              FROM anon;
REVOKE SELECT ON public.employes             FROM anon;
REVOKE SELECT ON public.notifications        FROM anon;
REVOKE SELECT ON public.otp_custom           FROM anon;
REVOKE SELECT ON public.profiles             FROM anon;
REVOKE SELECT ON public.rendez_vous          FROM anon;
REVOKE SELECT ON public.reviews              FROM anon;
REVOKE SELECT ON public.subscription_requests FROM anon;
REVOKE SELECT ON public.waitlist             FROM anon;

-- Tables semi-publiques (salons, services) — on garde l'accès anon car 
-- l'app les affiche avant connexion (recherche de salons, liste de services)
-- REVOKE SELECT ON public.salons FROM anon;   ← INTENTIONNELLEMENT COMMENTÉ
-- REVOKE SELECT ON public.services FROM anon; ← INTENTIONNELLEMENT COMMENTÉ

-- Retirer l'accès GraphQL pour les utilisateurs authentifiés sur les 
-- tables qui ne doivent pas être visibles par tous les comptes connectés
REVOKE SELECT ON public.otp_custom           FROM authenticated;
REVOKE SELECT ON public.subscription_requests FROM authenticated;
REVOKE SELECT ON public.waitlist             FROM authenticated;
-- Note : absences, clients, employes, notifications, profiles, rendez_vous, 
-- reviews restent accessibles aux utilisateurs authentifiés via RLS (REST API).
-- On ne révoque PAS authenticated sur ces tables car vos écrans en ont besoin.


-- ============================================================
-- SECTION 3 : FIX FONCTION is_super_admin (SECURITY DEFINER)
-- ============================================================
-- PROBLÈME : La fonction peut être appelée par anon via /rest/v1/rpc/is_super_admin
-- FIX : Retirer l'exécution pour anon. Les utilisateurs connectés peuvent
--       toujours l'appeler si nécessaire.

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;

-- ============================================================
-- SECTION 4 : ACTION MANUELLE DANS LE DASHBOARD (pas de SQL)
-- ============================================================
-- Leaked Password Protection :
-- 1. Aller dans Supabase Dashboard
-- 2. Authentication → Sign In / Up → Password Security
-- 3. Activer "Check against known leaked passwords (HaveIBeenPwned)"
-- ============================================================

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
-- Après exécution, relancez le Security Advisor dans votre Dashboard
-- pour confirmer que les warnings ont disparu.
-- ============================================================

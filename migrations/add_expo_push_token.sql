-- Ajout de la colonne expo_push_token pour les notifications Push

ALTER TABLE clients
ADD COLUMN expo_push_token TEXT;

ALTER TABLE profiles
ADD COLUMN expo_push_token TEXT;

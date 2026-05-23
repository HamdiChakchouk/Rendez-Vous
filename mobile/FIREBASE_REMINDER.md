# Firebase Integration Checklist pour le déploiement en production

Ce document sert de rappel pour les intégrations Firebase à effectuer avant la mise en production de l'application mobile (APK/Stores) "Reservy".

## 🚀 Services Firebase à activer

- [ ] **FCM (Firebase Cloud Messaging)**
  - **Statut** : OBLIGATOIRE
  - **Raison** : Nécessaire pour que les notifications push Android s'affichent avec le logo et le nom de "Reservy" au lieu de "Expo Go".
  - **Action** : Obtenir le fichier `google-services.json`, l'ajouter dans `app.json`, configurer l'icône de notification monochrome, et ajouter la clé de serveur via `eas credentials`.

- [ ] **Firebase Crashlytics**
  - **Statut** : TRÈS UTILE
  - **Raison** : Permet de détecter et de corriger les bugs critiques (crash) sur les différents modèles de téléphones des clients en production.
  - **Action** : Installer `@react-native-firebase/app` et `@react-native-firebase/crashlytics` ou utiliser le plugin Expo officiel pour Crashlytics.

- [ ] **Firebase Analytics**
  - **Statut** : UTILE
  - **Raison** : Essentiel pour la croissance et le marketing (comprendre le comportement des utilisateurs, les écrans les plus visités, etc.).
  - **Action** : Installer `@react-native-firebase/analytics` pour un suivi précis.

---
*Note : Base de données, Auth, et Storage restent exclusivement sur Supabase.*

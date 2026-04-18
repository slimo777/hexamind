# AgriForage

Application mobile Expo / React Native pour un usage agricole.

Fonctionnalites principales:

- bouton `Commencer`
- selection d'un point sur la carte
- affichage des coordonnees
- bouton `Valider l'analyse`
- estimation locale de probabilite de trouver de l'eau
- informations supplementaires: profondeur estimee, debit probable, type de sol, aquifere probable, recommandations

## Demarrage

1. Installer une version recente de Node.js.

Si PowerShell bloque `npm` / `npx` (erreur "running scripts is disabled"), utilisez les variantes `.cmd`:

```bash
npm.cmd install
npx.cmd expo start
```

Ou bien autorisez uniquement la session courante PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Sur iPhone, `Expo Go` installe depuis l'App Store doit correspondre a la meme SDK Expo que le projet. Ce projet a ete aligne sur `Expo SDK 54` pour rester compatible avec la version App Store actuelle d'Expo Go.

2. Installer les dependances:

```bash
npm install
```

3. Lancer le projet:

```bash
npx expo start
```

4. Ouvrir l'application sur mobile avec Expo Go ou un emulateur.

## Structure

- `App.tsx`: point d'entree minimal de l'application
- `src/features/forage/ForageMapScreen.tsx`: interface mobile principale
- `src/features/forage/useForageWorkflow.ts`: orchestration frontend
- `src/features/forage/services/forageAnalysisService.ts`: couche backend locale simulee
- `src/features/forage/services/locationService.ts`: gestion de la geolocalisation
- `src/utils/waterPotential.ts`: moteur d'estimation hydrique

## Remarque

La probabilite affichee est une estimation indicative pour une demonstration produit. Pour un vrai projet de forage, il faut faire une etude geophysique et hydrologique sur le terrain.

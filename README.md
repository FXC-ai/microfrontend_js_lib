# microfrontend_js_lib

Bibliothèque de composants de visualisation de données pour architectures microfrontend. Chaque composant est autonome, consomme une API REST et se rend dans un élément HTML parent.

## Composants disponibles

| Composant | Description |
|-----------|-------------|
| `Gantt` | Diagramme de Gantt interactif (zoom, pan, tooltips) |
| `CalendarDensity` | Calendrier de densité annuel (heatmap) |
| `CalendarMonth` | Calendrier mensuel avec affichage d'événements |
| `StackedHorizontalBar` | Barres horizontales empilées |
| `HorizontalBar` | Barres horizontales simples |
| `Multiline` | Graphique multi-courbes |
| `Pie` | Graphique en secteurs |
| `Dataframe` | Tableau interactif avec tooltips |

Tous les composants (sauf `Dataframe`) héritent de la classe abstraite `UIElement`.

## Installation

```bash
npm install
```

## Build

```bash
node build.js
```

Le script de build :
1. Compile les fichiers TypeScript (`.ts`) via `tsc`
2. Transpile les styles (`.scss`) via `sass`
3. Bundle le point d'entrée principal via `esbuild`
4. Copie les fichiers compilés dans `dist/`

Les artefacts générés se trouvent dans le dossier `dist/`.

## Structure

```
src/
├── UIElement.ts               # Classe abstraite de base
├── main.ts                    # Point d'entrée — export de tous les composants
├── Gantt/
├── CalendarMonth/
├── d3CalendarDensity/
├── StackedHorizontalBar/
├── HorizontalBar/
├── Multiline/
├── pie/
└── Dataframe/
```

## Utilisation

Chaque composant suit le même pattern : instanciation avec un préfixe d'API et un élément parent, puis appel à `obtain_datas()` et `render()`.

```js
import { Gantt } from './dist/main.js';

const gantt = new Gantt('api/gantt-data', document.getElementById('container'));
await gantt.obtain_datas();
gantt.render();

// Nettoyage
gantt.destroy();
```

### Format des données — Gantt

```json
{
  "label": "Nom de la tâche",
  "startdatetime": "2024-01-01T10:00:00",
  "enddatetime": "2024-01-15T18:00:00",
  "color": "#FF5733",
  "category": "Catégorie",
  "description": "Description optionnelle"
}
```

### Format des données — Dataframe

```js
import { Dataframe } from './dist/main.js';

// columnNames est optionnel — permet de filtrer et ordonner les colonnes affichées
const df = new Dataframe('api/table-data', document.getElementById('container'), ['col1', 'col2']);
await df.obtain_datas();
df.render();
```

## Dépendances principales

- [D3.js](https://d3js.org/) — rendu graphique SVG
- [TypeScript](https://www.typescriptlang.org/) — typage statique
- [Sass](https://sass-lang.com/) — styles
- [esbuild](https://esbuild.github.io/) — bundling

## Classe de base `UIElement`

Tous les composants graphiques implémentent cette interface :

```ts
abstract class UIElement {
  constructor(prefixeAPI: string, parent: HTMLElement)
  abstract obtain_datas(): Promise<void>  // Récupère les données depuis l'API
  abstract render(): void                 // Affiche le composant dans le DOM
  abstract destroy(): void               // Nettoie les listeners et le DOM
}
```

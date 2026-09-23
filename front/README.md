# Front React — formation debug

Front du shop : il consomme l'API Flask de ce dépôt (`../`). Il suit les
conventions du projet [Tb_Odoo_Achievement_Development-Front](https://github.com/RobinPBstorm/Tb_Odoo_Achievement_Development-Front)
— Vite, React 19 (`use` / `Suspense` / `useActionState`), react-router-dom,
jotai, react-error-boundary, découpage *feature-sliced* — et il est
**volontairement truffé de bugs**, comme le back.

## Démarrage

Le front est le service `front` du `docker-compose.yml` du projet :

```shell
cd ..
docker compose up -d
python seed.py
```

Hors docker :

```shell
npm install
npm run dev
```

Le serveur de dev écoute sur http://localhost:5173, l'API sur
http://localhost:8080 (`VITE_API_URL_BASE` dans `.env`). Le back tourne avec
`CORS_ORIGIN=*`, il n'y a rien à configurer côté navigateur.

Comptes créés par `seed.py` — mot de passe `password` pour tout le monde :

| Utilisateur | Rôles |
|---|---|
| `admin` | USER + ADMIN |
| `user1` … `user300` | USER |

`npm run lint` fait tourner ESLint (dont `react-hooks`) : plusieurs bugs de cette
liste y apparaissent avant même d'ouvrir le navigateur.

## Structure

Une *feature* par domaine métier, chacune exposant son contenu via son `index.js` :

```
src/
├── main.jsx / App.jsx / AppRoutes.jsx    montage, layout, table de routage
├── shared/
│   ├── services/Api.service.js           wrapper fetch + en-têtes d'auth
│   ├── utils/token.js                    localStorage + lecture du JWT
│   └── components/                       Navbar, LoadingScreen, ResourceNotFound
└── features/
    ├── auth/      store (atoms jotai), service, RequireAuth, LoginPage
    ├── items/     catalogue, détail, ItemList
    ├── basket/    panier, store du compteur
    ├── admin/     création d'article, stock faible, utilisateurs, commandes
    └── home/      accueil + statistiques
```

Chaque feature suit le même gabarit : `XxxRoutes.jsx`, `index.js`,
`services/Xxx.service.js`, `pages/<kebab-case>/PascalCase.jsx`,
`components/PascalCase/PascalCase.jsx` (+ `.module.css`), `store/index.js`.

## Indices

Le front contient **18 problèmes**. Comme pour le back, chaque indice donne
**ce qu'on observe** et **où chercher** — jamais la solution. Aucun commentaire
`TODO` n'a été laissé dans le code.

Chaque indice est annoté de sa difficulté : facile, moyen ou difficile.

### Boîte à outils

| Ce qu'on veut voir | Outil | Comment |
|---|---|---|
| Warnings React (clés, hooks, props) | Console du navigateur | F12 → *Console* |
| Erreurs de règles des hooks / dépendances | `npm run lint` | `react-hooks/exhaustive-deps` n'apparaît **pas** dans le navigateur |
| Props, state et **atomes jotai** en direct | React DevTools (extension) | onglet *Components* ; `$r` dans la console |
| Combien de rendus, et lesquels coûtent | React DevTools | onglet *Profiler* : *Record*, on interagit, *Stop* |
| Les appels HTTP | DevTools → *Network* | filtrer `Fetch/XHR` ; regarder le **nombre** d'appels, les **en-têtes envoyés** et le **JSON** de réponse, pas seulement le code HTTP |
| Ce que l'API renvoie vraiment | curl / Thunder Client | `curl localhost:8080/api/items \| jq '.[0]'` — comparer les noms de champs avec ceux lus par le front |
| Exécution pas à pas | DevTools → *Sources* | point d'arrêt dans le `.jsx` (source maps Vite actives) ou `debugger;` |
| Ce qui est stocké côté navigateur | DevTools → *Application* | *Local Storage* → `shop-token` ; coller le token dans [jwt.io](https://jwt.io) |
| Le DOM produit | DevTools → *Elements* | vérifier les `class` réellement appliquées (CSS modules = noms hashés) |

Deux réflexes propres à cette stack :

- **`use(promise)` + `Suspense`** : une promesse recréée à chaque rendu relance
  la requête et fait clignoter le `fallback`. La promesse doit être stable
  (`useState(() => …)`, `useMemo`, ou créée dans un composant qui ne re-rend pas).
- **Un état global jotai n'est pas persistant** : un atome repart de sa valeur
  initiale à chaque rechargement de page, contrairement au `localStorage`.

### Authentification et session

1. **On se connecte, l'interface passe en « connecté », mais le panier et l'administration répondent 401. Après un F5, ces mêmes appels passent.** *(moyen)*
   - *Reproduire* : se connecter avec `admin` / `password`, aller sur *Panier*. Onglet *Network* : regarder l'en-tête `Authorization` **réellement envoyé**.
   - *Où chercher* : `src/shared/services/Api.service.js`. Quand le corps d'un module ES est-il exécuté, et combien de fois ? Comparez avec le moment où le token arrive dans le `localStorage`.
   - *Bonus* : même question après *Se déconnecter* — que continue-t-on d'envoyer au serveur ?

2. **Avec un mot de passe faux, l'application considère qu'on est connecté.** *(moyen)*
   - *Reproduire* : se connecter avec `admin` / `nimportequoi`. *Network* : quel **code HTTP** pour `login`, et que contient le corps de la réponse ?
   - *Où chercher* : l'action de `src/features/auth/pages/login/LoginPage.jsx`, et `app/controllers/user_controller.py` côté back. Que teste-t-on exactement avant d'enregistrer le token ? Regardez ensuite ce qui atterrit dans *Application* → *Local Storage*.

3. **Après ce mot de passe raté, l'application ne démarre plus : page blanche, même après redémarrage du serveur de dev.** *(difficile)*
   - *Reproduire* : enchaîner sur le point 2, puis recharger. `InvalidCharacterError` dans la console. Vider le *Local Storage* « répare » tout — jusqu'à la prochaine fois.
   - *Où chercher* : `src/shared/utils/token.js` et **qui l'appelle au tout premier rendu** (`src/features/auth/store/index.js` : la valeur initiale d'un atome est calculée à l'import du module). Ce qui vient du `localStorage` est une entrée non fiable : que valent `atob("undefined")` et `JSON.parse(undefined)` dans la console ?

4. **Après un F5, la navbar affiche toujours mon nom et le lien *Administration*, mais cliquer sur *Panier* renvoie à l'écran de connexion.** *(moyen)*
   - *Reproduire* : se connecter, recharger la page, comparer la navbar et le comportement de `/basket`. React DevTools : regardez les deux atomes de `features/auth/store`.
   - *Où chercher* : `src/features/auth/store/index.js`. L'un des deux atomes est réhydraté depuis le `localStorage`, l'autre non — et `src/features/auth/components/RequireAuth.jsx` ne regarde que celui-là.

### React 19 : `use`, `Suspense`, `ErrorBoundary`

5. **Chaque lettre tapée dans la recherche du catalogue relance un appel `GET /api/items` et fait clignoter l'écran de chargement.** *(difficile)*
   - *Reproduire* : *Network* filtré sur `Fetch/XHR`, taper `chair` dans la recherche : cinq requêtes.
   - *Où chercher* : `src/features/items/pages/item-catalog/ItemCatalog.jsx`. Où la promesse est-elle créée, et que se passe-t-il à chaque rendu du composant qui porte le state de recherche ? Comparez avec `AdminPage`, qui fait autrement.

6. **Quand le back est éteint, le catalogue fait disparaître toute l'application (page blanche), alors que le détail d'un article affiche proprement un message.** *(moyen)*
   - *Reproduire* : `docker compose stop app`, puis ouvrir `/items` (page blanche + erreur dans la console) et `/items/1` (message d'erreur affiché).
   - *Où chercher* : comparez les enveloppes de `ItemCatalog.jsx` et de `ItemDetail.jsx`. Une promesse rejetée remonte comme une exception de rendu : qui est censé l'attraper ?

7. **Page *Administration* : changer le seuil de stock ne change jamais la liste.** *(moyen)*
   - *Reproduire* : passer le seuil de 5 à 50. *Network* : **aucune** nouvelle requête `low-stock`. `npm run lint` signale l'endroit exact.
   - *Où chercher* : `src/features/admin/pages/admin/AdminPage.jsx`. Trois `useMemo` côte à côte : deux sont corrects, un ne l'est pas. Que contient son tableau de dépendances ?

8. **Les statistiques de l'accueil se rafraîchissent de plus en plus souvent : après quelques allers-retours entre les pages, `/api/stats` est appelé en rafale.** *(difficile)*
   - *Reproduire* : *Accueil* → *Catalogue* → *Accueil* cinq ou six fois, puis regarder *Network* pendant 30 secondes.
   - *Où chercher* : `src/features/home/components/StatsDisplay/StatsDisplay.jsx`. Que peut rendre la fonction passée à `useEffect`, et qu'en fait React au **démontage** du composant ?

### État global (jotai)

9. **Ajouter un article affiche « Article ajouté au panier », mais le badge du lien *Panier* ne bouge pas.** *(facile)*
   - *Reproduire* : ajouter deux articles, regarder le badge, puis ouvrir *Panier* : le contenu, lui, est correct.
   - *Où chercher* : qui écrit dans `basketCountAtom` (`src/features/basket/store/index.js`) ? Cherchez les `useAtom` de cet atome : un seul composant le met à jour, et ce n'est pas celui qui ajoute au panier.

10. **Un `0` s'affiche dans le lien *Panier* tant que le panier est vide.** *(facile)*
    - *Où chercher* : `src/shared/components/navbar/Navbar.jsx`, le badge. Que rend React pour `false`, `null`, `undefined`… et pour `0` ?

### Intégration avec l'API

11. **La colonne *Stock* est vide, dans le catalogue comme sur la fiche d'un article.** *(facile)*
    - *Reproduire* : `curl localhost:8080/api/items | jq '.[0]'`, comparer champ par champ.
    - *Où chercher* : `src/features/items/components/ItemList/ItemList.jsx`, `ItemDetail.jsx`, et `app/dtos/item_dto.py`. Le DTO ne nomme pas ce champ comme la colonne en base ; en JS, lire une propriété absente ne lève **aucune** erreur.

12. **Créer un article depuis l'administration ne crée rien.** *(moyen)*
    - *Reproduire* : remplir le formulaire, valider. *Network* : `items/add` répond **200**, mais le corps n'est pas un article — il nomme le champ fautif.
    - *Où chercher* : les clés envoyées par `src/features/admin/components/ItemForm/ItemForm.jsx` face à `app/forms/item/item_form.py`.

13. **… et pourtant le formulaire annonce « Article créé ».** *(moyen)*
    - *Où chercher* : l'action de `ItemForm.jsx`. Une réponse 200 n'est pas un succès : que faudrait-il inspecter avant de l'annoncer ? (Voir le point 23 du README du back : c'est la conséquence directe d'une API qui répond 200 à tout.)

14. **Retirer une ligne du panier supprime le mauvais article — et parfois renvoie une 500.** *(moyen)*
    - *Reproduire* : panier de trois articles, retirer celui du milieu. *Network* : regardez l'URL du `DELETE` et comparez-la aux `itemid` du panier.
    - *Où chercher* : `src/features/basket/components/BasketTable/BasketTable.jsx`, ce qui est passé à `onRemove`, et ce qu'en fait `BasketPage.jsx`. **Indice de tableau** ≠ **identifiant métier**.

### Rendu / JSX

15. **Dans le catalogue, la quantité saisie « saute » sur un autre article dès qu'on filtre.** *(difficile)*
    - *Reproduire* : taper `3` dans la quantité du premier article, puis écrire dans la recherche : le `3` est sur une autre ligne. React DevTools montre le state de chaque ligne.
    - *Où chercher* : `ItemList.jsx`. Chaque ligne a son propre state (`quantity`) ; sur quoi React s'appuie-t-il pour décider de le conserver ou de le jeter ?

16. **La recherche ne trouve rien si on tape en minuscules.** *(facile)*
    - *Reproduire* : chercher `blue` (0 résultat) puis `Blue`.
    - *Où chercher* : le `filter` de `ItemCatalog.jsx`.

17. **Le total du panier affiche des prix à 15 décimales (`19.900000000000002 €`).** *(moyen)*
    - *Où chercher* : `BasketTable.jsx`. Deux questions : d'où vient ce total (l'API en renvoie déjà un dans le JSON de `/api/basket`), et combien font `0.1 + 0.2` en JS ? Voir le point 19 du README du back : le problème existe des deux côtés.

18. **La console crache un warning sur la liste des utilisateurs.** *(facile)*
    - *Où chercher* : `src/features/admin/components/UserList/UserList.jsx`. Le message donne la solution ; la vraie question est *pourquoi* React en a besoin — le point 15 en est l'illustration.

# Start project

```shell
docker compose up -d
```

```shell
python -m venv .venv
```
Sous linux
```shell
source .venv/bin/activate
```

sous windows
```shell
.venv/bin/Activate.ps1
```

```shell
pip install -r requirements.txt
```

```shell
flask db init
flask db upgrade
```

```shell
python seed.py
```

Lancer le server via le debugger vscode/pycharm/...

Le front React (Vite + React 19) est le service `front` du même `docker compose` :
il se lance sur http://localhost:5173 (`docker compose logs -f front` pour suivre
le premier démarrage, qui construit l'image). Ses propres bugs sont documentés
dans [front/README.md](front/README.md).

## Routes

| Méthode | Route | Query params | Droits | Form |
|---|---|---|---|---|
| GET | `/` | | | |
| POST | `/api/login` | | | [UserLoginForm](app/forms/user/user_login_form.py) |
| GET | `/api/users` | | USER | |
| GET | `/api/users/<userid>` | | USER | |
| POST | `/api/users/register` | | | [UserRegisterForm](app/forms/user/user_register_form.py) |
| PUT | `/api/users/<userid>` | | ADMIN ou soi-même | [UserUpdateForm](app/forms/user/user_update_form.py) |
| GET | `/api/items` | | | |
| GET | `/api/items/<itemid>` | | | |
| GET | `/api/items/search` | `q` | | |
| GET | `/api/items/low-stock` | `threshold` | | |
| POST | `/api/items/add` | | ADMIN | [ItemForm](app/forms/item/item_form.py) |
| PUT | `/api/items/<itemid>` | | ADMIN | [ItemForm](app/forms/item/item_form.py) |
| GET | `/api/basket` | | USER | |
| PUT | `/api/basket/` | | USER | [BasketAddItemForm](app/forms/basket/basket_add_item_form.py) |
| DELETE | `/api/basket/<itemid>` | | USER | |
| POST | `/api/basket/checkout` | | USER | |
| GET | `/api/basket/all` | | ADMIN | |
| GET | `/api/basket/report` | | ADMIN | |
| GET | `/api/stats` | | | |

## Indices

Le projet contient **25 problèmes** répartis en 4 familles. Chaque indice donne
**ce qu'on observe** et **où chercher** — jamais la solution. Aucun commentaire
`TODO` n'a été laissé dans le code : c'est au debugger et au profiler de parler.

Chaque indice est annoté de sa difficulté : facile, moyen ou difficile.

### Boîte à outils

| Ce qu'on veut voir | Outil | Comment |
|---|---|---|
| Nombre / contenu des requêtes SQL | Flask Debug Toolbar (panneau *SQLAlchemy*) | appeler la route **depuis le navigateur** (la toolbar s'injecte dans le HTML) |
| Temps CPU | `cProfile` / `py-spy` | `python -m cProfile -s cumtime runserver.py`, ou `py-spy top --pid <pid>` sur le serveur qui tourne |
| Mémoire | `tracemalloc`, `objgraph` | snapshot avant / après une série de requêtes |
| Logique métier | points d'arrêt (dont **conditionnels**) PyCharm/VSCode | + fenêtre *Evaluate expression* pour tester `id(x)`, `x is y`, `len(...)` |
| Réponses de l'API | curl / Postman / Thunder Client | lire le **JSON brut**, pas seulement le code HTTP |
| Contenu d'un JWT | [jwt.io](https://jwt.io) | ou `jwt.decode(token, options={"verify_signature": False})` |

Le jeu de données de `seed.py` (~300 utilisateurs, 200 articles, ~600 paniers)
est volumineux exprès : les problèmes de perf doivent être **flagrants**.

### Performance

1. **`GET /api/users` est lent, et le nombre de requêtes SQL grandit avec le nombre d'utilisateurs.**
   - *Reproduire* : ouvrir la route dans le navigateur, regarder le compteur de requêtes de la Debug Toolbar. Refaire avec plus / moins d'utilisateurs en base.
   - *Où chercher* : la requête de `app/services/user_service.py` a l'air inoffensive. Regardez plutôt ce que la **boucle du DTO** (`app/dtos/user_dto.py`) va chercher dans `user.roles` puis `role.rel_role`. Mots-clés : *lazy loading*, *N+1*.

2. **`GET /api/basket/all` est l'endpoint le plus lent de l'API : le compteur de requêtes explose.**
   - *Reproduire* : Debug Toolbar sur la route (rôle ADMIN requis). Comptez les requêtes, puis divisez par le nombre de paniers.
   - *Où chercher* : `app/services/basket_service.py, find_all` + `app/dtos/basket_dto.py`. Listez **toutes** les relations traversées pour un seul panier (`basket.user`, les rôles de ce user, `basket.items`, puis l'article de chaque ligne) — et notez que `Basket.total()` refait le parcours une deuxième fois.

3. **`GET /api/basket/report` interroge la base dans une boucle.**
   - *Reproduire* : Debug Toolbar : une requête `users` par panier fermé. Ou point d'arrêt dans la boucle + compter les passages.
   - *Où chercher* : `app/services/basket_service.py, order_report`. Ici le N+1 n'est **pas** un lazy-load implicite : il est écrit en toutes lettres dans le code. Question à se poser : ce total, faut-il le calculer en Python ou le demander au SGBD ?

4. **Même après avoir réglé le point 1, `GET /api/users` reste lent — alors qu'il ne fait plus que 2-3 requêtes SQL.**
   - *Reproduire* : la Debug Toolbar ne montre plus rien d'anormal, donc changez d'outil, passez au **profiler CPU** (`cProfile -s cumtime`, ou `py-spy`). Regardez la fonction qui domine le temps cumulé et son nombre d'appels.
   - *Où chercher* : la sérialisation des DTO, `app/dtos/user_dto.py, get_json_parsable`. Que coûte l'opération faite en première ligne, et est-elle vraiment nécessaire pour produire un `dict` ?

5. **`GET /api/items/low-stock?threshold=...` transfère toute la table pour ne renvoyer que quelques lignes.**
   - *Reproduire* : Debug Toolbar : une seule requête, mais un `SELECT` **sans `WHERE`** et beaucoup de lignes lues.
   - *Où chercher* : `app/services/item_service.py, find_low_stock`. Où est fait le filtre : en Python ou en SQL ?

6. **`GET /api/stats` charge tout pour ne renvoyer que deux nombres.**
   - *Reproduire* : Debug Toolbar : `SELECT *` complets là où un `SELECT count(*)` suffirait.
   - *Où chercher* : les méthodes `count` de `app/services/user_service.py` et `item_service.py`. Regardez précisément l'expression Python utilisée pour compter.

7. **Mettre à jour les rôles d'un utilisateur (`PUT /api/users/<id>`) refait sans arrêt le même travail.**
   - *Reproduire* : point d'arrêt dans `User.get_roles` et comptez le nombre d'appels pour **une seule** mise à jour multi-rôles ; ou profilez la route.
   - *Où chercher* : `app/models/user.py, add_role`. Quelle est la complexité si on ajoute *n* rôles, et que déclenche chaque appel côté SQL ?

### Sécurité et données sensibles

8. **L'API renvoie un champ qui ne devrait jamais quitter la couche service.**
   - *Reproduire* : lire le JSON brut de `GET /api/users` et `GET /api/users/<id>`.
   - *Où chercher* : `app/dtos/user_dto.py` — comparez la liste des attributs du DTO avec ce que le client a réellement besoin de connaître.

9. **Le JWT de connexion contient beaucoup trop d'informations.**
   - *Reproduire* : se connecter via `POST /api/login`, coller le token dans jwt.io. Un JWT est **signé, pas chiffré** : le payload est du base64 lisible par quiconque.
   - *Où chercher* : `app/controllers/user_controller.py, login`. Quel est le strict minimum dont le décorateur d'auth a besoin ?

10. **N'importe quel utilisateur connecté peut lire le profil de n'importe quel autre.**
    - *Reproduire* : se connecter avec un compte `USER` simple, puis appeler `GET /api/users/<id d'un autre compte>`, et vous obtenez 200 avec toutes ses données.
    - *Où chercher* : comparez les décorateurs du `GET` et du `PUT` dans `app/controllers/user_controller.py`. Acronyme à retenir : **IDOR**.

11. **La recherche d'articles n'est pas sûre.**
    - *Reproduire* : `GET /api/items/search?q=%25' OR '1'='1` — combien d'articles reviennent ?
    - *Où chercher* : `app/services/item_service.py, search`. Mettez un point d'arrêt et **lisez la requête SQL réellement construite**. La question clé : la valeur fournie par l'utilisateur est-elle concaténée ou passée en paramètre ?

12. **La configuration de « prod » est celle d'un poste de dev.**
    - *Reproduire* : provoquer une 500 (cf. points 22 et 23) et regarder la page d'erreur ; tenter de forger un token avec la clé du `.env`.
    - *Où chercher* : `.env` et `app/__init__.py`. Trois choses à examiner : la valeur de la clé de signature, dans quelles conditions la Debug Toolbar est montée, et **le type** de ce que renvoie `os.environ.get("DEBUG")` (indice : `bool("False")`).

13. **Le navigateur accepte des requêtes venant de n'importe où.**
    - *Où chercher* : `CORS_ORIGIN` dans `.env` et son usage dans `app/__init__.py`. Pourquoi est-ce particulièrement grave quand les requêtes sont authentifiées ?

14. **Un token peut être transmis ailleurs que dans un en-tête.**
    - *Où chercher* : `app/framework/decorators/auth_required.py`, la partie qui détermine d'où vient `token`. Pensez à tout ce qui enregistre une URL complète : logs serveur, historique du navigateur, en-tête `Referer`.

### Logique métier

15. **Des rôles « fuient » d'un utilisateur à l'autre, et une liste grossit indéfiniment au fil des requêtes.**
    - *Reproduire* : point d'arrêt dans `UserUpdateForm`/`UserMapper` au moment du `.append(...)`, puis évaluez `id(...)` de cette liste sur **deux utilisateurs différents**. Même id ?
    - *Où chercher* : `app/models/user.py`, les attributs déclarés dans le corps de la classe. Différence entre attribut **de classe** et attribut **d'instance**.

16. **Une condition censée tester « la liste n'est pas vide » est toujours vraie.**
    - *Reproduire* : point d'arrêt sur la condition, puis évaluez-la avec une liste **vide**. Testez aussi `[] is not []` dans la console du debugger.
    - *Où chercher* : `app/mappers/user_mapper.py` et `app/services/user_service.py, update`. `is` compare des **identités d'objet**, pas des valeurs.

17. **Ajouter deux fois le même article au panier ne cumule pas les quantités.**
    - *Reproduire* : `PUT /api/basket/` deux fois avec le même `itemid` et `itemquantity=1`, puis `GET /api/basket`.
    - *Où chercher* : `app/models/basket.py, add_item`, la ligne qui affecte la quantité — elle est exécutée dans les deux cas (article déjà présent ou non).

18. **On peut commander plus que le stock disponible, et le stock ne bouge jamais.**
    - *Reproduire* : ajouter une quantité supérieure à `itemstock`, faire `POST /api/basket/checkout`, puis relire `GET /api/items/<id>`.
    - *Où chercher* : `app/services/basket_service.py, checkout_basket` (et `add_item`). Cherchez ce qui **manque** : une validation, une décrémentation, et le tout dans une seule transaction.

19. **Le total d'un panier est faux au centime près.**
    - *Reproduire* : point d'arrêt dans `Basket.total` sur un panier bien choisi, comparez à la somme exacte. Dans la console : `0.1 + 0.2`.
    - *Où chercher* : le type de colonne du prix dans `app/models/item.py` et l'accumulateur de `app/models/basket.py, total`. Comment représente-t-on de l'argent ?

20. **Un article « supprimé » continue d'apparaître, alors que les utilisateurs supprimés, eux, disparaissent bien.**
    - *Reproduire* : passer un article à `active = False` directement en base, puis `GET /api/items`, `/search`, `/low-stock`.
    - *Où chercher* : comparez `UserService.find_all` et `ItemService.find_all`. Que prévoit `app/models/base_entity.py` et qui s'en sert vraiment ?

### Robustesse

21. **Demander un id inexistant renvoie une 500 au lieu d'une 404.**
    - *Reproduire* : `GET /api/items/999999`, lire la stack (`sqlalchemy.exc.NoResultFound`). Combiné au point 12, la page d'erreur offre un shell au visiteur.
    - *Où chercher* : `app/services/item_service.py` et `basket_service.py` — la méthode de `Query` utilisée pour récupérer une ligne unique. Quelles sont les différences entre `.one()`, `.one_or_none()` et `.first()` ?

22. **Le même test sur un utilisateur plante, mais avec une erreur d'un tout autre genre.**
    - *Reproduire* : `GET /api/users/999999`, qui renvoie `AttributeError: 'NoneType' object has no attribute ...`.
    - *Où chercher* : `app/services/user_service.py, find_one` — que vaut le résultat, et que fait le mapper quand on lui passe cette valeur ? Et côté contrôleur, qui est censé transformer « rien trouvé » en 404 ?

23. **Une écriture qui échoue ne remonte aucune erreur : « ça marche à moitié ».**
    - *Reproduire* : créer deux articles portant le même nom (contrainte d'unicité) : aucune erreur HTTP claire, juste un message dans la console du serveur.
    - *Où chercher* : les blocs `try/except` de tous les services. Deux problèmes distincts à nommer : la façon dont l'erreur est signalée, et ce que fait le code **juste après** le `rollback` (avec quel id ?).

24. **Supprimer un utilisateur détruit son historique de commandes.**
    - *Reproduire* : regarder les paniers d'un utilisateur avant / après suppression.
    - *Où chercher* : `delete` dans `user_service.py` / `item_service.py`, les `cascade=` des relations de `app/models/user.py`, et les colonnes que `BaseEntity` prévoyait pour ça. Bonus : la valeur de retour est lue **après** la suppression — est-ce encore possible ?

25. **Sous charge, la mémoire du serveur monte sans redescendre, et les services « scoped » se mélangent entre utilisateurs.**
    - *Reproduire* : appeler l'API uniquement avec `Authorization: Bearer ...` (sans cookie de session) et surveiller la taille du dictionnaire de scope au fil des requêtes (debugger, `tracemalloc` ou `objgraph`).
    - *Où chercher* : `app/framework/injector.py`. Deux questions : que renvoie `__get_session_id` quand il n'y a **aucun** cookie `session` (et que se passe-t-il alors pour deux requêtes anonymes simultanées ?), et une entrée du dictionnaire est-elle un jour **supprimée** ?

Vieux script d'injection de token dans postman : 

```js
const loginUrl = 'http://localhost:8008/api/login'


const getTokenRequest =
{
   method: 'POST',
   url: loginUrl,
   header: 'Content-Type:application/json',
   body:
   {
       mode: 'application/json',
       raw: JSON.stringify({
               username: "bstorm",
               password: "mm1234"
           })
   }
};


console.log(pm.collectionVariables.get('access_token'));
console.log(pm.collectionVariables.get('token_exp'));
console.log((Date.now() / 1000) > pm.collectionVariables.get('token_exp'))


if((Date.now() / 1000) > pm.collectionVariables.get('token_exp') ||
   !pm.collectionVariables.get('access_token'))
{
   console.log("No token or token expired.");
   pm.sendRequest(getTokenRequest, (err, res) =>
   {
       if(err === null)
       {
           var resJSON = res.json();
           token = resJSON.token
           console.log(token)
           pm.collectionVariables.set('access_token', token);
           console.log(pm.collectionVariables.get('access_token'));
           parsed = jwsDecode(token, null);
          
           exp = parsed.payload.exp;
           console.log(exp);
           pm.collectionVariables.set('token_exp', exp);
       }
   });
} else
{
   console.log("Token is still valid!")
}


/**
* JWS TOKEN!
*/


const JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;


function padString(input) {
   let segmentLength = 4;
   let stringLength = input.length;
   let diff = stringLength % segmentLength;


   if (!diff) {
       return input;
   }


   let position = stringLength;
   let padLength = segmentLength - diff;
   let paddedStringLength = stringLength + padLength;
   let buffer = new Buffer(paddedStringLength);


   buffer.write(input);


   while (padLength--) {
       buffer.write("=", position++);
   }


   return buffer.toString();
}


function decode(base64url, encoding = "utf8") {
   return new Buffer(toBase64(base64url), "base64").toString(encoding);
}


function toBase64(base64url) {
   base64url = base64url.toString();
   return padString(base64url)
       .replace(/\-/g, "+")
       .replace(/_/g, "/");
}


function isObject(thing) {
   return Object.prototype.toString.call(thing) === '[object Object]';
}


function safeJsonParse(thing) {
   if (isObject(thing))
       return thing;
   try { return JSON.parse(thing); } catch (e) { return undefined; }
}


function headerFromJWS(jwsSig) {
   var encodedHeader = jwsSig.split('.', 1)[0];
   return safeJsonParse(decode(encodedHeader, 'binary'));
}


function isValidJws(string) {
   return JWS_REGEX.test(string) && !!headerFromJWS(string);
}


function payloadFromJWS(jwsSig, encoding) {
   encoding = encoding || 'utf8';
   var payload = jwsSig.split('.')[1];
   return decode(payload, encoding);
}


function signatureFromJWS(jwsSig) {
   return jwsSig.split('.')[2];
}


function jwsDecode(jwsSig, opts) {
  
   opts = opts || {};


   if (!isValidJws(jwsSig))
       return null;


   var header = headerFromJWS(jwsSig);


   if (!header)
       return null;


   var payload = payloadFromJWS(jwsSig);
   if (header.typ === 'JWT' || opts.json)
       payload = JSON.parse(payload, opts.encoding);


   return {
       header: header,
       payload: payload,
       signature: signatureFromJWS(jwsSig)
   };
}


function isTokenExpired(exp) {
   try {
       return ((Date.now() / 1000) > exp);
   } catch (error) {
       return true;
   }
}

```

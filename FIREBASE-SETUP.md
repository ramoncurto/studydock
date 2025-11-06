# Guia de Configuració de Firebase

Aquesta guia t'ajudarà a configurar Firebase per a l'aplicació StudyDock.

## Prerequisits

Ja tens un projecte Firebase creat a: https://console.firebase.google.com/project/nuriaopos-2ac5a

## Pas 1: Habilitar Firestore Database

1. Ves a la teva Consola de Firebase: https://console.firebase.google.com/project/nuriaopos-2ac5a
2. Fes clic a "Firestore Database" a la barra lateral esquerra
3. Fes clic a "Create database"
4. Tria "Start in production mode" (configurarem les regles de seguretat més endavant)
5. Selecciona la teva ubicació preferida (tria la més propera als teus usuaris, p. ex., `europe-west` per a Europa)
6. Fes clic a "Enable"

## Pas 2: Obtenir la Configuració de Firebase

1. A la Consola de Firebase, fes clic a la icona d'engranatge (⚙️) al costat de "Project Overview"
2. Fes clic a "Project settings"
3. Desplaça't cap avall fins a la secció "Your apps"
4. Si encara no tens una aplicació web:
   - Fes clic a la icona web (`</>`) per afegir una aplicació web
   - Dona-li un àlies (p. ex., "StudyDock Web")
   - Fes clic a "Register app"
5. Copia els valors de configuració mostrats a l'objecte `firebaseConfig`

## Pas 3: Configurar Variables d'Entorn

1. Obre l'arxiu `.env.local` a l'arrel del teu projecte
2. Substitueix els valors placeholder amb la teva configuració real de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=la_teva_api_key_real
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nuriaopos-2ac5a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nuriaopos-2ac5a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nuriaopos-2ac5a.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=el_teu_sender_id_real
NEXT_PUBLIC_FIREBASE_APP_ID=el_teu_app_id_real
```

**Important:** L'arxiu `.env.local` ja està al `.gitignore` i no es commitarà al control de versions.

## Pas 4: Configurar Regles de Seguretat de Firestore

1. Ves a Firestore Database a la Consola de Firebase
2. Fes clic a la pestanya "Rules"
3. Substitueix les regles per defecte amb aquestes (per a desenvolupament):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permetre accés de lectura/escriptura a la col·lecció notes
    match /notes/{document=**} {
      allow read, write: if true;
    }

    // Permetre accés de lectura/escriptura a la col·lecció tests
    match /tests/{document=**} {
      allow read, write: if true;
    }

    // Permetre accés de lectura/escriptura a la col·lecció noteSessions
    match /noteSessions/{document=**} {
      allow read, write: if true;
    }

    // Permetre accés de lectura/escriptura a la col·lecció testAttempts
    match /testAttempts/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Nota:** Aquestes regles permeten a qualsevol persona llegir/escriure dades. Per a producció, hauries d'implementar autenticació adequada i regles més restrictives.

4. Fes clic a "Publish"

## Pas 5: Configurar Índexs de Firestore

L'aplicació utilitza consultes compostes que requereixen índexs personalitzats. Els índexs necessaris estan definits a `firestore.indexes.json`.

### Opció 1: Desplegar índexs automàticament (Recomanat)

1. Instal·la Firebase CLI si no ho has fet:
```bash
npm install -g firebase-tools
```

2. Autentica't amb Firebase:
```bash
firebase login
```

3. Inicialitza Firebase al teu projecte (només la primera vegada):
```bash
firebase init firestore
```
- Selecciona el teu projecte existent
- Accepta els arxius per defecte de regles i índexs

4. Desplega els índexs:
```bash
firebase deploy --only firestore:indexes
```

### Opció 2: Crear índexs manualment

Si veus errors de "query requires an index" a la consola:
1. Fes clic a l'enllaç proporcionat a l'error (et portarà a la consola de Firebase)
2. Revisa la configuració de l'índex i fes clic a "Create Index"
3. Espera que l'índex es construeixi (pot trigar uns minuts)

**Índex necessari per a invitacions:**
- Col·lecció: `invitations`
- Camps:
  - `ownerId` (Ascending)
  - `createdAt` (Descending)

## Pas 6: Provar la Integració

1. Reinicia el teu servidor de desenvolupament:
```bash
npm run dev
```

2. Obre http://localhost:3000
3. Hauries de veure una pantalla de càrrega breument, després la pantalla d'inici
4. Prova de pujar un arxiu d'apunts o test - ara hauria de desar-se a Firebase
5. Comprova la teva Firestore Database a la Consola de Firebase per veure les dades

## Estructura de la Base de Dades

L'aplicació utilitza quatre col·leccions a Firestore:

### Col·lecció `notes`
Cada document conté:
- `title` (string): El nom de l'arxiu de l'apunt
- `content` (string): El contingut de text complet de l'apunt
- `createdAt` (timestamp): Quan es va crear l'apunt

### Col·lecció `tests`
Cada document conté:
- `title` (string): El nom de l'arxiu del test
- `questions` (array): Array d'objectes de pregunta amb:
  - `question` (string): El text de la pregunta
  - `options` (array de strings): Les opcions de resposta
  - `correct` (string): La resposta correcta
- `createdAt` (timestamp): Quan es va crear el test

### Col·lecció `noteSessions`
Cada document conté:
- `noteTitle` (string): El títol de l'apunt llegit
- `timestamp` (timestamp): Quan es va fer la sessió de lectura
- `date` (string): Data formatada de la sessió
- `time` (string): Hora formatada de la sessió
- `duration` (number): Durada de la sessió en segons

### Col·lecció `testAttempts`
Cada document conté:
- `testTitle` (string): El títol del test realitzat
- `timestamp` (timestamp): Quan es va fer l'intent
- `date` (string): Data formatada de l'intent
- `score` (number): Número de respostes correctes
- `totalQuestions` (number): Total de preguntes del test
- `percentage` (number): Percentatge d'encert

## Desplegament a Vercel

Quan despleguis a Vercel:

1. Ves a la configuració del teu projecte Vercel
2. Navega a "Environment Variables"
3. Afegeix totes les variables `NEXT_PUBLIC_FIREBASE_*` amb els seus valors
4. Torna a desplegar la teva aplicació

## Consideracions de Seguretat per a Producció

Abans de posar-ho en marxa amb usuaris reals, hauries de:

1. **Habilitar Firebase Authentication** i requerir que els usuaris iniciïn sessió
2. **Actualitzar les Regles de Seguretat de Firestore** per restringir l'accés:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Només usuaris autenticats poden llegir/escriure les seves pròpies dades
    match /notes/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /tests/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /noteSessions/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /testAttempts/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **Implementar emmagatzematge de dades específic per usuari** organitzant documents sota IDs d'usuari
4. **Configurar Firebase App Check** per prevenir abusos
5. **Monitoritzar l'ús** a la Consola de Firebase per detectar qualsevol activitat inusual

## Resolució de Problemes

### "Firebase: Error (auth/api-key-not-valid)"
- Comprova que la teva clau API a `.env.local` és correcta
- Assegura't que no hi ha espais extra o cometes als valors

### "Missing or insufficient permissions"
- Comprova les teves Regles de Seguretat de Firestore
- Assegura't que has publicat les regles després d'editar-les

### Les dades no es carreguen
- Comprova la consola del navegador per errors
- Verifica que Firestore està habilitat al teu projecte Firebase
- Assegura't que les teves variables d'entorn estan carregades (reinicia el servidor dev després de canviar `.env.local`)

### Els canvis no es reflecteixen
- Reinicia el teu servidor de desenvolupament després de modificar `.env.local`
- Neteja la memòria cau del navegador i recarrega

## Passos Següents

Després de configurar Firebase, pots:
- Pujar apunts i tests a través de la interfície de l'aplicació
- Veure les teves dades a la Consola de Firebase
- Compartir l'aplicació amb altres (recorda assegurar-la primer!)
- Configurar Firebase Hosting si no vols usar Vercel

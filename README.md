# StudyDock - App d'Estudi per a Oposicions

Aplicació web per gestionar apunts i tests d'estudi amb format automàtic i funcionalitat d'audiollibre.

## Característiques

- 📝 **Gestió d'Apunts**: Puja arxius `.txt` o `.json` amb format automàtic
- 🎨 **Format JSON Avançat**: Suport per a fórmules, definicions, destacats i exemples
- ✅ **Tests Interactius**: Crea i realitza tests amb seguiment de resultats
- 🔊 **Audiollibre**: Conversió de text a veu en català per estudiar escoltant
- 📊 **Estadístiques**: Seguiment del temps d'estudi i rendiment en tests
- 🌓 **Tema Fosc/Clar**: Canvia entre temes amb persistència en localStorage
- 📱 **Disseny Responsive**: Optimitzat per a dispositius mòbils i escriptori
- ☁️ **Integració Firebase**: Totes les dades es guarden a Firebase Firestore

## Format d'Arxius

### Apunts - Format de Text (.txt)

Format simple amb detecció automàtica:

- **MAJÚSCULES COMPLETES** → Títol principal (h1)
- **# 1. Secció** o **1. Secció** → Subtítol (h2)
- **Text amb:** → Subtítol de secció (h3)
- **- Item** o **\* Item** → Llistes amb vinyetes
- **\*\*text\*\*** o **\_\_text\_\_** → Text en negreta

### Apunts - Format JSON (.txt o .json)

Format avançat amb característiques riques:

- **Metadata**: Assignatura, tema, dificultat, temps estimat, paraules clau
- **Fórmules**: Equacions matemàtiques/químiques amb format especial
- **Definicions**: Termes amb explicacions detallades
- **Destacats**: Conceptes importants amb diferents nivells d'importància
- **Exemples**: Casos pràctics amb renderització especial
- **Subseccions**: Organització jeràrquica del contingut

**Veure**: [GUIA-FORMAT-JSON.md](GUIA-FORMAT-JSON.md) per a documentació completa i exemples.

### Tests (.txt)

Format específic per a tests:

```
Q: Pregunta aquí?
- Opció 1
- Opció 2
- Opció 3
- Opció 4
A: Resposta correcta
```

## Desenvolupament

### Requisits

- Node.js 18+
- npm

### Instal·lació

```bash
npm install
```

### Configuració de Firebase

Abans d'executar l'aplicació, necessites configurar Firebase. Segueix les instruccions detallades a [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

Resum ràpid:
1. Habilita Firestore Database al teu projecte Firebase
2. Copia les credencials de configuració
3. Crea un arxiu `.env.local` amb les teves credencials de Firebase
4. Configura les regles de seguretat de Firestore

### Desenvolupament local

```bash
npm run dev
```

Obre [http://localhost:3000](http://localhost:3000) al teu navegador.

### Build de producció

```bash
npm run build
npm start
```

## Desplegament a Vercel

Aquesta aplicació està optimitzada per a Vercel:

1. Connecta el teu repositori a Vercel
2. Vercel detectarà automàticament Next.js
3. **Important**: Afegeix les variables d'entorn de Firebase a la configuració de Vercel:
   - Ves a Project Settings > Environment Variables
   - Afegeix totes les variables `NEXT_PUBLIC_FIREBASE_*` del teu `.env.local`
4. Fes push a la teva branca principal per desplegar

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/nuria-opos)

## Estructura del Projecte

```
nuria_opos/
├── app/
│   ├── layout.tsx          # Layout principal amb metadata
│   ├── page.tsx            # Pàgina principal amb l'aplicació
│   └── globals.css         # Estils globals amb Tailwind
├── lib/
│   ├── firebase.ts         # Configuració de Firebase
│   └── firebaseService.ts  # Funcions CRUD per a Firestore
├── public/                 # Arxius estàtics (si n'hi ha)
├── exemple-*.txt           # Arxius d'exemple
├── GUIA-FORMATO.md        # Guia d'usuari en català
├── FIREBASE-SETUP.md      # Guia de configuració de Firebase
├── CLAUDE.md              # Guia per a desenvolupament
├── .env.local             # Variables d'entorn (no es puja a Git)
└── package.json           # Dependències del projecte
```

## Tecnologies

- **Next.js 15** - Framework React
- **React 18** - Llibreria UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estils
- **Lucide React** - Icones
- **Web Speech API** - Text-to-speech
- **Firebase Firestore** - Base de dades en temps real

## Llicència

Ús educatiu i personal.

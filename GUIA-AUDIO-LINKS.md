# Guia per Afegir Enllaços d'Àudio

Aquesta aplicació ara funciona amb **enllaços directes** als teus arxius d'àudio, sense necessitat del pla de pagament de Firebase Storage.

## 🎯 Com Funciona

En lloc de pujar arxius, ara enganxes l'URL del teu arxiu d'àudio allotjat en qualsevol servei gratuït.

## 📁 Opcions d'Allotjament Gratuït

**⭐ Millor opció: Dropbox** - Funciona millor amb reproducció directa d'àudio
**✅ També funciona: OneDrive, GitHub, servidor propi**
**⚠️ Pot donar problemes: Google Drive** - Té limitacions de CORS

### 1. Dropbox (Més Recomanat per Àudio)

**Pas 1: Puja l'arxiu a Dropbox**

**Pas 2: Obtén l'enllaç**
1. Fes clic a "Compartir" → "Crear enllaç"
2. Copia l'enllaç (serà similar a: `https://www.dropbox.com/...?dl=0`)

**Pas 3: Modifica l'enllaç**
- Canvia `?dl=0` per `?dl=1` al final de l'URL
- Exemple: `https://www.dropbox.com/s/abc123/audio.m4a?dl=1`

### 2. Google Drive ⚠️ NO RECOMANAT

**⚠️ IMPORTANT: Google Drive té limitacions de CORS (Cross-Origin Resource Sharing) que impedeixen la reproducció directa d'àudio en navegadors web. Encara que puguis compartir l'arxiu i obtenir un enllaç, NO funcionarà per a reproducció d'àudio.**

**Per què no funciona Google Drive?**
- Google Drive bloqueja les peticions de reproducció d'àudio des de llocs web externs per raons de seguretat
- Els enllaços de Google Drive requereixen autenticació i redirigeixen a pàgines HTML en lloc de servir l'arxiu directament
- Les polítiques CORS de Google Drive no permeten que navegadors reprodueixin àudio directament

**Si tot i així vols intentar-ho (no garantit):**

**Pas 1:** Puja el teu arxiu M4A a Google Drive

**Pas 2:** Obtén l'enllaç
1. Fes clic dret sobre l'arxiu → "Compartir"
2. Canvia els permisos a "Qualsevol persona amb l'enllaç"
3. Copia l'enllaç (serà similar a: `https://drive.google.com/file/d/XXXXXX/view`)

**Pas 3:** L'aplicació convertirà automàticament l'enllaç, però probablement no funcionarà

**⚠️⚠️ SOLUCIÓ: USA DROPBOX EN LLOC DE GOOGLE DRIVE ⚠️⚠️**

### 3. OneDrive

**Pas 1: Puja l'arxiu a OneDrive**

**Pas 2: Comparteix l'arxiu**
1. Fes clic dret → "Compartir"
2. Copia l'enllaç de compartició

**Pas 3: Converteix a enllaç de descàrrega**
- Si l'enllaç és: `https://1drv.ms/u/s!Abc123`
- Afegeix `&download=1` al final

### 4. Altres Opcions

- **GitHub**: Si tens un repositori públic, puja l'arxiu i usa l'URL "raw"
- **Servidor propi**: Si tens hosting web, puja-hi l'arxiu
- **Internet Archive**: Gratuït i permanent

## ✅ Com Afegir un Àudio a l'App

1. **Obre l'aplicació** → Clic a "✨ Pujar Contingut"
2. **Clic a "🎧 Afegir Enllaç d'Àudio"**
3. **Enganxa l'URL** del teu arxiu (ja convertida a enllaç directe)
4. **Escriu el nom** de l'àudio (ex: "Tema 2 - Constitució Espanyola")
5. **(Opcional)** Vincula'l a un apunt específic
6. **Fet!** L'àudio es guardarà i podràs escoltar-lo

## 🎧 Exemple Complet amb Google Drive

**Arxiu:** `tema2_constitucion.m4a`

**Enllaç de Google Drive:**
```
https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0/view?usp=sharing
```

**Enllaç directe per l'app:**
```
https://drive.google.com/uc?export=download&id=1a2b3c4d5e6f7g8h9i0
```

## ⚠️ Important

- L'arxiu ha de ser **públic** o **compartit amb enllaç**
- L'enllaç ha de ser de **descàrrega directa**, no de visualització
- Formats suportats: MP3, M4A, WAV, OGG, AAC, etc.
- Els arxius grans poden trigar més a carregar

## 🚀 Avantatges

✅ **Gratuït**: No necessites pagar Firebase Storage
✅ **Il·limitat**: Pots afegir tants àudios com vulguis
✅ **Flexible**: Usa el servei que prefereixis
✅ **Fàcil**: Només copia i enganxa l'enllaç

## 💡 Consells

- **Google Drive** ofereix 15GB gratuïts
- **Dropbox** ofereix 2GB gratuïts (ampliable)
- Organitza els teus àudios en carpetes per temes
- Usa noms descriptius per als arxius

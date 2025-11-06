# 📝 Guia de Format JSON per a Apunts - StudyDock

## 🎯 Per què usar format JSON?

El format JSON ofereix avantatges significatius sobre el format de text pla:

✅ **Estructura rica** - Suporta definicions, fórmules, exemples i destacats
✅ **Metadata** - Inclou informació com assignatura, dificultat i temps estimat
✅ **Renderització especial** - Cada tipus de contingut es mostra de manera única
✅ **Fàcil de generar amb LLMs** - Perfecte per crear apunts amb IA
✅ **Cerca avançada** - (futur) Filtrar per assignatura, dificultat, paraules clau

---

## 📐 Estructura Bàsica

```json
{
  "metadata": {
    "title": "Títol dels apunts",
    "subject": "Assignatura",
    "topic": "Tema específic",
    "keywords": ["paraula1", "paraula2"],
    "difficulty": "bàsic|mitjà|avançat",
    "estimatedTime": "temps estimat"
  },
  "sections": [
    {
      "id": "identificador-unic",
      "title": "Títol de la secció",
      "level": 1,
      "content": [
        /* Elements de contingut aquí */
      ]
    }
  ]
}
```

---

## 🧩 Tipus de Contingut Disponibles

### 1. **Paràgraf** (`paragraph`)
Text normal, explicatiu.

```json
{
  "type": "paragraph",
  "text": "Aquest és un paràgraf de text explicatiu."
}
```

**Renderització**: Text normal amb espaiat adequat.

---

### 2. **Fórmula** (`formula`)
Equacions matemàtiques, químiques o físiques.

```json
{
  "type": "formula",
  "label": "Equació de la fotosíntesi",
  "text": "6 CO₂ + 6 H₂O + llum → C₆H₁₂O₆ + 6 O₂"
}
```

**Renderització**: Caixa destacada amb tipografia monoespaciada, centrada.

---

### 3. **Llista** (`list`)
Elements enumerats sense ordre específic.

```json
{
  "type": "list",
  "title": "Factors importants",
  "items": [
    "Primer element",
    "Segon element",
    "Tercer element"
  ]
}
```

**Renderització**: Llista amb vinyetes personalitzades.

---

### 4. **Definició** (`definition`)
Termes amb explicacions detallades.

```json
{
  "type": "definition",
  "items": [
    {
      "type": "definition",
      "term": "Fotosíntesi",
      "details": [
        "Procés de captura d'energia solar",
        "Converteix CO₂ i H₂O en glucosa",
        "Produeix oxigen com a subproducte"
      ]
    }
  ]
}
```

**Renderització**: Caixa amb barra lateral de color, terme en negreta, detalls amb fletxes.

---

### 5. **Destacat** (`highlight`)
Informació crítica que cal recordar.

```json
{
  "type": "highlight",
  "importance": "high",
  "items": [
    "Concepte molt important número 1",
    "Concepte molt important número 2"
  ]
}
```

**Opcions d'importància**: `high` (groc), `medium` (blau), `low` (blau clar)

**Renderització**: Caixa destacada amb icona 💡 i colors segons importància.

---

### 6. **Exemple** (`example`)
Casos pràctics o exemples aplicats.

```json
{
  "type": "example",
  "label": "Exemple pràctic",
  "text": "Aquí va l'exemple detallat..."
}
```

**Renderització**: Caixa verda amb icona 📝.

---

### 7. **Subsecció** (`subsection`)
Per agrupar definicions o llistes sota un subtítol.

```json
{
  "type": "subsection",
  "title": "Fases del procés",
  "items": [
    {
      "type": "definition",
      "term": "Fase 1",
      "details": ["Detall 1", "Detall 2"]
    },
    "Element de llista simple"
  ]
}
```

**Renderització**: Subtítol seguit dels elements continguts.

---

## 📋 Exemple Complet

Veure l'arxiu `exemple-json-apunts.json` per a un exemple complet i funcional.

---

## 🤖 Prompt per a LLMs

Usa aquest prompt per generar apunts en format JSON:

```
Ets un assistent expert en crear apunts d'estudi estructurats.

TASCA: Crea apunts sobre [TEMA] en format JSON seguint aquesta estructura:

{
  "metadata": {
    "title": "Títol complet",
    "subject": "Nom de l'assignatura",
    "topic": "Tema específic",
    "keywords": ["paraula1", "paraula2", "paraula3"],
    "difficulty": "bàsic|mitjà|avançat",
    "estimatedTime": "XX min"
  },
  "sections": [...]
}

TIPUS DE CONTINGUT DISPONIBLES:
1. paragraph - text explicatiu normal
2. formula - equacions i fórmules
3. list - llistes d'elements
4. definition - termes amb explicacions detallades
5. highlight - conceptes molt importants
6. subsection - agrupar contingut sota subtítol
7. example - casos pràctics

REGLES:
- Usa sempre CATALÀ
- Sigues concís però complet
- Usa "definition" per a conceptes tècnics
- Usa "formula" per a totes les equacions
- Usa "highlight" amb importance:"high" per a conceptes crítics
- Afegeix "example" per a casos pràctics
- Inclou preguntes de revisió al final
- Completa TOTS els camps de metadata

TEMA: [el teu tema aquí]

Respon NOMÉS amb el JSON vàlid, sense text addicional abans ni després.
```

---

## 💡 Consells d'Ús

### ✓ Fes això:
- Usa `definition` per a tots els termes tècnics
- Posa les equacions en blocs `formula` amb etiquetes descriptives
- Usa `highlight` amb `importance: "high"` per a conceptes crítics
- Inclou `keywords` rellevants a la metadata
- Especifica la dificultat per organitzar millor els teus apunts
- Afegeix exemples pràctics amb el tipus `example`

### ✗ Evita això:
- No barregis diferents estructures dins del mateix tipus
- No oblidis tancar totes les claus `{}` i claudàtors `[]`
- No usis cometes simples `'`, sempre usa cometes dobles `"`
- No deixis comes `,` al final de l'últim element d'una llista

---

## 🔄 Compatibilitat

✅ **Format de text pla**: Encara funciona! L'aplicació detecta automàticament si el contingut és JSON o text pla.

✅ **Migració gradual**: Pots tenir alguns apunts en text pla i altres en JSON.

✅ **Text-to-speech**: Funciona amb ambdós formats.

---

## 🎨 Com es Veuen els Elements

### Fórmula
Caixa amb fons de color, text centrat en font monoespaciada.

### Definició
Caixa amb barra lateral de color, terme en negreta a dalt, detalls amb fletxes.

### Destacat
Caixa groga (alta importància) o blava (mitjana/baixa) amb icona de bombeta 💡.

### Exemple
Caixa verda amb icona 📝 i text explicatiu.

---

## ❓ Preguntes Freqüents

**P: He de convertir tots els meus apunts antics?**
R: No! Els dos formats funcionen junts. Només usa JSON per a apunts nous o quan vulguis més funcionalitats.

**P: Puc editar el JSON manualment?**
R: Sí, però és més fàcil usar un LLM per generar-lo. Si edites manualment, assegura't que el JSON sigui vàlid.

**P: Què passa si el JSON té errors?**
R: L'aplicació detectarà l'error i mostrarà el contingut com a text pla.

**P: Puc barrejar text pla i JSON al mateix arxiu?**
R: No, cada arxiu ha de ser completament text pla O completament JSON.

---

## 🚀 Començar Ara

1. Copia el prompt de LLM d'aquesta guia
2. Demana a un LLM (ChatGPT, Claude, etc.) que creï apunts
3. Copia el JSON generat a un arxiu `.txt` o `.json`
4. Puja'l a StudyDock
5. Gaudeix de la renderització millorada!

---

**Exemple d'ús del prompt:**

```
[Copia el prompt complet]

TEMA: Sistema nerviós humà
```

L'LLM generarà un JSON complet amb metadata, seccions, definicions, fórmules i destacats!

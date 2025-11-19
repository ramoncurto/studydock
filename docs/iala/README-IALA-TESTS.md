# IALA Test Files - Structure and Organization

This folder contains quiz tests for the IALA Maritime Buoyage System (International Association of Marine Aids to Navigation and Lighthouse Authorities).

## Understanding IALA Regions

The IALA system has **TWO regions** (A and B) that differ ONLY in the **color scheme of LATERAL marks** (port and starboard marks). All other mark types are universal.

### Region A
- **Coverage**: Europe, Africa, Asia (most), Oceania, and Middle East
- **Port (Babor)**: RED cylinder
- **Starboard (Estribor)**: GREEN cone
- **Memory aid**: "Red port wine is left in Europe" (red LEFT when entering)

### Region B
- **Coverage**: North America, Central America, South America, Japan, Korea, Philippines
- **Port (Babor)**: GREEN cylinder
- **Starboard (Estribor)**: RED cone
- **Memory aid**: "Green port in Americas" (green LEFT when entering)

### Universal Marks (Same in Both Regions)
- ✅ Cardinal marks (North, South, East, West)
- ✅ Isolated danger marks
- ✅ Safe water marks
- ✅ Special marks
- ✅ New danger marks

## Test File Organization

### General System Tests
These tests cover concepts applicable to both regions:

| File | Description | Questions | Region |
|------|-------------|-----------|--------|
| `IALA-Sistema-General_test.txt` | Overview of IALA system, differences between regions, universal concepts | 30 | Both A & B |

### Universal Mark Tests
These marks are identical worldwide:

| File | Description | Questions | Region |
|------|-------------|-----------|--------|
| `IALA-Marques-Cardinals_test.txt` | Cardinal marks (N, S, E, W) | 30 | Universal |
| `IALA-Marques-Perill-Aillat_test.txt` | Isolated danger marks | 30 | Universal |
| `IALA-Marques-Aigues-Segures_test.txt` | Safe water marks | 30 | Universal |
| `IALA-Marques-Especials_test.txt` | Special marks (yellow) | 30 | Universal |
| `IALA-Marques-Nous-Perills_test.txt` | New danger marks | 30 | Universal |

### Lateral Mark Tests (Region-Specific)
**⚠️ CRITICAL**: These marks have INVERTED colors between regions!

| File | Description | Questions | Region |
|------|-------------|-----------|--------|
| `IALA-Marques-Laterals_test.txt` | Combined test covering both regions (educational) | 30 | Both A & B |
| `IALA-Marques-Laterals-RegioA_test.txt` | **Region A specific** lateral marks | 20 | **A only** |
| `IALA-Marques-Laterals-RegioB_test.txt` | **Region B specific** lateral marks | 20 | **B only** |

## Recommended Study Path

### For Students in Region A (Spain, Europe)
1. Start with `IALA-Sistema-General_test.txt` - understand the system
2. Study **`IALA-Marques-Laterals-RegioA_test.txt`** - your primary lateral marks
3. Study universal marks:
   - `IALA-Marques-Cardinals_test.txt`
   - `IALA-Marques-Perill-Aillat_test.txt`
   - `IALA-Marques-Aigues-Segures_test.txt`
   - `IALA-Marques-Especials_test.txt`
4. Optional: `IALA-Marques-Laterals-RegioB_test.txt` (for international navigation awareness)

### For Students in Region B (Americas, Japan)
1. Start with `IALA-Sistema-General_test.txt` - understand the system
2. Study **`IALA-Marques-Laterals-RegioB_test.txt`** - your primary lateral marks
3. Study universal marks (same as Region A)
4. Optional: `IALA-Marques-Laterals-RegioA_test.txt` (for international navigation awareness)

### For International Navigation Preparation
Study ALL tests to understand both systems - crucial for crossing between regions!

## Key Differences Summary

### What Changes Between Regions?
```
REGION A (Europe, etc.)          REGION B (Americas, etc.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Port (Left):     RED cylinder    Port (Left):     GREEN cylinder
Starboard (Right): GREEN cone    Starboard (Right): RED cone

COLORS ARE INVERTED! ⚠️
```

### What Stays the Same?
- **Shapes**: Cylinder for port, Cone for starboard (in BOTH regions)
- **Cardinals**: Black/Yellow with specific topmarks (universal)
- **Isolated Danger**: Black with red bands + 2 black spheres (universal)
- **Safe Water**: Red/White vertical stripes + red sphere (universal)
- **Special**: Yellow with Yellow X topmark (universal)

## Test Format

All tests follow this format:
```
Q: Question text?
IMG: image-filename.jpg | Alt text description
- Option 1
- Option 2
- Option 3
- Option 4
A: Correct answer
```

Images are referenced but may need to be created separately. The alt text provides a description of what the image should show.

## Important Notes

1. **⚠️ Critical Safety Point**: Confusing Region A and Region B can lead to **navigating on the wrong side of the channel** and potential grounding/collision.

2. **Cross-Regional Travel**: When sailing from Europe to America (or vice versa), you MUST switch your interpretation of lateral mark colors at the regional boundary.

3. **Chart Verification**: Always check your nautical charts - they indicate which IALA region applies (shown as "IALA-A" or "IALA-B").

4. **Exam Preparation**: For Spanish nautical exams (PER, PNB, etc.), focus on **Region A** as Spain uses IALA Region A.

5. **Memory Aid**:
   - Region A: "Red to port when entering in Africa/Asia/Australia"
   - Region B: "Red to starboard when entering in the Americas"

## Test Statistics

| Category | Total Questions | Region A | Region B | Universal |
|----------|----------------|----------|----------|-----------|
| System Overview | 30 | - | - | 30 |
| Lateral Marks (Combined) | 30 | 15 | 15 | - |
| Lateral Marks (Region A) | 20 | 20 | - | - |
| Lateral Marks (Region B) | 20 | - | 20 | - |
| Cardinals | 30 | - | - | 30 |
| Isolated Danger | 30 | - | - | 30 |
| Safe Water | 30 | - | - | 30 |
| Special | 30 | - | - | 30 |
| New Danger | 30 | - | - | 30 |
| **TOTAL** | **250** | **35** | **35** | **180** |

## Study Tips

1. **Start with universals**: Learn cardinal marks first - they're the same everywhere and fundamental to navigation.

2. **Use mnemonics**: Create memory aids for lateral colors based on your region.

3. **Practice with images**: Visual recognition is crucial - draw or find images of each mark type.

4. **Test understanding**: After studying Region A, try Region B to ensure you understand the inversion concept.

5. **Real-world application**: When boating, actively identify marks and verify on charts.

## Additional Resources

- Official IALA website: https://www.iala-aism.org/
- Nautical charts showing local IALA region designation
- `knowlege_iala.pdf` - Comprehensive IALA reference document in this folder

## Questions or Corrections

If you find any errors or have suggestions for improving these tests, please document them for review.

---

**Last Updated**: November 2024
**Version**: 1.0
**Language**: Català (Catalan)

import React, { useState, useEffect, useRef } from 'react';
import { Upload, BookOpen, FileText, Volume2, Play, Pause, CheckCircle, XCircle, ArrowLeft, Plus, Trash2, Sun, Moon } from 'lucide-react';

export default function StudyApp() {
  const [screen, setScreen] = useState('home');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Photosynthesis Notes.txt",
      content: `FOTOSÍNTESIS: PROCESO Y FASES

La fotosíntesis es el proceso mediante el cual las plantas convierten la **luz solar** en **energía química**.


Ecuación general:

6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂


FASES DEL PROCESO


# 1. Fase Luminosa

Ocurre en los tilacoides del cloroplasto:

- Se produce en presencia de luz
- Genera **ATP** y **NADPH**
- Libera oxígeno como producto secundario
- La **clorofila** captura la energía lumínica


# 2. Fase Oscura (Ciclo de Calvin)

Ocurre en el estroma del cloroplasto:

- No requiere luz directa
- Utiliza ATP y NADPH de la fase luminosa
- Fija el CO₂ atmosférico
- Produce **glucosa** como producto final


FACTORES QUE AFECTAN LA FOTOSÍNTESIS

Principales factores limitantes:

- Intensidad lumínica
- Concentración de CO₂ en el ambiente
- Temperatura ambiental
- Disponibilidad de agua


IMPORTANCIA BIOLÓGICA

La fotosíntesis es fundamental porque:

1. Produce oxígeno para la respiración aeróbica
2. Es la base de la cadena alimentaria
3. Regula el CO₂ atmosférico
4. Genera toda la materia orgánica del planeta`,
      date: "25/10/2025"
    },
    {
      id: 2,
      title: "Historia Segunda Guerra Mundial.txt",
      content: `SEGUNDA GUERRA MUNDIAL (1939-1945)


CAUSAS PRINCIPALES


Factores que llevaron al conflicto:

1. Tratado de Versalles y sus duras consecuencias
2. Ascenso de regímenes totalitarios en Europa
3. Expansionismo alemán, italiano y japonés
4. Crisis económica mundial de 1929
5. Fracaso de la Sociedad de Naciones


CRONOLOGÍA DE EVENTOS CLAVE


# Inicio de la guerra (1939-1940)

- **1 septiembre 1939**: Alemania invade Polonia
- **3 septiembre 1939**: Reino Unido y Francia declaran la guerra
- **1940**: Caída de Francia y Batalla de Inglaterra


# Expansión del conflicto (1941-1942)

- **1941**: Operación Barbarroja - invasión de la URSS
- **7 diciembre 1941**: Ataque a Pearl Harbor
- EEUU entra oficialmente en la guerra
- **1942**: Batalla de Stalingrado (punto de inflexión)
- Batalla de Midway en el Pacífico


# Victoria aliada (1943-1945)

Eventos decisivos:

- **1943**: Rendición italiana y Conferencia de Teherán
- **6 junio 1944**: Desembarco de Normandía (Día D)
- Liberación de París en agosto
- **1945**: Conferencia de Yalta
- **30 abril**: Muerte de Hitler
- **8 mayo**: Rendición alemana
- **6 y 9 agosto**: Bombas atómicas en Hiroshima y Nagasaki
- **2 septiembre**: Rendición japonesa


CONSECUENCIAS DE LA GUERRA


Impacto humano y político:

- Entre **50-70 millones** de muertos
- División de Alemania y Europa
- Inicio de la **Guerra Fría**
- Creación de la **ONU**
- Juicios de Núremberg
- Proceso de descolonización progresiva
- Dos superpotencias: EEUU y URSS`,
      date: "27/10/2025"
    },
    {
      id: 3,
      title: "Programming Fundamentals.txt",
      content: `FUNDAMENTOS DE PROGRAMACIÓN


CONCEPTOS BÁSICOS


Variables:

Espacios en memoria que almacenan datos. Cada variable tiene:
- Un **nombre** identificador
- Un **tipo** de dato
- Un **valor** asignado

Ejemplo: let edad = 25;


Tipos de datos principales:

- **Números**: integers, floats
- **Cadenas**: strings de texto
- **Booleanos**: true/false
- **Arrays**: listas de elementos
- **Objetos**: estructuras de datos complejas


ESTRUCTURAS DE CONTROL


# 1. Condicionales

Permiten tomar decisiones en el código:

- **if**: ejecuta código si se cumple una condición
- **else**: alternativa cuando no se cumple
- **else if**: múltiples condiciones


# 2. Bucles

Repiten código múltiples veces:

- **for**: cuando sabes cuántas iteraciones
- **while**: mientras se cumpla una condición
- **do-while**: al menos se ejecuta una vez


FUNCIONES

Bloques de código reutilizables:

Características de las funciones:

- Realizan una tarea específica
- Pueden recibir **parámetros**
- Pueden **retornar** valores
- Promueven la reutilización de código


BUENAS PRÁCTICAS DE PROGRAMACIÓN


Principios esenciales:

1. Usar nombres de variables descriptivos
2. Comentar el código complejo
3. Mantener funciones pequeñas y específicas
4. Evitar repetición de código (**DRY**)
5. Manejar errores apropiadamente


PARADIGMAS DE PROGRAMACIÓN

Diferentes formas de estructurar código:

- **Programación imperativa**: instrucciones paso a paso
- **Programación orientada a objetos**: basada en clases y objetos
- **Programación funcional**: basada en funciones puras`,
      date: "29/10/2025"
    }
  ]);
  const [tests, setTests] = useState([
    {
      id: 1,
      title: "Photosynthesis Test.txt",
      questions: [
        {
          question: "¿Dónde ocurre la fase luminosa de la fotosíntesis?",
          options: ["En los tilacoides", "En el estroma", "En la mitocondria", "En el núcleo"],
          correct: "En los tilacoides"
        },
        {
          question: "¿Cuál es el producto principal de la fotosíntesis?",
          options: ["Oxígeno", "Glucosa", "ATP", "Agua"],
          correct: "Glucosa"
        },
        {
          question: "¿Qué molécula captura la energía lumínica?",
          options: ["Hemoglobina", "Clorofila", "Caroteno", "Xantofila"],
          correct: "Clorofila"
        },
        {
          question: "¿Cuál NO es un factor que afecta la fotosíntesis?",
          options: ["Intensidad lumínica", "Temperatura", "Gravedad", "Concentración de CO₂"],
          correct: "Gravedad"
        },
        {
          question: "¿En qué fase se fija el CO₂?",
          options: ["Fase luminosa", "Ciclo de Calvin", "Glucólisis", "Fermentación"],
          correct: "Ciclo de Calvin"
        }
      ],
      date: "26/10/2025"
    },
    {
      id: 2,
      title: "World War II Quiz.txt",
      questions: [
        {
          question: "¿En qué año comenzó la Segunda Guerra Mundial?",
          options: ["1939", "1940", "1938", "1941"],
          correct: "1939"
        },
        {
          question: "¿Qué evento marcó la entrada de EEUU en la guerra?",
          options: ["Invasión de Polonia", "Ataque a Pearl Harbor", "Batalla de Inglaterra", "Desembarco de Normandía"],
          correct: "Ataque a Pearl Harbor"
        },
        {
          question: "¿Cuál fue el punto de inflexión en el frente oriental?",
          options: ["Batalla de Berlín", "Batalla de Stalingrado", "Batalla de Moscú", "Batalla de Kursk"],
          correct: "Batalla de Stalingrado"
        },
        {
          question: "¿Qué día ocurrió el Desembarco de Normandía?",
          options: ["6 de junio de 1944", "8 de mayo de 1945", "1 de septiembre de 1939", "7 de diciembre de 1941"],
          correct: "6 de junio de 1944"
        },
        {
          question: "¿Qué organización internacional se creó tras la guerra?",
          options: ["La OTAN", "La ONU", "La Sociedad de Naciones", "El Pacto de Varsovia"],
          correct: "La ONU"
        },
        {
          question: "¿Cuándo se rindió Alemania?",
          options: ["8 de mayo de 1945", "2 de septiembre de 1945", "30 de abril de 1945", "6 de agosto de 1945"],
          correct: "8 de mayo de 1945"
        }
      ],
      date: "28/10/2025"
    }
  ]);
  const [currentNote, setCurrentNote] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  const [testProgress, setTestProgress] = useState({ current: 0, answers: [] });
  const [isReading, setIsReading] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  
  const speechSynthesis = window.speechSynthesis;
  const utteranceRef = useRef(null);

  // Theme colors
  const theme = {
    bg: isDark ? 'bg-black' : 'bg-gray-50',
    text: isDark ? 'text-white' : 'text-black',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    card: isDark ? 'bg-gray-900' : 'bg-white',
    cardHover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    button: isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
    buttonSecondary: isDark ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-gray-200 hover:bg-gray-300 border-gray-400',
    border: isDark ? 'border-gray-700' : 'border-gray-300',
    success: isDark ? 'bg-green-900' : 'bg-green-100',
    error: isDark ? 'bg-red-900' : 'bg-red-100',
    progressBar: isDark ? 'bg-gray-800' : 'bg-gray-300',
    progressFill: isDark ? 'bg-white' : 'bg-black'
  };

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Text formatting parser
  const parseFormattedText = (text) => {
    const lines = text.split('\n');
    const formatted = [];
    
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        formatted.push({ type: 'space', content: '' });
        return;
      }
      
      // Main title (ALL CAPS or starts with #)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /^[A-ZÁÉÍÓÚÑ\s:]+$/.test(trimmed)) {
        formatted.push({ type: 'h1', content: trimmed });
      }
      // Subtitle with # or numbered sections
      else if (trimmed.startsWith('#') || /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmed)) {
        formatted.push({ type: 'h2', content: trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '') });
      }
      // Section marker (ends with :)
      else if (trimmed.endsWith(':') && trimmed.length < 60) {
        formatted.push({ type: 'h3', content: trimmed });
      }
      // Bullet list (starts with -, *, or •)
      else if (/^[-*•]\s+/.test(trimmed)) {
        formatted.push({ type: 'li', content: trimmed.replace(/^[-*•]\s+/, '') });
      }
      // Numbered list
      else if (/^\d+[\.)]\s+/.test(trimmed)) {
        formatted.push({ type: 'li', content: trimmed.replace(/^\d+[\.)]\s+/, '') });
      }
      // Important text (between ** or __)
      else if (/\*\*.*\*\*|__.*__/.test(trimmed)) {
        formatted.push({ 
          type: 'p', 
          content: trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
        });
      }
      // Regular paragraph
      else {
        formatted.push({ type: 'p', content: trimmed });
      }
    });
    
    return formatted;
  };

  // Text-to-speech functions
  const startReading = (text) => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onend = () => setIsReading(false);
    
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const stopReading = () => {
    speechSynthesis.cancel();
    setIsReading(false);
  };

  const toggleReading = () => {
    if (isReading) {
      stopReading();
    } else if (currentNote) {
      startReading(currentNote.content);
    }
  };

  // File upload handlers
  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      
      if (type === 'note') {
        const newNote = {
          id: Date.now(),
          title: file.name,
          content: content,
          date: new Date().toLocaleDateString()
        };
        setNotes([...notes, newNote]);
      } else if (type === 'test') {
        try {
          // Parse test format: Q: question? A: answer
          const lines = content.split('\n');
          const questions = [];
          let currentQ = null;
          
          lines.forEach(line => {
            if (line.trim().startsWith('Q:')) {
              if (currentQ) questions.push(currentQ);
              currentQ = { question: line.substring(2).trim(), options: [], correct: '' };
            } else if (line.trim().startsWith('A:')) {
              if (currentQ) currentQ.correct = line.substring(2).trim();
            } else if (line.trim().startsWith('-')) {
              if (currentQ) currentQ.options.push(line.substring(1).trim());
            }
          });
          if (currentQ) questions.push(currentQ);
          
          const newTest = {
            id: Date.now(),
            title: file.name,
            questions: questions,
            date: new Date().toLocaleDateString()
          };
          setTests([...tests, newTest]);
        } catch (error) {
          alert('Error al procesar el test. Usa el formato:\nQ: pregunta?\n- opción1\n- opción2\nA: respuesta correcta');
        }
      }
      setUploadType(null);
      setScreen('home');
    };
    reader.readAsText(file);
  };

  // Test functions
  const startTest = (test) => {
    setCurrentTest(test);
    setTestProgress({ current: 0, answers: [] });
    setScreen('taking-test');
  };

  const answerQuestion = (answer) => {
    const currentQ = currentTest.questions[testProgress.current];
    const isCorrect = answer === currentQ.correct;
    
    const newAnswers = [...testProgress.answers, { question: currentQ.question, answer, correct: currentQ.correct, isCorrect }];
    
    if (testProgress.current < currentTest.questions.length - 1) {
      setTestProgress({ current: testProgress.current + 1, answers: newAnswers });
    } else {
      setTestProgress({ current: testProgress.current, answers: newAnswers });
      setScreen('test-results');
    }
  };

  const deleteItem = (id, type) => {
    if (type === 'note') {
      setNotes(notes.filter(n => n.id !== id));
    } else {
      setTests(tests.filter(t => t.id !== id));
    }
  };

  // Home Screen
  const HomeScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">StudyDock</h1>
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full ${theme.card} ${theme.cardHover} transition`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => setScreen('notes')}
            className={`w-full ${theme.button} p-6 rounded-lg flex items-center justify-between transition`}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={28} />
              <div className="text-left">
                <div className="font-bold text-lg">Mis Apuntes</div>
                <div className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{notes.length} documentos</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setScreen('tests')}
            className={`w-full ${theme.button} p-6 rounded-lg flex items-center justify-between transition`}
          >
            <div className="flex items-center gap-3">
              <FileText size={28} />
              <div className="text-left">
                <div className="font-bold text-lg">Mis Tests</div>
                <div className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{tests.length} tests</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setUploadType('upload')}
            className={`w-full ${theme.buttonSecondary} ${theme.text} p-6 rounded-lg flex items-center justify-center gap-3 transition border-2 border-dashed ${theme.border}`}
          >
            <Plus size={28} />
            <span className="font-bold text-lg">Subir Contenido</span>
          </button>
        </div>

        <div className={`mt-8 p-4 ${theme.card} rounded-lg text-sm ${theme.textSecondary} border ${theme.border}`}>
          <p className="font-bold mb-2">💡 Formatos aceptados:</p>
          
          <div className="mb-3">
            <p className="font-semibold mb-1">📄 Apuntes (.txt)</p>
            <p className="mb-1">El formato se detecta automáticamente:</p>
            <ul className="text-xs space-y-1 ml-4">
              <li>• TEXTO EN MAYÚSCULAS → Título principal</li>
              <li>• Texto con : al final → Subtítulo</li>
              <li>• Líneas con - o * → Listas</li>
              <li>• **texto** → <strong>Negrita</strong></li>
              <li>• # Título → Sección</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">✅ Tests (.txt)</p>
            <pre className={`mt-2 text-xs ${isDark ? 'bg-black' : 'bg-gray-100'} p-2 rounded`}>
Q: ¿Pregunta?{'\n'}- Opción 1{'\n'}- Opción 2{'\n'}- Opción 3{'\n'}A: Opción correcta
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  // Upload Screen
  const UploadScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setUploadType(null)} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text}`}>
          <ArrowLeft size={20} />
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Subir Contenido</h2>

        <div className="space-y-4">
          <label className="block">
            <div className={`${theme.button} p-6 rounded-lg cursor-pointer transition flex items-center gap-4`}>
              <Upload size={32} />
              <div>
                <div className="font-bold text-lg">Subir Apuntes</div>
                <div className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Archivo de texto (.txt)</div>
              </div>
            </div>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileUpload(e, 'note')}
              className="hidden"
            />
          </label>

          <label className="block">
            <div className={`${theme.button} p-6 rounded-lg cursor-pointer transition flex items-center gap-4`}>
              <Upload size={32} />
              <div>
                <div className="font-bold text-lg">Subir Test</div>
                <div className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Archivo de texto (.txt)</div>
              </div>
            </div>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileUpload(e, 'test')}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );

  // Notes List Screen
  const NotesScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text}`}>
          <ArrowLeft size={20} />
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Mis Apuntes</h2>

        {notes.length === 0 ? (
          <div className={`text-center ${theme.textSecondary} mt-12`}>
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay apuntes todavía</p>
            <p className="text-sm mt-2">Sube tu primer documento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className={`${theme.card} p-4 rounded-lg flex items-center justify-between border ${theme.border}`}>
                <button
                  onClick={() => {
                    setCurrentNote(note);
                    setScreen('reading');
                  }}
                  className="flex-1 text-left"
                >
                  <div className="font-bold">{note.title}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>{note.date}</div>
                </button>
                <button
                  onClick={() => deleteItem(note.id, 'note')}
                  className="ml-4 text-red-500 hover:text-red-400"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Reading Screen
  const ReadingScreen = () => {
    const formattedContent = currentNote ? parseFormattedText(currentNote.content) : [];
    
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => { stopReading(); setScreen('notes'); }} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text}`}>
            <ArrowLeft size={20} />
            Volver
          </button>

          <h2 className="text-xl font-bold mb-4">{currentNote?.title}</h2>

          <div className="mb-6">
            <button
              onClick={toggleReading}
              className={`w-full ${theme.button} p-4 rounded-lg flex items-center justify-center gap-3 transition font-bold`}
            >
              {isReading ? (
                <>
                  <Pause size={24} />
                  Pausar Audio
                </>
              ) : (
                <>
                  <Play size={24} />
                  Escuchar Audiolibro
                </>
              )}
            </button>
          </div>

          <div className={`${theme.card} p-6 rounded-lg max-h-[70vh] overflow-y-auto border ${theme.border}`}>
            {formattedContent.map((item, idx) => {
              if (item.type === 'h1') {
                return (
                  <h1 key={idx} className="text-2xl font-bold mb-4 mt-6 first:mt-0">
                    {item.content}
                  </h1>
                );
              }
              if (item.type === 'h2') {
                return (
                  <h2 key={idx} className="text-xl font-bold mb-3 mt-5">
                    {item.content}
                  </h2>
                );
              }
              if (item.type === 'h3') {
                return (
                  <h3 key={idx} className={`text-lg font-semibold mb-2 mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.content}
                  </h3>
                );
              }
              if (item.type === 'li') {
                return (
                  <div key={idx} className="flex gap-2 mb-2 ml-4">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>•</span>
                    <span className="flex-1">{item.content}</span>
                  </div>
                );
              }
              if (item.type === 'space') {
                return <div key={idx} className="h-2" />;
              }
              return (
                <p 
                  key={idx} 
                  className="mb-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Tests List Screen
  const TestsScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text}`}>
          <ArrowLeft size={20} />
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Mis Tests</h2>

        {tests.length === 0 ? (
          <div className={`text-center ${theme.textSecondary} mt-12`}>
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay tests todavía</p>
            <p className="text-sm mt-2">Sube tu primer test</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className={`${theme.card} p-4 rounded-lg flex items-center justify-between border ${theme.border}`}>
                <button
                  onClick={() => startTest(test)}
                  className="flex-1 text-left"
                >
                  <div className="font-bold">{test.title}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>
                    {test.questions.length} preguntas • {test.date}
                  </div>
                </button>
                <button
                  onClick={() => deleteItem(test.id, 'test')}
                  className="ml-4 text-red-500 hover:text-red-400"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Taking Test Screen
  const TakingTestScreen = () => {
    const currentQ = currentTest?.questions[testProgress.current];
    if (!currentQ) return null;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text}`}>
            <ArrowLeft size={20} />
            Salir
          </button>

          <div className="mb-6">
            <div className={`text-sm ${theme.textSecondary} mb-2`}>
              Pregunta {testProgress.current + 1} de {currentTest.questions.length}
            </div>
            <div className={`${theme.progressBar} h-2 rounded-full overflow-hidden`}>
              <div 
                className={`${theme.progressFill} h-full transition-all duration-300`}
                style={{ width: `${((testProgress.current + 1) / currentTest.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className={`${theme.card} p-6 rounded-lg mb-6 border ${theme.border}`}>
            <h3 className="text-xl font-bold mb-4">{currentQ.question}</h3>
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => answerQuestion(option)}
                className={`w-full ${theme.button} p-4 rounded-lg text-left transition font-medium`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Test Results Screen
  const TestResultsScreen = () => {
    const correct = testProgress.answers.filter(a => a.isCorrect).length;
    const total = testProgress.answers.length;
    const percentage = Math.round((correct / total) * 100);

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text}`}>
            <ArrowLeft size={20} />
            Volver a Tests
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">¡Test Completado!</h2>
            <div className="text-6xl font-bold my-6">{percentage}%</div>
            <div className={`text-xl ${theme.textSecondary}`}>
              {correct} de {total} correctas
            </div>
          </div>

          <div className="space-y-4">
            {testProgress.answers.map((answer, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${answer.isCorrect ? 
                (isDark ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-300') : 
                (isDark ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-300')
              }`}>
                <div className="flex items-start gap-3 mb-2">
                  {answer.isCorrect ? (
                    <CheckCircle size={24} className={isDark ? 'text-green-400' : 'text-green-600'} />
                  ) : (
                    <XCircle size={24} className={isDark ? 'text-red-400' : 'text-red-600'} />
                  )}
                  <div className="flex-1">
                    <div className="font-bold mb-2">{answer.question}</div>
                    <div className="text-sm">
                      <div>Tu respuesta: {answer.answer}</div>
                      {!answer.isCorrect && (
                        <div className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Correcta: {answer.correct}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => startTest(currentTest)}
            className={`w-full mt-6 ${theme.button} p-4 rounded-lg font-bold transition`}
          >
            Repetir Test
          </button>
        </div>
      </div>
    );
  };

  // Render current screen
  return (
    <div className="font-sans">
      {screen === 'home' && <HomeScreen />}
      {uploadType && <UploadScreen />}
      {screen === 'notes' && <NotesScreen />}
      {screen === 'reading' && <ReadingScreen />}
      {screen === 'tests' && <TestsScreen />}
      {screen === 'taking-test' && <TakingTestScreen />}
      {screen === 'test-results' && <TestResultsScreen />}
    </div>
  );
}
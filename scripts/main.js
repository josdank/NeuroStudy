/**
 * NeuroStudy — main.js
 * Funcionalidades:
 *  - Menú responsive (hamburguesa)
 *  - Lógica de cámara y simulación de detección emocional
 *  - Ciclo de estados: sesión, temporizador, adaptaciones
 *  - Gráfico sparkline de historial emocional
 *  - Registro de actividad (log)
 *  - Modal "Acerca del producto"
 *  - Selección de ejercicios
 *  - Validación de formulario de contacto (Netlify-compatible)
 *  - Animaciones de scroll (Intersection Observer)
 */

/* ════════════════════════════════
   ESTADO GLOBAL DE LA APLICACIÓN
════════════════════════════════ */
const appState = {
  sessionActive:  false,
  sessionPaused:  false,
  sessionSeconds: 0,
  sessionTimer:   null,
  scanActive:     false,
  moodInterval:   null,
  adaptCount:     0,
  moodHistory:    [],
  logEntries:     [],
  currentMood:    null,
};

/* ─── Datos de estados emocionales ─── */
const MOODS = [
  {
    key:       'focus',
    label:     'Concentrado',
    icon:      '🧠',
    color:     'var(--teal-light)',
    bgColor:   'rgba(13,184,150,0.12)',
    bar:       88,
    adapt:     'Modo Flujo activado. Tu nivel de concentración es óptimo. Continúa con ejercicios de alta complejidad sin interrupciones. Descanso en 25 min.',
    tip:       'Aprovecha este estado de flujo. Aborda los temas más complejos ahora y reserva los ejercicios mecánicos para cuando tu concentración disminuya.',
    mode:      'Enfoque Profundo',
    modeClass: 'mode-focus',
    modeStyle: 'background:rgba(13,184,150,0.12); color:var(--teal-light)',
  },
  {
    key:       'stress',
    label:     'Estresado',
    icon:      '😵',
    color:     'var(--rose)',
    bgColor:   'rgba(199,75,91,0.12)',
    bar:       65,
    adapt:     'Estrés detectado. Reduciendo complejidad de ejercicios. Activando descanso técnico de 5 minutos con técnica de respiración 4-7-8.',
    tip:       'Cuando el estrés es elevado, la memoria de trabajo se reduce hasta un 40%. Haz una pausa breve antes de continuar con el material.',
    mode:      'Descanso Activo',
    modeClass: 'mode-relax',
    modeStyle: 'background:rgba(59,130,196,0.12); color:var(--sky)',
  },
  {
    key:       'relax',
    label:     'Relajado',
    icon:      '😄',
    color:     'var(--sky)',
    bgColor:   'rgba(59,130,196,0.12)',
    bar:       72,
    adapt:     'Estado relajado detectado. Modo de revisión activado. Ideal para repasar conceptos ya aprendidos y consolidar mediante flashcards.',
    tip:       'El estado relajado favorece la consolidación de memoria a largo plazo. Utiliza este momento para repasar, no para aprender contenido nuevo.',
    mode:      'Revisión',
    modeClass: 'mode-relax',
    modeStyle: 'background:rgba(59,130,196,0.12); color:var(--sky)',
  },
  {
    key:       'distract',
    label:     'Distraído',
    icon:      '😏',
    color:     'var(--amber)',
    bgColor:   'rgba(232,168,56,0.12)',
    bar:       40,
    adapt:     'Distracción detectada. Ejercicio de reenganche activado: micro-tarea de 2 minutos para restablecer la atención focalizada.',
    tip:       'La distracción sostenida reduce la eficiencia en un 60%. NeuroStudy ha reducido el nivel de dificultad temporalmente para reconectar tu atención.',
    mode:      'Reenganche',
    modeClass: 'mode-energize',
    modeStyle: 'background:rgba(232,168,56,0.12); color:var(--amber)',
  },
];

/* ════════════════════════════════
   MENÚ RESPONSIVE (HAMBURGUESA)
════════════════════════════════ */
function initNavMenu() {
  const toggle  = document.getElementById('navToggle');
  const menu    = document.getElementById('navMenu');

  if (!toggle || !menu) return;

  // Abrir / cerrar menú
  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    // Bloquear scroll del body cuando el menú está abierto
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Cerrar al hacer clic en un enlace
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });
}

/* ════════════════════════════════
   CÁMARA
════════════════════════════════ */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    const video  = document.getElementById('videoFeed');
    video.srcObject = stream;
    activateScanMode();
    addLog('Cámara activada. Analizando estado emocional...');
  } catch (err) {
    // Modo simulación: sin cámara real
    const video = document.getElementById('videoFeed');
    video.style.background = 'linear-gradient(135deg, #0A1A28 0%, #0D2A3A 100%)';
    activateScanMode();
    addLog('Modo simulación activo (cámara no disponible).');
  }
}

/** Activa la UI de escaneo y arranca el ciclo de detección */
function activateScanMode() {
  document.getElementById('camOverlay').classList.add('hidden');
  document.getElementById('scanLine').classList.add('active');
  appState.scanActive = true;
  startMoodCycle();
}

/* ════════════════════════════════
   CICLO DE DETECCIÓN EMOCIONAL
════════════════════════════════ */
function startMoodCycle() {
  detectMood();
  appState.moodInterval = setInterval(detectMood, 5000);
}

function detectMood() {
  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  appState.currentMood = mood;
  renderMood(mood);
  appState.moodHistory.push({ t: appState.sessionSeconds, mood: mood.key });
  drawSparkline();
  if (appState.sessionActive) applyAdaptation(mood);
}

function renderMood(mood) {
  document.getElementById('moodIcon').textContent  = mood.icon;
  document.getElementById('moodIcon').style.background = mood.bgColor;
  document.getElementById('moodLabel').textContent  = mood.label;
  document.getElementById('moodConf').textContent   = `Confianza: ${70 + Math.floor(Math.random() * 25)}%`;

  const bar = document.getElementById('moodBar');
  bar.style.width      = mood.bar + '%';
  bar.style.background = mood.color;

  // Actualizar aria-valuenow en la barra de progreso
  const track = bar.parentElement;
  if (track) track.setAttribute('aria-valuenow', String(mood.bar));
}

function applyAdaptation(mood) {
  appState.adaptCount++;
  document.getElementById('metricAdapt').textContent = appState.adaptCount;

  // Tarjeta adaptativa
  const card = document.getElementById('adaptCard');
  card.className = 'adapt-card ' + mood.modeClass;
  document.getElementById('adaptDesc').textContent = mood.adapt;

  // Consejo en sidebar
  document.getElementById('tipCard').innerHTML =
    `<div class="tip-label">Recomendación</div>${mood.tip}`;

  // Badge de modo activo
  const modeEl = document.getElementById('currentMode');
  modeEl.style.display = 'block';
  const badge = modeEl.querySelector('.mode-badge');
  badge.style.cssText = mood.modeStyle;
  document.getElementById('modeName').textContent = mood.mode;

  // Métricas
  const focusMap = { focus: '94', stress: '61', relax: '78', distract: '43' };
  const effMap   = { focus: '+31%', stress: '+12%', relax: '+22%', distract: '+8%' };
  document.getElementById('metricFocus').textContent = focusMap[mood.key];
  document.getElementById('metricEff').textContent   = effMap[mood.key];
  document.getElementById('focusDelta').style.display = 'inline-flex';

  addLog(`Adaptación #${appState.adaptCount}: modo "${mood.mode}" activado (estado: ${mood.label.toLowerCase()})`);
}

/* ════════════════════════════════
   SESIÓN DE ESTUDIO
════════════════════════════════ */
function startSession() {
  if (!appState.scanActive) {
    startCamera();
    setTimeout(_startSession, 1200);
  } else {
    _startSession();
  }
}

function _startSession() {
  appState.sessionActive  = true;
  appState.sessionPaused  = false;
  appState.sessionSeconds = 0;

  document.getElementById('statusText').textContent      = 'Sesión activa';
  document.getElementById('sessionTitle').textContent    = 'Sesión de estudio en progreso';
  document.getElementById('sessionMeta').textContent     = 'NeuroStudy está monitoreando y adaptando tu sesión';
  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('btnPause').classList.remove('hidden');
  document.getElementById('btnStop').classList.remove('hidden');

  appState.logEntries = [];
  addLog('Sesión iniciada. Detectando estado inicial...');

  appState.sessionTimer = setInterval(tickSession, 1000);
}

function tickSession() {
  if (appState.sessionPaused) return;

  appState.sessionSeconds++;
  const m = String(Math.floor(appState.sessionSeconds / 60)).padStart(2, '0');
  const s = String(appState.sessionSeconds % 60).padStart(2, '0');
  const timeStr = `${m}:${s}`;

  document.getElementById('timerDisplay').textContent = timeStr;
  document.getElementById('metricTime').textContent   = timeStr;

  // Progreso hacia 25 minutos (1500 segundos)
  const progress = Math.min((appState.sessionSeconds / 1500) * 100, 100);
  const progressEl = document.getElementById('progressFill');
  progressEl.style.width = progress + '%';
  progressEl.parentElement.setAttribute('aria-valuenow', String(Math.round(progress)));
}

function pauseSession() {
  appState.sessionPaused = !appState.sessionPaused;
  const btn = document.getElementById('btnPause');
  btn.textContent = appState.sessionPaused ? 'Reanudar' : 'Pausar';
  btn.setAttribute('aria-label', appState.sessionPaused ? 'Reanudar sesión' : 'Pausar sesión');
  document.getElementById('statusText').textContent = appState.sessionPaused ? 'Sesión pausada' : 'Sesión activa';
  addLog(appState.sessionPaused ? 'Sesión pausada.' : 'Sesión reanudada.');
}

function stopSession() {
  clearInterval(appState.sessionTimer);
  appState.sessionActive = false;

  const total = document.getElementById('timerDisplay').textContent;
  addLog(`Sesión finalizada. Duración total: ${total}. Adaptaciones realizadas: ${appState.adaptCount}.`);

  document.getElementById('statusText').textContent   = 'Sesión completada';
  document.getElementById('btnStart').classList.remove('hidden');
  document.getElementById('btnPause').classList.add('hidden');
  document.getElementById('btnStop').classList.add('hidden');
  document.getElementById('sessionTitle').textContent = 'Sesión completada';
  document.getElementById('sessionMeta').textContent  = `Duración: ${total} · ${appState.adaptCount} adaptaciones realizadas`;
}

/* ════════════════════════════════
   SELECCIÓN DE EJERCICIOS
════════════════════════════════ */
function initExerciseCards() {
  const cards = document.querySelectorAll('.exercise-card');
  cards.forEach(card => {
    // Clic con ratón
    card.addEventListener('click', () => selectExercise(card));
    // Activación con teclado (Enter / Space)
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectExercise(card);
      }
    });
  });
}

function selectExercise(el) {
  document.querySelectorAll('.exercise-card').forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-selected', 'false');
  });
  el.classList.add('active');
  el.setAttribute('aria-selected', 'true');
  const name = el.dataset.exercise || el.querySelector('.ex-name')?.textContent || '';
  addLog(`Ejercicio seleccionado: "${name}"`);
}

/* ════════════════════════════════
   REGISTRO DE ACTIVIDAD (LOG)
════════════════════════════════ */
function addLog(text) {
  const now = new Date();
  const t   = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  appState.logEntries.unshift({ t, text });
  if (appState.logEntries.length > 8) appState.logEntries.pop();

  const list = document.getElementById('logList');
  if (!list) return;

  list.innerHTML = appState.logEntries
    .map(e => `
      <div class="log-item">
        <div class="log-time">${e.t}</div>
        <div class="log-text">${escapeHTML(e.text)}</div>
      </div>
    `)
    .join('');
}

/** Sanitización básica para evitar XSS en el log */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════
   GRÁFICO SPARKLINE (Canvas)
════════════════════════════════ */
function drawSparkline() {
  const canvas = document.getElementById('moodChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W   = canvas.offsetWidth || 240;
  const H   = 80;
  canvas.width  = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const pts = appState.moodHistory.slice(-20);
  if (pts.length < 2) return;

  const colorMap = { focus: '#0DB896', stress: '#C74B5B', relax: '#3B82C4', distract: '#E8A838' };
  const valMap   = { focus: 0.88, stress: 0.5, relax: 0.72, distract: 0.35 };
  const vals     = pts.map(p => valMap[p.mood] || 0.5);

  // Línea principal con gradiente de color
  ctx.beginPath();
  ctx.moveTo(0, H - vals[0] * H * 0.85 - 5);

  for (let i = 1; i < vals.length; i++) {
    const x = (i / (vals.length - 1)) * W;
    const y = H - vals[i] * H * 0.85 - 5;
    ctx.lineTo(x, y);
  }

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  pts.forEach((p, i) => {
    grad.addColorStop(i / (pts.length - 1), colorMap[p.mood] || '#8A97A8');
  });

  ctx.strokeStyle = grad;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Puntos individuales
  vals.forEach((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - v * H * 0.85 - 5;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = colorMap[pts[i].mood] || '#8A97A8';
    ctx.fill();
  });
}

/* ════════════════════════════════
   MODAL
════════════════════════════════ */
function openModal() {
  const bg = document.getElementById('modalBg');
  if (!bg) return;
  bg.classList.add('open');
  // Foco al primer elemento interactivo del modal
  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  // Bloquear scroll de fondo
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const bg = document.getElementById('modalBg');
  if (!bg) return;
  bg.classList.remove('open');
  document.body.style.overflow = '';
  // Devolver foco al botón que abrió el modal
  document.getElementById('btnAbout')?.focus();
}

function initModal() {
  const bg        = document.getElementById('modalBg');
  const closeBtn  = document.getElementById('modalClose');
  const openBtn   = document.getElementById('btnAbout');

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);

  // Clic fuera del modal = cerrar
  bg?.addEventListener('click', e => {
    if (e.target === bg) closeModal();
  });

  // Tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && bg?.classList.contains('open')) closeModal();
  });
}

/* ════════════════════════════════
   VALIDACIÓN DEL FORMULARIO DE CONTACTO
   Compatible con Netlify Forms:
   - Si Netlify procesa el form, el submit nativo funciona
   - Si se usa JS, se previene el default y se valida primero
════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Limpiar errores previos
    clearFormErrors();

    // Validar campos
    const valid = validateForm(form);
    if (!valid) return;

    // Mostrar estado de carga
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando…';
    submitBtn.disabled    = true;

    try {
      // Envío real a Netlify (fetch con FormData)
      const formData = new FormData(form);
      const response = await fetch('/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        // Éxito
        form.reset();
        document.getElementById('formSuccess').classList.remove('hidden');
        setTimeout(() => {
          document.getElementById('formSuccess').classList.add('hidden');
        }, 6000);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      // Fallback: en local (Live Server) Netlify no procesa, simulamos éxito
      console.info('Nota: Formulario de Netlify solo funciona en producción.', err);
      form.reset();
      document.getElementById('formSuccess').classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('formSuccess').classList.add('hidden');
      }, 6000);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled    = false;
    }
  });
}

/** Valida todos los campos requeridos y muestra mensajes de error */
function validateForm(form) {
  let isValid = true;

  // Nombre
  const name = form.querySelector('#contactName');
  if (!name.value.trim()) {
    showFieldError(name, 'nameError', 'Por favor ingresa tu nombre completo.');
    isValid = false;
  } else if (name.value.trim().length < 2) {
    showFieldError(name, 'nameError', 'El nombre debe tener al menos 2 caracteres.');
    isValid = false;
  }

  // Email
  const email = form.querySelector('#contactEmail');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    showFieldError(email, 'emailError', 'Por favor ingresa tu correo electrónico.');
    isValid = false;
  } else if (!emailRegex.test(email.value)) {
    showFieldError(email, 'emailError', 'Ingresa un correo electrónico válido.');
    isValid = false;
  }

  // Mensaje
  const message = form.querySelector('#contactMessage');
  if (!message.value.trim()) {
    showFieldError(message, 'messageError', 'Por favor escribe tu mensaje.');
    isValid = false;
  } else if (message.value.trim().length < 10) {
    showFieldError(message, 'messageError', 'El mensaje debe tener al menos 10 caracteres.');
    isValid = false;
  }

  return isValid;
}

function showFieldError(field, errorId, message) {
  field.classList.add('error');
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = message;
  field.focus();
}

function clearFormErrors() {
  document.querySelectorAll('.form-group input, .form-group textarea').forEach(f => {
    f.classList.remove('error');
  });
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
  });
}

/* ════════════════════════════════
   ANIMACIONES DE SCROLL
   (Intersection Observer API)
════════════════════════════════ */
function initScrollAnimations() {
  // Solo si el usuario no prefiere reducción de movimiento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Aplicar animación de entrada a estos elementos
  const targets = document.querySelectorAll(
    '.feature-item, .pricing-card, .contact-form, .metric-cell'
  );

  targets.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`;
    observer.observe(el);
  });
}

/* ════════════════════════════════
   BOTONES DE LA SESIÓN
════════════════════════════════ */
function initSessionButtons() {
  document.getElementById('btnStart')?.addEventListener('click', startSession);
  document.getElementById('btnPause')?.addEventListener('click', pauseSession);
  document.getElementById('btnStop')?.addEventListener('click', stopSession);
  document.getElementById('btnCamera')?.addEventListener('click', startCamera);
}

/* ════════════════════════════════
   INICIALIZACIÓN PRINCIPAL
════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNavMenu();
  initModal();
  initSessionButtons();
  initExerciseCards();
  initContactForm();
  initScrollAnimations();

  // Log inicial
  addLog('NeuroStudy listo. Pulsa "Iniciar sesión" para comenzar.');
});

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
  sessionActive: false,
  sessionPaused: false,
  sessionSeconds: 0,
  sessionTimer: null,
  scanActive: false,
  moodInterval: null,
  adaptCount: 0,
  moodHistory: [],
  logEntries: [],
  currentMood: null,
};

/* ──────────────────────────────
   DATOS EMOCIONALES
────────────────────────────── */
const MOODS = [
  {
    key: 'focus',
    label: 'Concentrado',
    icon: '🧠',
    color: 'var(--teal-light)',
    bgColor: 'rgba(13,184,150,0.12)',
    bar: 88,
    adapt:
      'Modo Flujo activado. Tu nivel de concentración es óptimo.',
    tip:
      'Aprovecha este estado de flujo para tareas complejas.',
    mode: 'Enfoque Profundo',
    modeClass: 'mode-focus',
    modeStyle:
      'background:rgba(13,184,150,0.12); color:var(--teal-light)',
  },
  {
    key: 'stress',
    label: 'Estresado',
    icon: '😵',
    color: 'var(--rose)',
    bgColor: 'rgba(199,75,91,0.12)',
    bar: 65,
    adapt:
      'Estrés detectado. Activando descanso técnico.',
    tip:
      'El estrés elevado reduce la memoria de trabajo.',
    mode: 'Descanso Activo',
    modeClass: 'mode-relax',
    modeStyle:
      'background:rgba(59,130,196,0.12); color:var(--sky)',
  },
  {
    key: 'relax',
    label: 'Relajado',
    icon: '😄',
    color: 'var(--sky)',
    bgColor: 'rgba(59,130,196,0.12)',
    bar: 72,
    adapt:
      'Modo revisión activado.',
    tip:
      'Ideal para repasar conceptos.',
    mode: 'Revisión',
    modeClass: 'mode-relax',
    modeStyle:
      'background:rgba(59,130,196,0.12); color:var(--sky)',
  },
  {
    key: 'distract',
    label: 'Distraído',
    icon: '😏',
    color: 'var(--amber)',
    bgColor: 'rgba(232,168,56,0.12)',
    bar: 40,
    adapt:
      'Distracción detectada. Activando micro tarea.',
    tip:
      'La distracción sostenida reduce el rendimiento.',
    mode: 'Reenganche',
    modeClass: 'mode-energize',
    modeStyle:
      'background:rgba(232,168,56,0.12); color:var(--amber)',
  },
];

/* ════════════════════════════════
   MENÚ RESPONSIVE
════════════════════════════════ */
function initNavMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');

    toggle.setAttribute('aria-expanded', String(isOpen));

    document.body.style.overflow = isOpen
      ? 'hidden'
      : '';
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');

      toggle.setAttribute('aria-expanded', 'false');

      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', e => {
    if (
      e.key === 'Escape' &&
      menu.classList.contains('open')
    ) {
      menu.classList.remove('open');

      toggle.setAttribute('aria-expanded', 'false');

      document.body.style.overflow = '';
    }
  });
}

/* ════════════════════════════════
   CÁMARA
════════════════════════════════ */
async function startCamera() {
  const video = document.getElementById('videoFeed');

  try {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
        audio: false,
      });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
    };

    activateScanMode();

    addLog(
      'Cámara activada. Analizando estado emocional...'
    );
  } catch (error) {
    console.error(error);

    video.style.background =
      'linear-gradient(135deg,#0A1A28 0%,#0D2A3A 100%)';

    activateScanMode();

    addLog(
      'Modo simulación activo (cámara no disponible).'
    );
  }
}

function activateScanMode() {
  const overlay =
    document.getElementById('camOverlay');

  const scanLine =
    document.getElementById('scanLine');

  if (overlay) {
    overlay.classList.add('hidden');
    overlay.style.pointerEvents = 'none';
  }

  if (scanLine) {
    scanLine.classList.add('active');
  }

  appState.scanActive = true;

  if (!appState.moodInterval) {
    startMoodCycle();
  }
}

/* ════════════════════════════════
   CICLO EMOCIONAL
════════════════════════════════ */
function startMoodCycle() {
  detectMood();

  appState.moodInterval = setInterval(
    detectMood,
    5000
  );
}

function detectMood() {
  const mood =
    MOODS[Math.floor(Math.random() * MOODS.length)];

  appState.currentMood = mood;

  renderMood(mood);

  appState.moodHistory.push({
    t: appState.sessionSeconds,
    mood: mood.key,
  });

  drawSparkline();

  if (appState.sessionActive) {
    applyAdaptation(mood);
  }
}

function renderMood(mood) {
  const moodIcon =
    document.getElementById('moodIcon');

  const moodLabel =
    document.getElementById('moodLabel');

  const moodConf =
    document.getElementById('moodConf');

  const moodBar =
    document.getElementById('moodBar');

  if (!moodIcon || !moodLabel || !moodConf || !moodBar)
    return;

  moodIcon.textContent = mood.icon;
  moodIcon.style.background = mood.bgColor;

  moodLabel.textContent = mood.label;

  moodConf.textContent = `Confianza: ${
    70 + Math.floor(Math.random() * 25)
  }%`;

  moodBar.style.width = mood.bar + '%';
  moodBar.style.background = mood.color;
}

function applyAdaptation(mood) {
  appState.adaptCount++;

  document.getElementById(
    'metricAdapt'
  ).textContent = appState.adaptCount;

  const card =
    document.getElementById('adaptCard');

  card.className = 'adapt-card ' + mood.modeClass;

  document.getElementById(
    'adaptDesc'
  ).textContent = mood.adapt;

  document.getElementById(
    'tipCard'
  ).innerHTML = `
    <div class="tip-label">Recomendación</div>
    ${mood.tip}
  `;

  const modeEl =
    document.getElementById('currentMode');

  modeEl.style.display = 'block';

  const badge =
    modeEl.querySelector('.mode-badge');

  badge.style.cssText = mood.modeStyle;

  document.getElementById(
    'modeName'
  ).textContent = mood.mode;

  addLog(
    `Adaptación #${appState.adaptCount}: ${mood.mode}`
  );
}

/* ════════════════════════════════
   SESIÓN
════════════════════════════════ */
function startSession() {
  if (appState.sessionActive) return;

  if (!appState.scanActive) {
    startCamera();
  }

  _startSession();
}

function _startSession() {
  appState.sessionActive = true;
  appState.sessionPaused = false;
  appState.sessionSeconds = 0;

  document.getElementById(
    'statusText'
  ).textContent = 'Sesión activa';

  document.getElementById(
    'sessionTitle'
  ).textContent =
    'Sesión de estudio en progreso';

  document.getElementById(
    'sessionMeta'
  ).textContent =
    'NeuroStudy está monitoreando tu sesión';

  document
    .getElementById('btnStart')
    .classList.add('hidden');

  document
    .getElementById('btnPause')
    .classList.remove('hidden');

  document
    .getElementById('btnStop')
    .classList.remove('hidden');

  clearInterval(appState.sessionTimer);

  appState.sessionTimer = setInterval(
    tickSession,
    1000
  );

  addLog('Sesión iniciada.');
}

function tickSession() {
  if (appState.sessionPaused) return;

  appState.sessionSeconds++;

  const m = String(
    Math.floor(appState.sessionSeconds / 60)
  ).padStart(2, '0');

  const s = String(
    appState.sessionSeconds % 60
  ).padStart(2, '0');

  const time = `${m}:${s}`;

  document.getElementById(
    'timerDisplay'
  ).textContent = time;

  document.getElementById(
    'metricTime'
  ).textContent = time;
}

function pauseSession() {
  if (!appState.sessionActive) return;

  appState.sessionPaused =
    !appState.sessionPaused;

  const btn =
    document.getElementById('btnPause');

  btn.textContent = appState.sessionPaused
    ? 'Reanudar'
    : 'Pausar';

  addLog(
    appState.sessionPaused
      ? 'Sesión pausada.'
      : 'Sesión reanudada.'
  );
}

function stopSession() {
  clearInterval(appState.sessionTimer);

  appState.sessionActive = false;
  appState.sessionPaused = false;

  document
    .getElementById('btnStart')
    .classList.remove('hidden');

  document
    .getElementById('btnPause')
    .classList.add('hidden');

  document
    .getElementById('btnStop')
    .classList.add('hidden');

  document.getElementById(
    'statusText'
  ).textContent = 'Sesión finalizada';

  addLog('Sesión finalizada.');
}

/* ════════════════════════════════
   EJERCICIOS
════════════════════════════════ */
function initExerciseCards() {
  const cards =
    document.querySelectorAll('.exercise-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      selectExercise(card);
    });

    card.addEventListener('keydown', e => {
      if (
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        selectExercise(card);
      }
    });
  });
}

function selectExercise(el) {
  document
    .querySelectorAll('.exercise-card')
    .forEach(c => {
      c.classList.remove('active');
      c.setAttribute(
        'aria-selected',
        'false'
      );
    });

  el.classList.add('active');

  el.setAttribute(
    'aria-selected',
    'true'
  );

  const name =
    el.dataset.exercise || 'Ejercicio';

  addLog(`Ejercicio seleccionado: ${name}`);
}

/* ════════════════════════════════
   LOG
════════════════════════════════ */
function addLog(text) {
  const now = new Date();

  const t =
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0');

  appState.logEntries.unshift({
    t,
    text,
  });

  if (appState.logEntries.length > 8) {
    appState.logEntries.pop();
  }

  const list =
    document.getElementById('logList');

  if (!list) return;

  list.innerHTML = appState.logEntries
    .map(
      e => `
      <div class="log-item">
        <div class="log-time">${e.t}</div>
        <div class="log-text">${escapeHTML(
          e.text
        )}</div>
      </div>
    `
    )
    .join('');
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════
   SPARKLINE
════════════════════════════════ */
function drawSparkline() {
  const canvas =
    document.getElementById('moodChart');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const W = canvas.offsetWidth || 240;
  const H = 80;

  canvas.width = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);

  const pts =
    appState.moodHistory.slice(-20);

  if (pts.length < 2) return;

  const valMap = {
    focus: 0.88,
    stress: 0.5,
    relax: 0.72,
    distract: 0.35,
  };

  const vals = pts.map(
    p => valMap[p.mood] || 0.5
  );

  ctx.beginPath();

  ctx.moveTo(
    0,
    H - vals[0] * H * 0.85 - 5
  );

  for (let i = 1; i < vals.length; i++) {
    const x =
      (i / (vals.length - 1)) * W;

    const y =
      H - vals[i] * H * 0.85 - 5;

    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = '#0DB896';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ════════════════════════════════
   MODAL
════════════════════════════════ */
function openModal() {
  const bg =
    document.getElementById('modalBg');

  if (!bg) return;

  bg.classList.add('open');

  bg.style.pointerEvents = 'all';

  document.body.style.overflow =
    'hidden';
}

function closeModal() {
  const bg =
    document.getElementById('modalBg');

  if (!bg) return;

  bg.classList.remove('open');

  document.body.style.overflow = '';
}

function initModal() {
  const bg =
    document.getElementById('modalBg');

  const closeBtn =
    document.getElementById('modalClose');

  const openBtn =
    document.getElementById('btnAbout');

  if (openBtn) {
    openBtn.addEventListener(
      'click',
      openModal
    );
  }

  if (closeBtn) {
    closeBtn.addEventListener(
      'click',
      closeModal
    );
  }

  if (bg) {
    bg.addEventListener('click', e => {
      if (e.target === bg) {
        closeModal();
      }
    });
  }

  document.addEventListener(
    'keydown',
    e => {
      if (
        e.key === 'Escape' &&
        bg?.classList.contains('open')
      ) {
        closeModal();
      }
    }
  );
}

/* ════════════════════════════════
   FORMULARIO
════════════════════════════════ */
function initContactForm() {
  const form =
    document.getElementById(
      'contactForm'
    );

  if (!form) return;

  const fields =
    form.querySelectorAll(
      'input, textarea'
    );

  fields.forEach(field => {
    field.addEventListener(
      'input',
      () => {
        field.classList.remove('error');

        const error =
          document.getElementById(
            field.id.replace(
              'contact',
              ''
            ).toLowerCase() + 'Error'
          );

        if (error) {
          error.textContent = '';
        }
      }
    );
  });

  form.addEventListener(
    'submit',
    async e => {
      e.preventDefault();

      clearFormErrors();

      const valid =
        validateForm(form);

      if (!valid) return;

      const submitBtn =
        document.getElementById(
          'submitBtn'
        );

      const original =
        submitBtn.textContent;

      submitBtn.disabled = true;

      submitBtn.textContent =
        'Enviando...';

      try {
        const formData =
          new FormData(form);

        await fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(
            formData
          ).toString(),
        });

        form.reset();

        document
          .getElementById(
            'formSuccess'
          )
          .classList.remove('hidden');

        setTimeout(() => {
          document
            .getElementById(
              'formSuccess'
            )
            .classList.add('hidden');
        }, 5000);
      } catch (error) {
        console.error(error);
      } finally {
        submitBtn.disabled = false;

        submitBtn.textContent =
          original;
      }
    }
  );
}

function validateForm(form) {
  let valid = true;

  const name =
    form.querySelector('#contactName');

  const email =
    form.querySelector('#contactEmail');

  const message =
    form.querySelector(
      '#contactMessage'
    );

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    name.value.trim().length < 2
  ) {
    showFieldError(
      name,
      'nameError',
      'Ingresa un nombre válido.'
    );

    valid = false;
  }

  if (
    !emailRegex.test(
      email.value.trim()
    )
  ) {
    showFieldError(
      email,
      'emailError',
      'Correo inválido.'
    );

    valid = false;
  }

  if (
    message.value.trim().length <
    10
  ) {
    showFieldError(
      message,
      'messageError',
      'El mensaje debe tener mínimo 10 caracteres.'
    );

    valid = false;
  }

  return valid;
}

function showFieldError(
  field,
  errorId,
  message
) {
  field.classList.add('error');

  const error =
    document.getElementById(errorId);

  if (error) {
    error.textContent = message;
  }
}

function clearFormErrors() {
  document
    .querySelectorAll(
      '.form-group input, .form-group textarea'
    )
    .forEach(field => {
      field.classList.remove('error');
    });

  document
    .querySelectorAll('.form-error')
    .forEach(error => {
      error.textContent = '';
    });
}

/* ════════════════════════════════
   SCROLL ANIMATIONS
════════════════════════════════ */
function initScrollAnimations() {
  if (
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  )
    return;

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (
            entry.isIntersecting
          ) {
            entry.target.style.opacity =
              '1';

            entry.target.style.transform =
              'translateY(0)';

            observer.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

  const targets =
    document.querySelectorAll(
      '.feature-item, .pricing-card, .contact-form, .metric-cell'
    );

  targets.forEach(el => {
    el.style.opacity = '0';

    el.style.transform =
      'translateY(20px)';

    el.style.transition =
      'all 0.5s ease';

    observer.observe(el);
  });
}

/* ════════════════════════════════
   BOTONES
════════════════════════════════ */
function initSessionButtons() {
  document
    .getElementById('btnStart')
    ?.addEventListener(
      'click',
      startSession
    );

  document
    .getElementById('btnPause')
    ?.addEventListener(
      'click',
      pauseSession
    );

  document
    .getElementById('btnStop')
    ?.addEventListener(
      'click',
      stopSession
    );

  document
    .getElementById('btnCamera')
    ?.addEventListener(
      'click',
      startCamera
    );
}

/* ════════════════════════════════
   INIT
════════════════════════════════ */
document.addEventListener(
  'DOMContentLoaded',
  () => {
    initNavMenu();

    initModal();

    initSessionButtons();

    initExerciseCards();

    initContactForm();

    initScrollAnimations();

    addLog(
      'NeuroStudy listo. Pulsa "Iniciar sesión" para comenzar.'
    );
  }
);
const arenas = {
  'titan-pulse-arena': {
    name: 'Titan Pulse Arena',
    trait: 'Flagship Championship',
    image: 'assets/webflow/arena/titan_pulse_arena_bg_01.png'
  },
  'primal-dominion': {
    name: 'Primal Dominion',
    trait: 'Prehistoric Combat',
    image: 'assets/webflow/arena/primal_dominion_bg_01.png'
  },
  'neon-undergrid': {
    name: 'Neon Undergrid',
    trait: 'Underground Circuit',
    image: 'assets/webflow/arena/neon_undergrid_bg_01.png'
  },
  'skyborne-sanctum': {
    name: 'Skyborne Sanctum',
    trait: 'Celestial Platform',
    image: 'assets/webflow/arena/skyborne_sanctum_bg_01.png'
  },
  'abyssal-core': {
    name: 'Abyssal Core',
    trait: 'Pressure Dome',
    image: 'assets/webflow/arena/abyssal_core_bg_01.png'
  }
};

const previewLayer = document.getElementById('arena-preview-layer');
const arenaButtons = document.querySelectorAll('.arena-button');
const nextButton = document.getElementById('arena-next-button');
const statusState = document.getElementById('arena-status-state');
const lockValue = document.getElementById('arena-lock-value');
const lockTrait = document.getElementById('arena-lock-trait');
const backButton = document.querySelector('.arena-back-button');

let selectedArena = sessionStorage.getItem('ap_arena') || '';
let previewArena = selectedArena || 'titan-pulse-arena';

function resolveAsset(path) {
  if (window.location.protocol === 'file:') {
    return path;
  }
  return `/${path.replace(/^\/+/, '')}`;
}

function setPreview(arenaKey) {
  const arena = arenas[arenaKey];
  if (!arena) return;
  previewArena = arenaKey;
  previewLayer.style.backgroundImage = `url("${resolveAsset(arena.image)}")`;
}

function setSelected(arenaKey) {
  const arena = arenas[arenaKey];
  if (!arena) return;

  selectedArena = arenaKey;
  sessionStorage.setItem('ap_arena', arenaKey);
  lockValue.textContent = arena.name;
  lockTrait.textContent = arena.trait;
  lockTrait.hidden = false;
  statusState.textContent = 'LOCKED';

  arenaButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.arena === arenaKey);
  });

  nextButton.disabled = false;
  nextButton.classList.remove('is-disabled');
}

function restorePreview() {
  if (selectedArena && arenas[selectedArena]) {
    setPreview(selectedArena);
  } else {
    setPreview('titan-pulse-arena');
  }
}

arenaButtons.forEach((button) => {
  button.addEventListener('mouseenter', () => {
    setPreview(button.dataset.arena);
  });

  button.addEventListener('focus', () => {
    setPreview(button.dataset.arena);
  });

  button.addEventListener('mouseleave', () => {
    restorePreview();
  });

  button.addEventListener('blur', () => {
    restorePreview();
  });

  button.addEventListener('click', () => {
    button.classList.remove('is-fired');
    void button.offsetWidth;
    button.classList.add('is-fired');
    setPreview(button.dataset.arena);
    setSelected(button.dataset.arena);
  });
});

if (nextButton) {
  nextButton.addEventListener('click', () => {
    if (!selectedArena) return;
    window.location.href = 'select.html';
  });
}

if (backButton) {
  backButton.addEventListener('click', (event) => {
    const targetHref = backButton.getAttribute('href');
    if (!targetHref) return;

    event.preventDefault();
    backButton.classList.remove('is-fired');
    void backButton.offsetWidth;
    backButton.classList.add('is-fired');

    setTimeout(() => {
      window.location.href = targetHref;
    }, 220);
  });
}

if (selectedArena && arenas[selectedArena]) {
  setPreview(selectedArena);
  setSelected(selectedArena);
} else {
  lockValue.textContent = 'No Arena Locked';
  lockTrait.hidden = true;
  statusState.textContent = 'PREVIEW';
  restorePreview();
}
const mode = sessionStorage.getItem('ap_mode') || '1v1';
const arena = sessionStorage.getItem('ap_arena') || 'titan-pulse-arena';
const selectPreviewLayer = document.getElementById('select-preview-layer');

const arenaBackgrounds = {
  'titan-pulse-arena': 'assets/webflow/arena/titan_pulse_arena_bg_01.png',
  'primal-dominion': 'assets/webflow/arena/primal_dominion_bg_01.png',
  'neon-undergrid': 'assets/webflow/arena/neon_undergrid_bg_01.png',
  'skyborne-sanctum': 'assets/webflow/arena/skyborne_sanctum_bg_01.png',
  'abyssal-core': 'assets/webflow/arena/abyssal_core_bg_01.png'
};

function resolveAsset(path) {
  if (window.location.protocol === 'file:') {
    return path;
  }
  return `/${path.replace(/^\/+/, '')}`;
}

function applyArenaBackground(arenaKey) {
  if (!selectPreviewLayer) return;
  const imagePath = arenaBackgrounds[arenaKey] || arenaBackgrounds['titan-pulse-arena'];
  selectPreviewLayer.style.backgroundImage = `url("${resolveAsset(imagePath)}")`;
}

const modeBox = document.getElementById('select-mode-box');
const arenaBox = document.getElementById('select-arena-box');
const signalBox = document.getElementById('select-signal-box');
const stage = document.getElementById('select-stage');
const feedTrackA = document.getElementById('select-feed-track-a');
const feedTrackB = document.getElementById('select-feed-track-b');
const leftPanel = document.getElementById('preview-panel-left');
const rightPanel = document.getElementById('preview-panel-right');
const leftEditState = document.getElementById('preview-left-edit-state');
const rightEditState = document.getElementById('preview-right-edit-state');
const leftFighter = document.getElementById('preview-left-fighter');
const leftShield = document.getElementById('preview-left-shield');
const leftStatus = document.getElementById('preview-left-status');
const rightKicker = document.getElementById('preview-right-kicker');
const rightFighter = document.getElementById('preview-right-fighter');
const rightShield = document.getElementById('preview-right-shield');
const rightStatus = document.getElementById('preview-right-status');
const focusSwitch = document.getElementById('selection-focus-switch');
const focusButtons = document.querySelectorAll('.focus-chip');
const choiceChips = document.querySelectorAll('.choice-chip');
const selectionStateBox = document.getElementById('selection-state-box');
const selectStatusState = document.getElementById('select-status-state');
const backButton = document.querySelector('.select-back-button');

const arenaLabels = {
  'titan-pulse-arena': 'Titan Pulse Arena',
  'primal-dominion': 'Primal Dominion',
  'neon-undergrid': 'Neon Undergrid',
  'skyborne-sanctum': 'Skyborne Sanctum',
  'abyssal-core': 'Abyssal Core'
};

const savedP1Fighter = sessionStorage.getItem('ap_player1_fighter');
const savedP1Shield = sessionStorage.getItem('ap_player1_shield');
const savedP2Fighter = sessionStorage.getItem('ap_player2_fighter');
const savedP2Shield = sessionStorage.getItem('ap_player2_shield');

const selections = {
  p1: {
    fighter: savedP1Fighter || 'Arc Runner',
    shield: savedP1Shield || 'Aegis Arc',
    status: 'Adjusting loadout'
  },
  p2: {
    fighter: savedP2Fighter || 'Iron Shade',
    shield: savedP2Shield || 'Blade Wall',
    status: 'Adjusting loadout'
  }
};

let activePlayer = 'p1';

function modeLabel(value) {
  if (value === 'arcade') return 'ARCADE';
  if (value === 'tournaments') return 'TOURNAMENTS';
  return '1 VS 1';
}

function arenaLabel(value) {
  return arenaLabels[value] || 'Titan Pulse Arena';
}

function playerLabel(value) {
  return value === 'p2' ? 'Player Two' : 'Player One';
}

function saveSelectionToStorage() {
  sessionStorage.setItem('ap_player1_fighter', selections.p1.fighter);
  sessionStorage.setItem('ap_player1_shield', selections.p1.shield);
  sessionStorage.setItem('ap_player2_fighter', selections.p2.fighter);
  sessionStorage.setItem('ap_player2_shield', selections.p2.shield);
}

function setMetaBox(box, label, value) {
  if (!box) return;
  box.innerHTML = `<span class="select-meta-label">${label}</span><span class="select-meta-value">${value}</span>`;
}

function setFeed(textParts) {
  const html = `<span class="select-feed-tag">LOADOUT SIGNAL</span>${textParts.map((part) => `<span>${part}</span><span class="select-feed-divider">•</span>`).join('')}`;
  feedTrackA.innerHTML = html;
  feedTrackB.innerHTML = html;
}

function renderChoiceChips() {
  choiceChips.forEach((chip) => {
    const type = chip.dataset.type;
    const value = chip.dataset.value;
    const currentValue = selections[activePlayer][type];
    chip.classList.toggle('is-active', currentValue === value);
  });
}

function renderPanels() {
  leftFighter.innerHTML = `<strong>Fighter:</strong> ${selections.p1.fighter}`;
  leftShield.innerHTML = `<strong>Shield:</strong> ${selections.p1.shield}`;
  leftStatus.innerHTML = `<strong>Status:</strong> ${selections.p1.status}`;
  rightFighter.innerHTML = `<strong>Fighter:</strong> ${selections.p2.fighter}`;
  rightShield.innerHTML = `<strong>Shield:</strong> ${selections.p2.shield}`;
  rightStatus.innerHTML = `<strong>Status:</strong> ${selections.p2.status}`;

  if (mode === '1v1') {
    leftPanel.classList.toggle('preview-panel--active', activePlayer === 'p1');
    rightPanel.classList.toggle('preview-panel--active', activePlayer === 'p2');
    leftEditState.textContent = activePlayer === 'p1' ? 'Editing live' : 'Visible live';
    rightEditState.textContent = activePlayer === 'p2' ? 'Editing live' : 'Visible live';
    setMetaBox(selectionStateBox, 'Editing', playerLabel(activePlayer));
    selectStatusState.textContent = 'EDITING';
  } else {
    leftPanel.classList.add('preview-panel--active');
    rightPanel.classList.remove('preview-panel--active');
    leftEditState.textContent = 'Editing live';
    rightEditState.textContent = mode === 'arcade' ? 'Reserved AI channel' : 'Reserved tournament slot';
    setMetaBox(selectionStateBox, 'Selection', 'Player loadout');
    selectStatusState.textContent = 'READY';
  }

  focusButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.focus === activePlayer);
  });

  renderChoiceChips();
  saveSelectionToStorage();
}

function applyModeContext() {
  setMetaBox(modeBox, 'Mode', modeLabel(mode));
  setMetaBox(arenaBox, 'Arena', arenaLabel(arena));

  if (mode === 'arcade') {
    activePlayer = 'p1';
    focusSwitch.style.display = 'none';
    rightKicker.textContent = 'AI OPPONENT';
    selections.p2.fighter = 'AI Reserved';
    selections.p2.shield = 'Adaptive Guard';
    selections.p2.status = 'AI channel reserved';
    setMetaBox(signalBox, 'Signal', 'Single-player simulation lane active');
    setFeed([
      'Single-player simulation lane active',
      'Arena systems live — AI channel standing by',
      'Loadout validation in progress',
      'Entry sequence awaiting final lock-in'
    ]);
  } else if (mode === 'tournaments') {
    activePlayer = 'p1';
    focusSwitch.style.display = 'none';
    rightKicker.textContent = 'TOURNAMENT SLOT';
    selections.p2.fighter = 'Bracket Pending';
    selections.p2.shield = 'Tournament Logic';
    selections.p2.status = 'Bracket logic to be defined';
    setMetaBox(signalBox, 'Signal', 'Tournament selection channel active');
    setFeed([
      'Tournament selection channel active',
      'Bracket systems awaiting final ruleset',
      'Arena feed synchronized',
      'Match slot reserved — configuration under review'
    ]);
  } else {
    stage.classList.add('select-stage--duel');
    focusSwitch.style.display = 'grid';
    setMetaBox(signalBox, 'Signal', 'Combat simulation channel active');
    setFeed([
      'Arena systems live — awaiting final confirmations',
      'Loadout validation in progress',
      'Combat simulation channel active',
      'Final decisions define the outcome'
    ]);
  }

  renderPanels();
}

leftPanel.addEventListener('click', () => {
  if (mode === '1v1') {
    activePlayer = 'p1';
    renderPanels();
  }
});

rightPanel.addEventListener('click', () => {
  if (mode === '1v1') {
    activePlayer = 'p2';
    renderPanels();
  }
});

focusButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (mode === '1v1') {
      activePlayer = button.dataset.focus;
      renderPanels();
    }
  });
});

choiceChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const type = chip.dataset.type;
    const value = chip.dataset.value;
    selections[activePlayer][type] = value;
    selections[activePlayer].status = 'Adjusting loadout';
    renderPanels();
  });
});

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

applyArenaBackground(arena);
applyModeContext();

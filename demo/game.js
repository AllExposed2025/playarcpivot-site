const GAME_WIDTH = 960;
const GAME_HEIGHT = 620;

const ARENA_LEFT = 20;
const ARENA_RIGHT = 940;
const ARENA_TOP = 110;
const ARENA_BOTTOM = 600;

const ARENA_CENTER_X = (ARENA_LEFT + ARENA_RIGHT) / 2;
const ARENA_CENTER_Y = (ARENA_TOP + ARENA_BOTTOM) / 2;

const UNIT_SPEED = 360;

const HORIZONTAL_SPEED_FACTOR = 0.55;
const HORIZONTAL_SPEED = UNIT_SPEED * HORIZONTAL_SPEED_FACTOR;

const LEFT_START_X = 76;
const RIGHT_START_X = 884;

const LANE_BACK_PADDING = 56;
const LANE_FRONT_GAP = 66;
const FIGHTER_Y_PADDING = 60;

const PRESSURE_DEEP_THRESHOLD = 0.30;
const PRESSURE_FORWARD_THRESHOLD = 0.72;

const FORWARD_RETURN_SPEED_BONUS = 1.14;
const FORWARD_VERTICAL_BONUS = 1.10;

const DEEP_RETURN_SPEED_PENALTY = 0.90;
const DEEP_VERTICAL_PENALTY = 0.86;
const RALLY_HITS_PER_STEP = 2;
const RALLY_SPEED_STEP = 0.04;
const MAX_RALLY_SPEED_MULTIPLIER = 1.30;
const AI_SETTINGS = {
  easy: {
    label: 'Easy',
    speedMultiplier: 0.58,
    reactionMs: 360,
    attackBias: 0.10,
    interceptBias: 0.42,
    errorMargin: 52,
    deadZone: 32,
    targetLerp: 0.16,
    forwardCommit: 0.28,
    xErrorMargin: 26,
    frontExposureError: 26
  },
  medium: {
    label: 'Medium',
    speedMultiplier: 0.80,
    reactionMs: 210,
    attackBias: 0.22,
    interceptBias: 0.64,
    errorMargin: 20,
    deadZone: 16,
    targetLerp: 0.24,
    forwardCommit: 0.42,
    xErrorMargin: 14,
    frontExposureError: 14
  },
  hard: {
    label: 'Hard',
    speedMultiplier: 0.94,
    reactionMs: 105,
    attackBias: 0.36,
    interceptBias: 0.76,
    errorMargin: 10,
    deadZone: 11,
    targetLerp: 0.30,
    forwardCommit: 0.56,
    xErrorMargin: 8,
    frontExposureError: 10
  }
};

const SHIELD_WIDTH = 16;
const SHIELD_HEIGHT = 96;
const SHIELD_OFFSET = 18;
const BODY_RADIUS = 18;

const CORE_RADIUS = 12;
const START_CORE_SPEED_X = 320;
const START_CORE_SPEED_Y = 205;

// Gameplay feel tuning
const MIN_HORIZONTAL_SPEED = 320;
const MAX_VERTICAL_RATIO = 1.15;

const GOAL_WIDTH = 14;
const GOAL_HEIGHT = 175;
const GOAL_TOP = ARENA_CENTER_Y - GOAL_HEIGHT / 2;
const GOAL_BOTTOM = ARENA_CENTER_Y + GOAL_HEIGHT / 2;

const POST_RADIUS = 12;
const NET_DEPTH = 34;

let sceneRef;

let leftFighter;
let rightFighter;

let core;
let coreGlow;
let coreInner;

let trailDots = [];
let trailHistory = [];
let trailActiveTime = 0;

let leftGoalFlash;
let rightGoalFlash;

let leftScoreOrb;
let rightScoreOrb;
let leftScoreText;
let rightScoreText;

let centerOverlayBg;
let centerOverlayBorder;
let centerOverlayTitle;
let centerOverlaySub;
let centerOverlayBadge;
let centerOverlayBadgeText;
let centerOverlayPulse;
let centerOverlayPulse2;
let centerComboText;

let screenFlash;
let arenaGlow;

let leftKeys;
let cursors;

let aiDifficultyKey = 'medium';
let aiDifficulty = AI_SETTINGS[aiDifficultyKey];
let aiTargetX = RIGHT_START_X;
let aiTargetY = ARENA_CENTER_Y;
let aiDesiredTargetX = RIGHT_START_X;
let aiDesiredTargetY = ARENA_CENTER_Y;
let aiDecisionTimer = 0;
let aiHudText;
let aiUiStatus;
let aiUiButtons = [];

let sideUiStatus;
let sideUiButtons = [];

let touchHand = 'right';
let touchUiStatus;
let touchUiButtons = [];
let touchDevice = false;

let touchOverlayEl;
let touchPadEl;
let touchPadThumbEl;

let gameShellEl;
let gameTitleEl;
let arcadeControlsEl;
let gameStageEl;
let gameContainerEl


let playerSide = 'left';
let aiSide = 'right';

let humanFighter = null;
let aiFighter = null;

let touchState = {
  active: false,
  pointerId: null,
  inputX: 0,
  inputY: 0,
  centerX: 0,
  centerY: 0,
  radius: 64
};

let leftScore = 0;
let rightScore = 0;

let streakOwner = null;
let streakCount = 0;

let coreVelocityX = START_CORE_SPEED_X;
let coreVelocityY = START_CORE_SPEED_Y;

let rallyHitCount = 0;
let rallySpeedMultiplier = 1;

let roundPaused = false;
let postHitCooldown = 0;
let fighterHitCooldown = 0;

let goalPosts = [];

let audioCtx = null;
let audioUnlocked = false;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0b0f14',
  scale: {
    parent: 'game-container',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 768,
      height: 496
    },
    max: {
      width: 1600,
      height: 1033
    }
  },
  scene: {
    create: create,
    update: update
  }
};

new Phaser.Game(config);

function create() {
  sceneRef = this;
  drawArena();
  createExternalScoreboard();
  createGoalsAndPosts();
  createFighters();
  createCore();
  createHelpText();
  createHeroGoalOverlay();
  createInput();
  createAIDifficultyDisplay();
  initArcadeSideUI();
  initAIDifficultyUI();
  initTouchUI();
  initStageAutoFit();
  setPlayerSide('left');
  setTouchHand('right');
  resetFighterPositions();
  setAIDifficulty('medium');
  resetCore(true);
}

function update(time, delta) {
  const dt = delta / 1000;

  updateTrail(dt);

  if (postHitCooldown > 0) {
    postHitCooldown -= delta;
  }

  if (fighterHitCooldown > 0) {
    fighterHitCooldown -= delta;
  }

  if (roundPaused) {
    return;
  }

  moveHumanFighter(dt);
  moveAIOpponent(dt, delta);
  moveCore(dt);
}


function drawArena() {
  const scene = sceneRef;

  // Achtergrond
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0f14);

  // Titel
  scene.add.text(ARENA_CENTER_X, 26, 'ARCPIVOT RUSH DUEL', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);

  // Neutrale premium vloer
  drawNeutralArenaSurface(scene);

  // Buitenrand arena
  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(ARENA_LEFT, ARENA_TOP, ARENA_RIGHT - ARENA_LEFT, ARENA_BOTTOM - ARENA_TOP);

  // Glow rand
  arenaGlow = scene.add.rectangle(
    ARENA_CENTER_X,
    ARENA_CENTER_Y,
    (ARENA_RIGHT - ARENA_LEFT) + 10,
    (ARENA_BOTTOM - ARENA_TOP) + 10,
    0xf5a524,
    0
  );
  arenaGlow.setStrokeStyle(2, 0xf5a524, 0.25);

  // Middenlijn clean
  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.22);
  middle.lineBetween(ARENA_CENTER_X, ARENA_TOP + 12, ARENA_CENTER_X, ARENA_BOTTOM - 12);

  // Subtiele middenring
  const centerRing = scene.add.graphics();
  centerRing.lineStyle(2, 0xf5a524, 0.12);
  centerRing.strokeCircle(ARENA_CENTER_X, ARENA_CENTER_Y, 42);

  // Hoekaccenten
  drawCornerAccent(scene, ARENA_LEFT + 14, ARENA_TOP + 14, 'tl');
  drawCornerAccent(scene, ARENA_RIGHT - 14, ARENA_TOP + 14, 'tr');
  drawCornerAccent(scene, ARENA_LEFT + 14, ARENA_BOTTOM - 14, 'bl');
  drawCornerAccent(scene, ARENA_RIGHT - 14, ARENA_BOTTOM - 14, 'br');

  // Schermflash
  screenFlash = scene.add.rectangle(ARENA_CENTER_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xf5a524, 0);
  screenFlash.setDepth(900);
}

function drawNeutralArenaSurface(scene) {
  const width = ARENA_RIGHT - ARENA_LEFT;
  const height = ARENA_BOTTOM - ARENA_TOP;

  // Basisvloer
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y, width, height, 0x111821, 1);

  // Subtiele horizontale gelaagdheid
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y - 120, width, 80, 0x131c27, 0.85);
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y, width, 120, 0x101720, 0.7);
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y + 130, width, 90, 0x151e2a, 0.75);

  // Lichtbanden
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y - 165, width - 40, 2, 0xf5a524, 0.08);
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y + 165, width - 40, 2, 0xf5a524, 0.08);

  // Verticale subtiele lanes
  for (let i = 0; i < 6; i++) {
    const x = ARENA_LEFT + 100 + i * 130;
    scene.add.rectangle(x, ARENA_CENTER_Y, 2, height - 40, 0xf5f7fa, 0.02);
  }

  // Vignette / diepte
  scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y, width, height, 0x000000, 0.08);
}

function drawCornerAccent(scene, x, y, corner) {
  const g = scene.add.graphics();
  g.lineStyle(2, 0xf5a524, 0.5);

  if (corner === 'tl') {
    g.lineBetween(x, y, x + 18, y);
    g.lineBetween(x, y, x, y + 18);
  }

  if (corner === 'tr') {
    g.lineBetween(x, y, x - 18, y);
    g.lineBetween(x, y, x, y + 18);
  }

  if (corner === 'bl') {
    g.lineBetween(x, y, x + 18, y);
    g.lineBetween(x, y, x, y - 18);
  }

  if (corner === 'br') {
    g.lineBetween(x, y, x - 18, y);
    g.lineBetween(x, y, x, y - 18);
  }
}

function createExternalScoreboard() {
  const scene = sceneRef;

  const hanger = scene.add.graphics();
  hanger.lineStyle(2, 0xf5a524, 0.4);
  hanger.lineBetween(300, 36, 300, 66);
  hanger.lineBetween(660, 36, 660, 66);
  hanger.lineBetween(300, 36, 660, 36);

  const labelBg = scene.add.rectangle(480, 60, 220, 26, 0x0b0f14, 0.8);
  labelBg.setStrokeStyle(1, 0xf5a524, 0.35);

  scene.add.text(480, 60, 'ARENA SCOREBOARD', {
    fontFamily: 'Courier New',
    fontSize: '14px',
    color: '#f5a524'
  }).setOrigin(0.5);

  leftScoreOrb = scene.add.circle(300, 82, 28, 0x172133, 1);
  leftScoreOrb.setStrokeStyle(2, 0xf5a524, 0.8);
  scene.add.circle(292, 74, 8, 0xf5f7fa, 0.06);

  rightScoreOrb = scene.add.circle(660, 82, 28, 0x172133, 1);
  rightScoreOrb.setStrokeStyle(2, 0xf5a524, 0.8);
  scene.add.circle(652, 74, 8, 0xf5f7fa, 0.06);

  leftScoreText = scene.add.text(300, 82, '0', {
    fontFamily: 'Courier New',
    fontSize: '28px',
    color: '#f5f7fa'
  }).setOrigin(0.5);

  rightScoreText = scene.add.text(660, 82, '0', {
    fontFamily: 'Courier New',
    fontSize: '28px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
}

function createGoalsAndPosts() {
  const scene = sceneRef;

  drawGoalNet(scene, 'left');
  drawGoalNet(scene, 'right');

  // Doelmodules
  const leftGoalFrame = scene.add.graphics();
  leftGoalFrame.lineStyle(1, 0xf5a524, 0.45);
  leftGoalFrame.strokeRect(ARENA_LEFT - NET_DEPTH, GOAL_TOP, NET_DEPTH, GOAL_HEIGHT);

  const rightGoalFrame = scene.add.graphics();
  rightGoalFrame.lineStyle(1, 0xf5a524, 0.45);
  rightGoalFrame.strokeRect(ARENA_RIGHT, GOAL_TOP, NET_DEPTH, GOAL_HEIGHT);

  leftGoalFlash = scene.add.rectangle(
    ARENA_LEFT - NET_DEPTH / 2,
    ARENA_CENTER_Y,
    NET_DEPTH + 60,
    GOAL_HEIGHT + 50,
    0xf5a524,
    0
  );

  rightGoalFlash = scene.add.rectangle(
    ARENA_RIGHT + NET_DEPTH / 2,
    ARENA_CENTER_Y,
    NET_DEPTH + 60,
    GOAL_HEIGHT + 50,
    0xf5a524,
    0
  );

  // Palen exact op lijn
  goalPosts = [
    createGoalPost(ARENA_LEFT, GOAL_TOP),
    createGoalPost(ARENA_LEFT, GOAL_BOTTOM),
    createGoalPost(ARENA_RIGHT, GOAL_TOP),
    createGoalPost(ARENA_RIGHT, GOAL_BOTTOM)
  ];

  // Achterlijnen met gaten rondom palen
  drawGoalLineWithPostGaps();
}

function drawGoalLineWithPostGaps() {
  const g = sceneRef.add.graphics();
  g.lineStyle(2, 0xf5f7fa, 0.72);

  // Linkerkant
  g.lineBetween(ARENA_LEFT, ARENA_TOP, ARENA_LEFT, GOAL_TOP - POST_RADIUS);
  g.lineBetween(ARENA_LEFT, GOAL_TOP + POST_RADIUS, ARENA_LEFT, GOAL_BOTTOM - POST_RADIUS);
  g.lineBetween(ARENA_LEFT, GOAL_BOTTOM + POST_RADIUS, ARENA_LEFT, ARENA_BOTTOM);

  // Rechterkant
  g.lineBetween(ARENA_RIGHT, ARENA_TOP, ARENA_RIGHT, GOAL_TOP - POST_RADIUS);
  g.lineBetween(ARENA_RIGHT, GOAL_TOP + POST_RADIUS, ARENA_RIGHT, GOAL_BOTTOM - POST_RADIUS);
  g.lineBetween(ARENA_RIGHT, GOAL_BOTTOM + POST_RADIUS, ARENA_RIGHT, ARENA_BOTTOM);

  // Boven- en onderlijn
  g.lineBetween(ARENA_LEFT, ARENA_TOP, ARENA_RIGHT, ARENA_TOP);
  g.lineBetween(ARENA_LEFT, ARENA_BOTTOM, ARENA_RIGHT, ARENA_BOTTOM);
}

function drawGoalNet(scene, side) {
  const g = scene.add.graphics();
  g.lineStyle(1, 0xf5f7fa, 0.18);

  const startX = side === 'left' ? ARENA_LEFT - NET_DEPTH : ARENA_RIGHT;
  const endX = side === 'left' ? ARENA_LEFT : ARENA_RIGHT + NET_DEPTH;

  g.strokeRect(startX, GOAL_TOP, NET_DEPTH, GOAL_HEIGHT);

  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const x = startX + (endX - startX) * t;
    g.lineBetween(x, GOAL_TOP, x, GOAL_BOTTOM);
  }

  for (let i = 1; i < 7; i++) {
    const y = GOAL_TOP + (GOAL_HEIGHT / 7) * i;
    g.lineBetween(startX, y, endX, y);
  }

  scene.add.rectangle(startX + NET_DEPTH / 2, ARENA_CENTER_Y, NET_DEPTH, GOAL_HEIGHT, 0x000000, 0.05);
}

function createGoalPost(x, y) {
  const scene = sceneRef;

  const glow = scene.add.circle(x, y, POST_RADIUS + 7, 0xf5a524, 0.08);
  const post = scene.add.circle(x, y, POST_RADIUS, 0x2d374b, 1);
  post.setStrokeStyle(2, 0xf5a524, 0.75);
  const inner = scene.add.circle(x - 2, y - 2, 4, 0xf5f7fa, 0.12);

  return { x, y, glow, post, inner };
}

function createFighters() {
  leftFighter = createFighter(76, ARENA_CENTER_Y, 1);
  rightFighter = createFighter(884, ARENA_CENTER_Y, -1);
}

function createFighter(x, y, facing) {
  const scene = sceneRef;

  const aura = scene.add.circle(0, 0, 30, 0xf5a524, 0.05);

  const body = scene.add.circle(-8 * facing, 0, BODY_RADIUS, 0x1b2230, 1);
  body.setStrokeStyle(2, 0xf5a524, 0.28);

  const head = scene.add.circle(-18 * facing, 0, 8, 0x2c364a, 1);
  head.setStrokeStyle(1, 0xf5f7fa, 0.18);

  const visor = scene.add.rectangle(-18 * facing, 0, 7, 3, 0xf5a524, 0.85);

  const shieldGlow = scene.add.rectangle(SHIELD_OFFSET * facing, 0, SHIELD_WIDTH + 10, SHIELD_HEIGHT + 12, 0xf5a524, 0.06);
  shieldGlow.setStrokeStyle(1, 0xf5a524, 0.22);

  const shield = scene.add.rectangle(SHIELD_OFFSET * facing, 0, SHIELD_WIDTH, SHIELD_HEIGHT, 0xf5a524, 0.92);
  shield.setStrokeStyle(2, 0xf5f7fa, 0.35);

  const shieldStripe = scene.add.rectangle(SHIELD_OFFSET * facing, 0, 4, SHIELD_HEIGHT - 18, 0xf5f7fa, 0.22);

  const container = scene.add.container(x, y, [
    aura,
    body,
    head,
    visor,
    shieldGlow,
    shield,
    shieldStripe
  ]);

  return {
    container,
    aura,
    body,
    head,
    visor,
    shieldGlow,
    shield,
    shieldStripe,
    facing
  };
}

function createCore() {
  const scene = sceneRef;

  for (let i = 0; i < 6; i++) {
    const dot = scene.add.circle(-100, -100, 6 - i * 0.6, 0xf5a524, 0);
    dot.setDepth(120);
    trailDots.push(dot);
  }

  coreGlow = scene.add.circle(ARENA_CENTER_X, ARENA_CENTER_Y, 20, 0xf5a524, 0.15);
  coreGlow.setStrokeStyle(2, 0xf5a524, 0.18);

  core = scene.add.circle(ARENA_CENTER_X, ARENA_CENTER_Y, CORE_RADIUS, 0xff8a00, 1);
  core.setStrokeStyle(2, 0xf5f7fa, 0.4);

  coreInner = scene.add.circle(ARENA_CENTER_X, ARENA_CENTER_Y, 5, 0xfff1b8, 1);

  coreGlow.setDepth(200);
  core.setDepth(201);
  coreInner.setDepth(202);
}

function createHelpText() {
  const scene = sceneRef;

  scene.add.text(ARENA_CENTER_X, 590, 'ARROWS = HUMAN // TOUCHPAD ON MOBILE // CHOOSE SIDE ABOVE', {
    fontFamily: 'Courier New',
    fontSize: '14px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
}

function createHeroGoalOverlay() {
  const scene = sceneRef;

  centerOverlayBg = scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y, 620, 250, 0x0b0f14, 0.92);
  centerOverlayBg.setVisible(false);
  centerOverlayBg.setDepth(1000);

  centerOverlayBorder = scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y, 620, 250, 0x000000, 0);
  centerOverlayBorder.setStrokeStyle(2, 0xf5a524, 0.65);
  centerOverlayBorder.setVisible(false);
  centerOverlayBorder.setDepth(1001);

  centerOverlayTitle = scene.add.text(ARENA_CENTER_X, ARENA_CENTER_Y - 58, '', {
    fontFamily: 'Courier New',
    fontSize: '42px',
    color: '#f5a524',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  centerOverlayTitle.setVisible(false);
  centerOverlayTitle.setDepth(1002);

  centerOverlaySub = scene.add.text(ARENA_CENTER_X, ARENA_CENTER_Y + 2, '', {
    fontFamily: 'Courier New',
    fontSize: '20px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
  centerOverlaySub.setVisible(false);
  centerOverlaySub.setDepth(1002);

  centerOverlayBadge = scene.add.rectangle(ARENA_CENTER_X, ARENA_CENTER_Y + 48, 200, 42, 0xf5a524, 0.18);
  centerOverlayBadge.setStrokeStyle(1, 0xf5a524, 0.7);
  centerOverlayBadge.setVisible(false);
  centerOverlayBadge.setDepth(1002);

  centerOverlayBadgeText = scene.add.text(ARENA_CENTER_X, ARENA_CENTER_Y + 48, '', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);
  centerOverlayBadgeText.setVisible(false);
  centerOverlayBadgeText.setDepth(1003);

  centerComboText = scene.add.text(ARENA_CENTER_X, ARENA_CENTER_Y + 98, '', {
    fontFamily: 'Courier New',
    fontSize: '30px',
    color: '#ffcf66',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  centerComboText.setVisible(false);
  centerComboText.setDepth(1003);

  centerOverlayPulse = scene.add.circle(ARENA_CENTER_X, ARENA_CENTER_Y, 45, 0xf5a524, 0.18);
  centerOverlayPulse.setStrokeStyle(3, 0xf5f7fa, 0.45);
  centerOverlayPulse.setVisible(false);
  centerOverlayPulse.setDepth(999);

  centerOverlayPulse2 = scene.add.circle(ARENA_CENTER_X, ARENA_CENTER_Y, 20, 0xf5a524, 0.12);
  centerOverlayPulse2.setStrokeStyle(2, 0xf5a524, 0.35);
  centerOverlayPulse2.setVisible(false);
  centerOverlayPulse2.setDepth(999);
}

function initStageAutoFit() {
  gameShellEl = document.getElementById('game-shell');
  gameTitleEl = document.getElementById('game-title');
  arcadeControlsEl = document.getElementById('arcade-controls');
  gameStageEl = document.getElementById('game-stage');
  gameContainerEl = document.getElementById('game-container');

  window.addEventListener('resize', applyStageAutoFit);
  window.addEventListener('orientationchange', applyStageAutoFit);

  requestAnimationFrame(applyStageAutoFit);
  setTimeout(applyStageAutoFit, 50);
  setTimeout(applyStageAutoFit, 250);
}

function applyStageAutoFit() {
  if (!gameShellEl || !gameTitleEl || !arcadeControlsEl || !gameStageEl || !gameContainerEl) {
    return;
  }

  const viewportHeight = window.innerHeight;

  const shellStyles = window.getComputedStyle(gameShellEl);
  const shellPaddingTop = parseFloat(shellStyles.paddingTop) || 0;
  const shellPaddingBottom = parseFloat(shellStyles.paddingBottom) || 0;
  const shellGap = parseFloat(shellStyles.gap) || 0;

  const titleHeight = gameTitleEl.offsetHeight || 0;
  const controlsHeight = arcadeControlsEl.offsetHeight || 0;

  const availableWidth = Math.max(260, gameShellEl.clientWidth);
  const verticalUsed =
    shellPaddingTop +
    shellPaddingBottom +
    titleHeight +
    controlsHeight +
    shellGap * 3 +
    8;

  const availableHeight = Math.max(220, viewportHeight - verticalUsed);
  const aspectRatio = GAME_WIDTH / GAME_HEIGHT;

  let stageWidth = availableWidth;
  let stageHeight = stageWidth / aspectRatio;

  if (stageHeight > availableHeight) {
    stageHeight = availableHeight;
    stageWidth = stageHeight * aspectRatio;
  }

  stageWidth = Math.floor(stageWidth);
  stageHeight = Math.floor(stageHeight);

  gameStageEl.style.width = `${stageWidth}px`;
  gameStageEl.style.height = `${stageHeight}px`;
}


function createInput() {
  const scene = sceneRef;

  cursors = scene.input.keyboard.createCursorKeys();

  scene.input.keyboard.on('keydown', unlockAudioOnce);
  scene.input.on('pointerdown', unlockAudioOnce);
}

function createAIDifficultyDisplay() {
  const scene = sceneRef;

  aiHudText = scene.add.text(GAME_WIDTH - 18, 26, '', {
    fontFamily: 'Courier New',
    fontSize: '16px',
    color: '#ffcf66',
    fontStyle: 'bold'
  }).setOrigin(1, 0.5);
}

function initArcadeSideUI() {
  sideUiStatus = document.getElementById('side-status');
  sideUiButtons = Array.from(document.querySelectorAll('.side-button'));

  sideUiButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const side = button.dataset.playerSide;
      setPlayerSide(side);
      resetFighterPositions();
      fighterHitCooldown = 0;
      postHitCooldown = 0;
      roundPaused = false;
      resetCore(false);
    });
  });
}

function initAIDifficultyUI() {
  aiUiStatus = document.getElementById('ai-status');
  aiUiButtons = Array.from(document.querySelectorAll('.ai-button'));

  aiUiButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.aiLevel;
      setAIDifficulty(level);
    });
  });
}

function initTouchUI() {
  touchUiStatus = document.getElementById('touch-status');
  touchUiButtons = Array.from(document.querySelectorAll('.hand-button'));
  touchOverlayEl = document.getElementById('touch-overlay');
  touchPadEl = document.getElementById('touch-pad');
  touchPadThumbEl = document.getElementById('touch-pad-thumb');

  touchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  document.body.classList.toggle('touch-device', touchDevice);

  touchUiButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const hand = button.dataset.touchHand;
      setTouchHand(hand);
    });
  });

  if (touchDevice && touchPadEl) {
    touchPadEl.addEventListener('pointerdown', onTouchPadDown);
    window.addEventListener('pointermove', onTouchPadMove);
    window.addEventListener('pointerup', onTouchPadUp);
    window.addEventListener('pointercancel', onTouchPadUp);
  }

  window.addEventListener('resize', updateOrientationState);
  window.addEventListener('orientationchange', updateOrientationState);
  updateOrientationState();
}

function updateOrientationState() {
  if (!touchDevice) {
    document.body.classList.remove('portrait-mode');
    document.body.classList.remove('landscape-mode');
    return;
  }

  const isPortrait = window.innerHeight > window.innerWidth;

  document.body.classList.toggle('portrait-mode', isPortrait);
  document.body.classList.toggle('landscape-mode', !isPortrait);

  setTimeout(applyStageAutoFit, 0);
}

function setTouchHand(hand) {
  if (hand !== 'left' && hand !== 'right') {
    return;
  }

  touchHand = hand;

  if (touchUiStatus) {
    touchUiStatus.textContent = `Touch: ${touchHand.toUpperCase()}-HANDED`;
  }

  if (touchUiButtons.length) {
    touchUiButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.touchHand === hand);
    });
  }

  if (touchPadEl) {
    touchPadEl.classList.toggle('left-handed', hand === 'left');
    touchPadEl.classList.toggle('right-handed', hand === 'right');
  }

  resetTouchInput();
  setTimeout(applyStageAutoFit, 0);
}

function resetTouchInput() {
  touchState.active = false;
  touchState.pointerId = null;
  touchState.inputX = 0;
  touchState.inputY = 0;

  if (touchPadThumbEl) {
    touchPadThumbEl.style.transform = 'translate(-50%, -50%)';
  }
}

function onTouchPadDown(event) {
  if (!touchDevice || !touchPadEl || !touchPadThumbEl) {
    return;
  }

  event.preventDefault();

  touchState.active = true;
  touchState.pointerId = event.pointerId;

  const rect = touchPadEl.getBoundingClientRect();
  touchState.centerX = rect.left + rect.width / 2;
  touchState.centerY = rect.top + rect.height / 2;

  updateTouchVector(event.clientX, event.clientY);
}

function onTouchPadMove(event) {
  if (!touchState.active || event.pointerId !== touchState.pointerId) {
    return;
  }

  event.preventDefault();
  updateTouchVector(event.clientX, event.clientY);
}

function onTouchPadUp(event) {
  if (event.pointerId !== touchState.pointerId) {
    return;
  }

  resetTouchInput();
}

function updateTouchVector(clientX, clientY) {
  let dx = clientX - touchState.centerX;
  let dy = clientY - touchState.centerY;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = touchState.radius;

  if (distance > maxDistance) {
    const scale = maxDistance / distance;
    dx *= scale;
    dy *= scale;
  }

  touchState.inputX = dx / maxDistance;
  touchState.inputY = dy / maxDistance;

  if (touchPadThumbEl) {
    touchPadThumbEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
}

function setPlayerSide(side) {
  if (side !== 'left' && side !== 'right') {
    return;
  }

  playerSide = side;
  aiSide = side === 'left' ? 'right' : 'left';

  humanFighter = playerSide === 'left' ? leftFighter : rightFighter;
  aiFighter = aiSide === 'left' ? leftFighter : rightFighter;

  aiTargetX = aiFighter ? aiFighter.container.x : RIGHT_START_X;
  aiDesiredTargetX = aiTargetX;
  aiTargetY = aiFighter ? aiFighter.container.y : ARENA_CENTER_Y;
  aiDesiredTargetY = aiTargetY;

  if (sideUiStatus) {
    sideUiStatus.textContent = `Player: ${playerSide.toUpperCase()} // AI: ${aiSide.toUpperCase()}`;
  }

  if (sideUiButtons.length) {
    sideUiButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.playerSide === side);
    });
  }

if (aiHudText && aiDifficulty) {
    aiHudText.setText(`AI: ${aiDifficulty.label.toUpperCase()}`);
  }

  setTimeout(applyStageAutoFit, 0);
}

function setAIDifficulty(level) {
  if (!AI_SETTINGS[level]) {
    return;
  }

  aiDifficultyKey = level;
  aiDifficulty = AI_SETTINGS[level];
  aiDecisionTimer = 0;

  aiTargetX = aiFighter ? aiFighter.container.x : RIGHT_START_X;
  aiDesiredTargetX = aiTargetX;
  aiTargetY = aiFighter ? aiFighter.container.y : ARENA_CENTER_Y;
  aiDesiredTargetY = aiTargetY;

  if (aiHudText) {
    aiHudText.setText(`AI: ${aiDifficulty.label.toUpperCase()}`);
  }

  if (aiUiStatus) {
    aiUiStatus.textContent = `AI: ${aiDifficulty.label.toUpperCase()}`;
  }

if (aiUiButtons.length) {
    aiUiButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.aiLevel === level);
    });
  }

  setTimeout(applyStageAutoFit, 0);
}

function resetFighterPositions() {
  leftFighter.container.x = LEFT_START_X;
  leftFighter.container.y = ARENA_CENTER_Y;

  rightFighter.container.x = RIGHT_START_X;
  rightFighter.container.y = ARENA_CENTER_Y;

  if (humanFighter) {
    clampFighterToLane(humanFighter);
  }

  if (aiFighter) {
    clampFighterToLane(aiFighter);

    aiTargetX = aiFighter.container.x;
    aiDesiredTargetX = aiTargetX;
    aiTargetY = aiFighter.container.y;
    aiDesiredTargetY = aiTargetY;
  }
}

function getLaneBounds(fighter) {
  const minY = ARENA_TOP + FIGHTER_Y_PADDING;
  const maxY = ARENA_BOTTOM - FIGHTER_Y_PADDING;

  if (fighter.facing === 1) {
    return {
      minX: ARENA_LEFT + LANE_BACK_PADDING,
      maxX: ARENA_CENTER_X - LANE_FRONT_GAP,
      minY,
      maxY
    };
  }

  return {
    minX: ARENA_CENTER_X + LANE_FRONT_GAP,
    maxX: ARENA_RIGHT - LANE_BACK_PADDING,
    minY,
    maxY
  };
}

function clampFighterToLane(fighter) {
  const bounds = getLaneBounds(fighter);

  fighter.container.x = Phaser.Math.Clamp(fighter.container.x, bounds.minX, bounds.maxX);
  fighter.container.y = Phaser.Math.Clamp(fighter.container.y, bounds.minY, bounds.maxY);
}

function getForwardProgress(fighter) {
  const bounds = getLaneBounds(fighter);
  const laneWidth = Math.max(bounds.maxX - bounds.minX, 1);

  if (fighter.facing === 1) {
    return Phaser.Math.Clamp((fighter.container.x - bounds.minX) / laneWidth, 0, 1);
  }

  return Phaser.Math.Clamp((bounds.maxX - fighter.container.x) / laneWidth, 0, 1);
}

function getPressureState(fighter) {
  const progress = getForwardProgress(fighter);

  if (progress >= PRESSURE_FORWARD_THRESHOLD) {
    return {
      zone: 'forward',
      speedMultiplier: FORWARD_RETURN_SPEED_BONUS,
      verticalMultiplier: FORWARD_VERTICAL_BONUS
    };
  }

  if (progress <= PRESSURE_DEEP_THRESHOLD) {
    return {
      zone: 'deep',
      speedMultiplier: DEEP_RETURN_SPEED_PENALTY,
      verticalMultiplier: DEEP_VERTICAL_PENALTY
    };
  }

  return {
    zone: 'neutral',
    speedMultiplier: 1,
    verticalMultiplier: 1
  };
}

function laneXFromProgress(fighter, progress) {
  const bounds = getLaneBounds(fighter);
  const clamped = Phaser.Math.Clamp(progress, 0, 1);

  if (fighter.facing === 1) {
    return Phaser.Math.Linear(bounds.minX, bounds.maxX, clamped);
  }

  return Phaser.Math.Linear(bounds.maxX, bounds.minX, clamped);
}

function moveHumanFighter(dt) {
  if (!humanFighter || !cursors) {
    return;
  }

  let inputX = 0;
  let inputY = 0;

  if (cursors.left.isDown) {
    inputX -= 1;
  }

  if (cursors.right.isDown) {
    inputX += 1;
  }

  if (cursors.up.isDown) {
    inputY -= 1;
  }

  if (cursors.down.isDown) {
    inputY += 1;
  }

  const keyboardActive = inputX !== 0 || inputY !== 0;

  if (!keyboardActive && touchDevice && touchState.active && document.body.classList.contains('landscape-mode')) {
    inputX = touchState.inputX;
    inputY = touchState.inputY;
  }

  if (inputX !== 0 || inputY !== 0) {
    const magnitude = Math.sqrt(inputX * inputX + inputY * inputY);

    if (magnitude > 1) {
      inputX /= magnitude;
      inputY /= magnitude;
    }

    humanFighter.container.x += inputX * HORIZONTAL_SPEED * dt;
    humanFighter.container.y += inputY * UNIT_SPEED * dt;
  }

  clampFighterToLane(humanFighter);
}

function moveAIOpponent(dt, delta) {
  if (!aiFighter) {
    return;
  }

  aiDecisionTimer -= delta;

  if (aiDecisionTimer <= 0) {
    aiDesiredTargetX = computeAITargetX();
    aiDesiredTargetY = computeAITargetY();
    aiDecisionTimer = aiDifficulty.reactionMs;
  }

  aiTargetX = Phaser.Math.Linear(aiTargetX, aiDesiredTargetX, aiDifficulty.targetLerp);
  aiTargetY = Phaser.Math.Linear(aiTargetY, aiDesiredTargetY, aiDifficulty.targetLerp);

  const dx = aiTargetX - aiFighter.container.x;
  const dy = aiTargetY - aiFighter.container.y;

  if (Math.abs(dx) > aiDifficulty.deadZone) {
    const xStep = HORIZONTAL_SPEED * aiDifficulty.speedMultiplier * dt;
    aiFighter.container.x += Math.sign(dx) * Math.min(Math.abs(dx), xStep);
  }

  if (Math.abs(dy) > aiDifficulty.deadZone) {
    const yStep = UNIT_SPEED * aiDifficulty.speedMultiplier * dt;
    aiFighter.container.y += Math.sign(dy) * Math.min(Math.abs(dy), yStep);
  }

  clampFighterToLane(aiFighter);
}

function computeAITargetX() {
  if (!aiFighter) {
    return RIGHT_START_X;
  }

  const bounds = getLaneBounds(aiFighter);

  const backX = laneXFromProgress(aiFighter, 0.18);
  const neutralX = laneXFromProgress(aiFighter, 0.44);
  const forwardX = laneXFromProgress(aiFighter, 0.70);

  const approachingAi = aiSide === 'left'
    ? coreVelocityX < 0
    : coreVelocityX > 0;

  const coreOnAiHalf = aiSide === 'left'
    ? core.x < ARENA_CENTER_X
    : core.x > ARENA_CENTER_X;

  const dangerFactor = aiSide === 'left'
    ? Phaser.Math.Clamp((ARENA_CENTER_X - core.x) / (ARENA_CENTER_X - ARENA_LEFT), 0, 1)
    : Phaser.Math.Clamp((core.x - ARENA_CENTER_X) / (ARENA_RIGHT - ARENA_CENTER_X), 0, 1);

  let targetX = neutralX;

  if (approachingAi) {
    if (coreOnAiHalf) {
      const commitAmount = Phaser.Math.Linear(0.18, aiDifficulty.forwardCommit, dangerFactor);
      targetX = Phaser.Math.Linear(neutralX, forwardX, commitAmount);
    } else {
      targetX = Phaser.Math.Linear(backX, neutralX, 0.72);
    }
  } else {
    if (coreOnAiHalf) {
      targetX = Phaser.Math.Linear(backX, neutralX, 0.42);
    } else {
      targetX = Phaser.Math.Linear(backX, neutralX, aiDifficulty.attackBias * 0.45);
    }
  }

  targetX += Phaser.Math.Between(-aiDifficulty.xErrorMargin, aiDifficulty.xErrorMargin);

  return Phaser.Math.Clamp(targetX, bounds.minX, bounds.maxX);
}

function computeAITargetY() {
  if (!aiFighter) {
    return ARENA_CENTER_Y;
  }

  const bounds = getLaneBounds(aiFighter);
  const forwardProgress = getForwardProgress(aiFighter);
  const shadowY = Phaser.Math.Linear(ARENA_CENTER_Y, core.y, aiDifficulty.attackBias);
  let targetY = shadowY;

  const approachingAi = aiSide === 'left'
    ? coreVelocityX < 0
    : coreVelocityX > 0;

  if (approachingAi) {
    const shieldX = getShieldCenterX(aiFighter);
    const timeToIntercept = Math.abs(core.x - shieldX) / Math.max(Math.abs(coreVelocityX), 1);

    let predictedY = core.y + coreVelocityY * timeToIntercept;
    predictedY = Phaser.Math.Clamp(predictedY, bounds.minY, bounds.maxY);

    targetY = Phaser.Math.Linear(
      shadowY,
      predictedY,
      0.40 + aiDifficulty.interceptBias * 0.34
    );
  } else {
    targetY = Phaser.Math.Linear(
      ARENA_CENTER_Y,
      core.y,
      aiDifficulty.attackBias * 0.42
    );
  }

  let dynamicError = aiDifficulty.errorMargin;

  if (forwardProgress >= PRESSURE_FORWARD_THRESHOLD) {
    dynamicError += aiDifficulty.frontExposureError;
  }

  targetY += Phaser.Math.Between(-dynamicError, dynamicError);

  return Phaser.Math.Clamp(targetY, bounds.minY, bounds.maxY);
}

function unlockAudioOnce() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  audioUnlocked = true;
}

function playGoalSound() {
  if (!audioCtx || !audioUnlocked) {
    return;
  }

  const now = audioCtx.currentTime;

  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(520, now);
  osc1.frequency.linearRampToValueAtTime(760, now + 0.12);
  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.18);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(220, now + 0.03);
  osc2.frequency.linearRampToValueAtTime(330, now + 0.18);
  gain2.gain.setValueAtTime(0.0001, now);
  gain2.gain.linearRampToValueAtTime(0.08, now + 0.04);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now);
  osc2.stop(now + 0.26);
}

function moveCore(dt) {
  core.x += coreVelocityX * dt;
  core.y += coreVelocityY * dt;

  syncCoreVisuals();

  if (core.y - CORE_RADIUS <= ARENA_TOP) {
    core.y = ARENA_TOP + CORE_RADIUS;
    coreVelocityY *= -1;
    applyTrajectoryConstraints();
    syncCoreVisuals();
  }

  if (core.y + CORE_RADIUS >= ARENA_BOTTOM) {
    core.y = ARENA_BOTTOM - CORE_RADIUS;
    coreVelocityY *= -1;
    applyTrajectoryConstraints();
    syncCoreVisuals();
  }

  handleFighterCollisions();
  handleGoalPostCollisions();
  handleLeftBackWall();
  handleRightBackWall();
}

function handleFighterCollisions() {
  if (fighterHitCooldown > 0) {
    return;
  }

  if (isCoreTouchingShield(leftFighter)) {
    resolveShieldCollision(leftFighter);
    return;
  }

  if (isCoreTouchingShield(rightFighter)) {
    resolveShieldCollision(rightFighter);
    return;
  }

  if (isCoreTouchingBody(leftFighter)) {
    resolveBodyCollision(leftFighter);
    return;
  }

  if (isCoreTouchingBody(rightFighter)) {
    resolveBodyCollision(rightFighter);
  }
}

function resolveShieldCollision(fighter) {
  const shieldX = getShieldCenterX(fighter);
  const direction = core.x >= shieldX ? 1 : -1;
  const pressure = getPressureState(fighter);

  core.x = shieldX + direction * (SHIELD_WIDTH / 2 + CORE_RADIUS + 1);

  const relativeY = Phaser.Math.Clamp(
    (core.y - fighter.container.y) / (SHIELD_HEIGHT / 2),
    -1,
    1
  );

  const curvedResponse = Math.sin(relativeY * (Math.PI / 2));

  coreVelocityX =
    Math.max(Math.abs(coreVelocityX), MIN_HORIZONTAL_SPEED) *
    direction *
    1.03 *
    pressure.speedMultiplier;

  const targetVY =
    curvedResponse *
    Math.max(Math.abs(coreVelocityX) * 0.88, 170) *
    pressure.verticalMultiplier;

  coreVelocityY = Phaser.Math.Linear(coreVelocityY, targetVY, 0.75);

  fighterHitCooldown = 70;
  registerRallyHit();

  applyTrajectoryConstraints(direction);
  onShieldHit(fighter, pressure.zone);
  onCoreHit();
  syncCoreVisuals();
}

function isCoreTouchingShield(fighter) {
  const shieldX = getShieldCenterX(fighter);
  const horizontalHit = Math.abs(core.x - shieldX) < (SHIELD_WIDTH / 2 + CORE_RADIUS);
  const verticalHit = Math.abs(core.y - fighter.container.y) < (SHIELD_HEIGHT / 2 + CORE_RADIUS);
  return horizontalHit && verticalHit;
}

function isCoreTouchingBody(fighter) {
  const bodyX = fighter.container.x + (-8 * fighter.facing);
  const bodyY = fighter.container.y;

  const dx = core.x - bodyX;
  const dy = core.y - bodyY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= CORE_RADIUS + BODY_RADIUS;
}

function resolveBodyCollision(fighter) {
  const bodyX = fighter.container.x + (-8 * fighter.facing);
  const bodyY = fighter.container.y;
  const pressure = getPressureState(fighter);

  let dx = core.x - bodyX;
  let dy = core.y - bodyY;
  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    distance = 0.001;
    dx = 0.001;
  }

  const nx = dx / distance;
  const ny = dy / distance;
  const dot = coreVelocityX * nx + coreVelocityY * ny;

  coreVelocityX = coreVelocityX - 2 * dot * nx;
  coreVelocityY = coreVelocityY - 2 * dot * ny;

  coreVelocityX *= 1.01 * pressure.speedMultiplier;
  coreVelocityY *= 1.01 * pressure.verticalMultiplier;

  core.x = bodyX + nx * (CORE_RADIUS + BODY_RADIUS + 1);
  core.y = bodyY + ny * (CORE_RADIUS + BODY_RADIUS + 1);

  fighterHitCooldown = 70;
  registerRallyHit();

  applyTrajectoryConstraints();
  onBodyHit(fighter, pressure.zone);
  onCoreHit();
  syncCoreVisuals();
}

function handleGoalPostCollisions() {
  if (postHitCooldown > 0) {
    return;
  }

  for (let i = 0; i < goalPosts.length; i++) {
    const post = goalPosts[i];

    let dx = core.x - post.x;
    let dy = core.y - post.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= CORE_RADIUS + POST_RADIUS) {
      if (distance === 0) {
        distance = 0.001;
        dx = 0.001;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const dot = coreVelocityX * nx + coreVelocityY * ny;

      if (dot < 0) {
        coreVelocityX = coreVelocityX - 2 * dot * nx;
        coreVelocityY = coreVelocityY - 2 * dot * ny;

        coreVelocityX *= 1.02;
        coreVelocityY *= 1.02;

        core.x = post.x + nx * (CORE_RADIUS + POST_RADIUS + 2);
        core.y = post.y + ny * (CORE_RADIUS + POST_RADIUS + 2);

        if (post.x === ARENA_LEFT) {
          core.x = Math.max(core.x, ARENA_LEFT + POST_RADIUS + CORE_RADIUS + 3);
          coreVelocityX = Math.max(Math.abs(coreVelocityX), MIN_HORIZONTAL_SPEED);
        }

        if (post.x === ARENA_RIGHT) {
          core.x = Math.min(core.x, ARENA_RIGHT - POST_RADIUS - CORE_RADIUS - 3);
          coreVelocityX = -Math.max(Math.abs(coreVelocityX), MIN_HORIZONTAL_SPEED);
        }

        postHitCooldown = 90;

        applyTrajectoryConstraints();
        syncCoreVisuals();
        onCoreHit();
        onGoalPostHit(post);
        break;
      }
    }
  }
}

function onGoalPostHit(post) {
  const scene = sceneRef;

  scene.tweens.add({
    targets: [post.post, post.glow],
    scaleX: 1.22,
    scaleY: 1.22,
    alpha: 1,
    yoyo: true,
    duration: 110
  });

  const ring = scene.add.circle(post.x, post.y, POST_RADIUS + 6, 0xf5a524, 0.18);
  ring.setStrokeStyle(2, 0xf5f7fa, 0.3);

  scene.tweens.add({
    targets: ring,
    scaleX: 2.8,
    scaleY: 2.8,
    alpha: 0,
    duration: 260,
    onComplete: () => ring.destroy()
  });
}

function bounceFromBackWall(directionAwayFromWall) {
  const absVX = Math.max(Math.abs(coreVelocityX), MIN_HORIZONTAL_SPEED);
  const maxAbsVY = absVX * MAX_VERTICAL_RATIO;

  coreVelocityX = absVX * directionAwayFromWall;
  coreVelocityY = Phaser.Math.Clamp(coreVelocityY, -maxAbsVY * 0.8, maxAbsVY * 0.8);

  if (Math.abs(coreVelocityY) > Math.abs(coreVelocityX) * 0.9) {
    coreVelocityY = Math.sign(coreVelocityY || 1) * Math.abs(coreVelocityX) * 0.7;
  }

  coreVelocityY *= 0.95;
}

function handleLeftBackWall() {
  const inGoalWindow = core.y >= GOAL_TOP && core.y <= GOAL_BOTTOM;

  if (coreVelocityX < 0 && core.x - CORE_RADIUS <= ARENA_LEFT) {
    if (inGoalWindow) {
      scoreGoal('right');
    } else {
      core.x = ARENA_LEFT + CORE_RADIUS + 2;
      bounceFromBackWall(1);
      syncCoreVisuals();
    }
  }
}

function handleRightBackWall() {
  const inGoalWindow = core.y >= GOAL_TOP && core.y <= GOAL_BOTTOM;

  if (coreVelocityX > 0 && core.x + CORE_RADIUS >= ARENA_RIGHT) {
    if (inGoalWindow) {
      scoreGoal('left');
    } else {
      core.x = ARENA_RIGHT - CORE_RADIUS - 2;
      bounceFromBackWall(-1);
      syncCoreVisuals();
    }
  }
}

function scoreGoal(side) {
  roundPaused = true;

  const comboData = updateComboState(side);

  if (side === 'left') {
    leftScore++;
    leftScoreText.setText(String(leftScore));
    pulseScore(leftScoreText, leftScoreOrb);
    animateCoreIntoNet('left', comboData);
  } else {
    rightScore++;
    rightScoreText.setText(String(rightScore));
    pulseScore(rightScoreText, rightScoreOrb);
    animateCoreIntoNet('right', comboData);
  }
}

function animateCoreIntoNet(side, comboData) {
  playGoalSound();

  const scoringOnRightGoal = side === 'left';

  const lineEntryX = scoringOnRightGoal ? ARENA_RIGHT - 3 : ARENA_LEFT + 3;
  const finalNetX = scoringOnRightGoal
    ? ARENA_RIGHT + (NET_DEPTH / 2)
    : ARENA_LEFT - (NET_DEPTH / 2);

  const startY = Phaser.Math.Clamp(core.y, GOAL_TOP + 12, GOAL_BOTTOM - 12);

  const incomingBias = Phaser.Math.Clamp(coreVelocityY * 0.06, -16, 16);
  const midNetY = Phaser.Math.Clamp(startY + incomingBias, GOAL_TOP + 12, GOAL_BOTTOM - 12);
  const finalNetY = Phaser.Math.Clamp(midNetY + (incomingBias * 0.4), GOAL_TOP + 12, GOAL_BOTTOM - 12);

  sceneRef.tweens.add({
    targets: [core, coreGlow, coreInner],
    x: lineEntryX,
    y: startY,
    duration: 80,
    ease: 'Sine.easeOut',
    onUpdate: () => {
      syncCoreVisuals();
    },
    onComplete: () => {
      sceneRef.tweens.add({
        targets: [core, coreGlow, coreInner],
        x: finalNetX,
        y: midNetY,
        duration: 90,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          syncCoreVisuals();
        },
        onComplete: () => {
          sceneRef.tweens.add({
            targets: [core, coreGlow, coreInner],
            x: finalNetX + (scoringOnRightGoal ? 5 : -5),
            y: finalNetY,
            duration: 70,
            ease: 'Sine.easeOut',
            onUpdate: () => {
              syncCoreVisuals();
            },
            onComplete: () => {
              playGoalEffect(side);

              if (side === 'left') {
                showHeroGoalOverlay('PLAYER ONE SCORES', 'NET FINISH // ARC BREAK', 'PLAYER ONE', comboData.displayText);
              } else {
                showHeroGoalOverlay('PLAYER TWO SCORES', 'NET FINISH // ARC BREAK', 'PLAYER TWO', comboData.displayText);
              }

              sceneRef.time.delayedCall(1250, () => {
                hideHeroGoalOverlay();
                resetCore(false);
                core.setVisible(true);
                coreGlow.setVisible(true);
                coreInner.setVisible(true);
                roundPaused = false;
              });
            }
          });
        }
      });
    }
  });
}

function updateComboState(scoringSide) {
  const streakWasBroken = streakOwner !== null && streakOwner !== scoringSide && streakCount >= 2;

  if (streakOwner === scoringSide) {
    streakCount++;
  } else {
    streakOwner = scoringSide;
    streakCount = 1;
  }

  let displayText = '';

  if (streakWasBroken) {
    displayText = 'COMEBACK!';
  } else if (streakCount === 2) {
    displayText = '2-IN-A-ROW!';
  } else if (streakCount === 3) {
    displayText = 'COCOCOMBOOOO!';
  } else if (streakCount >= 4) {
    displayText = 'OUTRAGIOUS!';
  }

  return { displayText };
}

function pulseScore(scoreText, scoreOrb) {
  sceneRef.tweens.add({
    targets: [scoreText, scoreOrb],
    scaleX: 1.22,
    scaleY: 1.22,
    yoyo: true,
    duration: 180
  });
}

function playGoalEffect(side) {
  const scene = sceneRef;
  const flash = side === 'left' ? rightGoalFlash : leftGoalFlash;
  const burstX = side === 'left' ? ARENA_RIGHT + NET_DEPTH / 2 : ARENA_LEFT - NET_DEPTH / 2;

  flash.setAlpha(1);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 520
  });

  scene.cameras.main.shake(180, 0.008);
  scene.cameras.main.flash(180, 245, 165, 36, false);

  screenFlash.setAlpha(0.26);
  scene.tweens.add({
    targets: screenFlash,
    alpha: 0,
    duration: 240
  });

  arenaGlow.setAlpha(0.45);
  scene.tweens.add({
    targets: arenaGlow,
    alpha: 0,
    duration: 420
  });

  for (let i = 0; i < 8; i++) {
    const ring = scene.add.circle(burstX, ARENA_CENTER_Y, 12 + i * 6, 0xf5a524, 0.18);
    ring.setStrokeStyle(2, 0xf5f7fa, 0.24);

    scene.tweens.add({
      targets: ring,
      scaleX: 2.8,
      scaleY: 2.8,
      alpha: 0,
      duration: 460 + i * 35,
      onComplete: () => ring.destroy()
    });
  }

  for (let i = 0; i < 18; i++) {
    const spark = scene.add.circle(burstX, ARENA_CENTER_Y, Phaser.Math.Between(2, 5), 0xf5a524, 1);
    spark.setDepth(1005);

    const offsetX = Phaser.Math.Between(-90, 90);
    const offsetY = Phaser.Math.Between(-110, 110);

    scene.tweens.add({
      targets: spark,
      x: burstX + offsetX,
      y: ARENA_CENTER_Y + offsetY,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: Phaser.Math.Between(260, 460),
      onComplete: () => spark.destroy()
    });
  }
}

function showHeroGoalOverlay(title, sub, badgeText, comboText) {
  const scene = sceneRef;

  centerOverlayBg.setVisible(true);
  centerOverlayBg.setAlpha(0);

  centerOverlayBorder.setVisible(true);
  centerOverlayBorder.setAlpha(0);

  centerOverlayTitle.setText(title);
  centerOverlayTitle.setVisible(true);
  centerOverlayTitle.setAlpha(0);
  centerOverlayTitle.setScale(0.72);

  centerOverlaySub.setText(sub);
  centerOverlaySub.setVisible(true);
  centerOverlaySub.setAlpha(0);

  centerOverlayBadge.setVisible(true);
  centerOverlayBadge.setAlpha(0);

  centerOverlayBadgeText.setText(badgeText);
  centerOverlayBadgeText.setVisible(true);
  centerOverlayBadgeText.setAlpha(0);

  if (comboText && comboText.length > 0) {
    centerComboText.setText(comboText);
    centerComboText.setVisible(true);
    centerComboText.setAlpha(0);
    centerComboText.setScale(0.82);
  } else {
    centerComboText.setVisible(false);
  }

  centerOverlayPulse.setVisible(true);
  centerOverlayPulse.setAlpha(0.38);
  centerOverlayPulse.setScale(1);

  centerOverlayPulse2.setVisible(true);
  centerOverlayPulse2.setAlpha(0.28);
  centerOverlayPulse2.setScale(1);

  scene.tweens.add({
    targets: [centerOverlayBg, centerOverlayBorder],
    alpha: 1,
    duration: 180
  });

  scene.tweens.add({
    targets: centerOverlayTitle,
    alpha: 1,
    scale: 1,
    duration: 240
  });

  scene.tweens.add({
    targets: centerOverlaySub,
    alpha: 1,
    duration: 280
  });

  scene.tweens.add({
    targets: [centerOverlayBadge, centerOverlayBadgeText],
    alpha: 1,
    duration: 320
  });

  if (comboText && comboText.length > 0) {
    scene.tweens.add({
      targets: centerComboText,
      alpha: 1,
      scale: 1,
      duration: 360
    });
  }

  scene.tweens.add({
    targets: centerOverlayPulse,
    scaleX: 6.2,
    scaleY: 6.2,
    alpha: 0,
    duration: 700
  });

  scene.tweens.add({
    targets: centerOverlayPulse2,
    scaleX: 9,
    scaleY: 9,
    alpha: 0,
    duration: 920
  });
}

function hideHeroGoalOverlay() {
  centerOverlayBg.setVisible(false);
  centerOverlayBorder.setVisible(false);
  centerOverlayTitle.setVisible(false);
  centerOverlaySub.setVisible(false);
  centerOverlayBadge.setVisible(false);
  centerOverlayBadgeText.setVisible(false);
  centerOverlayPulse.setVisible(false);
  centerOverlayPulse2.setVisible(false);
  centerComboText.setVisible(false);
}

function getShieldCenterX(fighter) {
  return fighter.container.x + SHIELD_OFFSET * fighter.facing;
}

function onShieldHit(fighter, pressureZone = 'neutral') {
  let hitScale = 1.18;
  let glowAlpha = 0.22;
  let shieldColor = 0xffc15a;

  if (pressureZone === 'forward') {
    hitScale = 1.28;
    glowAlpha = 0.30;
    shieldColor = 0xffd27a;
  }

  if (pressureZone === 'deep') {
    hitScale = 1.12;
    glowAlpha = 0.16;
    shieldColor = 0xf0b24a;
  }

  sceneRef.tweens.add({
    targets: [fighter.shield, fighter.shieldGlow],
    scaleX: hitScale,
    alpha: 1,
    yoyo: true,
    duration: 90
  });

  sceneRef.tweens.add({
    targets: fighter.container,
    x: fighter.container.x - 5 * fighter.facing,
    yoyo: true,
    duration: 70
  });

  fighter.shield.setFillStyle(shieldColor, 1);
  fighter.shieldGlow.setAlpha(glowAlpha);

  sceneRef.time.delayedCall(90, () => {
    fighter.shield.setFillStyle(0xf5a524, 0.92);
    fighter.shieldGlow.setAlpha(0.06);
  });
}

function onBodyHit(fighter, pressureZone = 'neutral') {
  let bodyScale = 1.12;
  let bodyColor = 0x30405c;

  if (pressureZone === 'forward') {
    bodyScale = 1.18;
    bodyColor = 0x425474;
  }

  if (pressureZone === 'deep') {
    bodyScale = 1.08;
    bodyColor = 0x28364e;
  }

  sceneRef.tweens.add({
    targets: [fighter.body, fighter.aura],
    scaleX: bodyScale,
    scaleY: bodyScale,
    alpha: 1,
    yoyo: true,
    duration: 90
  });

  fighter.body.setFillStyle(bodyColor, 1);

  sceneRef.time.delayedCall(100, () => {
    fighter.body.setFillStyle(0x1b2230, 1);
  });
}

function onCoreHit() {
  trailActiveTime = 220;

  sceneRef.tweens.add({
    targets: coreGlow,
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0.35,
    yoyo: true,
    duration: 90
  });

  sceneRef.tweens.add({
    targets: coreInner,
    scaleX: 1.6,
    scaleY: 1.6,
    yoyo: true,
    duration: 80
  });
}

function resetRallyState() {
  rallyHitCount = 0;
  rallySpeedMultiplier = 1;
}

function registerRallyHit() {
  rallyHitCount++;

  const stepCount = Math.floor(rallyHitCount / RALLY_HITS_PER_STEP);
  const desiredMultiplier = Math.min(
    1 + stepCount * RALLY_SPEED_STEP,
    MAX_RALLY_SPEED_MULTIPLIER
  );

  if (desiredMultiplier > rallySpeedMultiplier) {
    const scale = desiredMultiplier / rallySpeedMultiplier;

    coreVelocityX *= scale;
    coreVelocityY *= scale;

    rallySpeedMultiplier = desiredMultiplier;
    applyTrajectoryConstraints();
  }
}

function updateTrail(dt) {
  trailHistory.unshift({ x: core.x, y: core.y });

  if (trailHistory.length > 18) {
    trailHistory.pop();
  }

  if (trailActiveTime > 0) {
    trailActiveTime -= dt * 1000;

    for (let i = 0; i < trailDots.length; i++) {
      const historyIndex = 2 + i * 2;
      const point = trailHistory[historyIndex];

      if (point) {
        trailDots[i].setVisible(true);
        trailDots[i].x = point.x;
        trailDots[i].y = point.y;
        trailDots[i].setAlpha(0.22 - i * 0.03);
      }
    }
  } else {
    for (let i = 0; i < trailDots.length; i++) {
      trailDots[i].setVisible(false);
    }
  }
}

function syncCoreVisuals() {
  coreGlow.x = core.x;
  coreGlow.y = core.y;
  coreInner.x = core.x;
  coreInner.y = core.y;
}

// Houdt rally's sneller en minder zigzaggend
function applyTrajectoryConstraints(preferredXDirection = null) {
  let xDir;

  if (preferredXDirection === null) {
    xDir = Math.sign(coreVelocityX) || 1;
  } else {
    xDir = preferredXDirection > 0 ? 1 : -1;
  }

  const absVX = Math.max(Math.abs(coreVelocityX), MIN_HORIZONTAL_SPEED);
  const maxAbsVY = absVX * MAX_VERTICAL_RATIO;

  coreVelocityX = absVX * xDir;
  coreVelocityY = Phaser.Math.Clamp(coreVelocityY, -maxAbsVY, maxAbsVY);

  if (Math.abs(coreVelocityY) > Math.abs(coreVelocityX) * 0.96) {
    coreVelocityY = Math.sign(coreVelocityY || 1) * Math.abs(coreVelocityX) * 0.82;
  }
}

function resetCore(isFirstStart) {
  core.x = ARENA_CENTER_X;
  core.y = ARENA_CENTER_Y;
  syncCoreVisuals();

  const direction = Math.random() < 0.5 ? -1 : 1;
  coreVelocityX = START_CORE_SPEED_X * direction;

  if (isFirstStart) {
    coreVelocityY = START_CORE_SPEED_Y;
  } else {
    coreVelocityY = Phaser.Math.Between(-180, 180);

    if (Math.abs(coreVelocityY) < 60) {
      coreVelocityY = 90 * (Math.random() < 0.5 ? -1 : 1);
    }
  }


applyTrajectoryConstraints(direction);
resetRallyState();

aiDecisionTimer = 0;

if (aiFighter) {
    aiTargetX = aiFighter.container.x;
    aiDesiredTargetX = aiTargetX;
    aiTargetY = aiFighter.container.y;
    aiDesiredTargetY = aiTargetY;
  }

  resetTouchInput();
}
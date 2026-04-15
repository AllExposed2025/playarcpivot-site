const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const ARENA_LEFT = 20;
const ARENA_RIGHT = 940;
const ARENA_TOP = 20;
const ARENA_BOTTOM = 520;

const UNIT_WIDTH = 28;
const UNIT_HEIGHT = 120;
const UNIT_SPEED = 360;

const CORE_RADIUS = 12;
const START_CORE_SPEED_X = 320;
const START_CORE_SPEED_Y = 180;

const GOAL_WIDTH = 14;
const GOAL_HEIGHT = 140;
const GOAL_TOP = (GAME_HEIGHT - GOAL_HEIGHT) / 2;
const GOAL_BOTTOM = GOAL_TOP + GOAL_HEIGHT;

let sceneRef;

let leftUnit;
let rightUnit;
let core;

let leftGoalFlash;
let rightGoalFlash;

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

let screenFlash;
let arenaGlow;

let leftKeys;
let cursors;

let leftScore = 0;
let rightScore = 0;

let coreVelocityX = START_CORE_SPEED_X;
let coreVelocityY = START_CORE_SPEED_Y;

let roundPaused = false;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0b0f14',
  scene: {
    create: create,
    update: update
  }
};

new Phaser.Game(config);

function create() {
  sceneRef = this;

  drawArena();
  createScoreboard();
  createGoals();
  createUnitsAndCore();
  createHelpText();
  createHeroGoalOverlay();
  createInput();

  resetCore(true);
}

function update(time, delta) {
  if (roundPaused) {
    return;
  }

  const dt = delta / 1000;

  moveLeftUnit(dt);
  moveRightUnit(dt);
  moveCore(dt);
}

function drawArena() {
  const scene = sceneRef;

  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0f14);

  // Hoofd rand
  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(ARENA_LEFT, ARENA_TOP, 920, 500);

  // Extra glow rand
  arenaGlow = scene.add.rectangle(480, 270, 930, 510, 0xf5a524, 0);
  arenaGlow.setStrokeStyle(2, 0xf5a524, 0.25);

  // Middenlijn
  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.25);
  middle.lineBetween(GAME_WIDTH / 2, 30, GAME_WIDTH / 2, 510);

  // Hoekaccenten
  drawCornerAccent(scene, 34, 34, 'tl');
  drawCornerAccent(scene, 926, 34, 'tr');
  drawCornerAccent(scene, 34, 506, 'bl');
  drawCornerAccent(scene, 926, 506, 'br');

  // Titel
  scene.add.text(480, 40, 'ARCPIVOT RUSH DUEL', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);

  // Flashlaag over hele scherm
  screenFlash = scene.add.rectangle(480, 270, GAME_WIDTH, GAME_HEIGHT, 0xf5a524, 0);
  screenFlash.setDepth(900);
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

function createScoreboard() {
  const scene = sceneRef;

  const leftPanel = scene.add.rectangle(220, 40, 70, 38, 0x0b0f14, 0.7);
  leftPanel.setStrokeStyle(1, 0xf5a524, 0.35);

  const rightPanel = scene.add.rectangle(740, 40, 70, 38, 0x0b0f14, 0.7);
  rightPanel.setStrokeStyle(1, 0xf5a524, 0.35);

  leftScoreText = scene.add.text(220, 40, '0', {
    fontFamily: 'Courier New',
    fontSize: '32px',
    color: '#f5f7fa'
  }).setOrigin(0.5);

  rightScoreText = scene.add.text(740, 40, '0', {
    fontFamily: 'Courier New',
    fontSize: '32px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
}

function createGoals() {
  const scene = sceneRef;

  // Linker doel
  const leftGoalFrame = scene.add.graphics();
  leftGoalFrame.lineStyle(2, 0xf5a524, 0.8);
  leftGoalFrame.strokeRect(ARENA_LEFT, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);

  scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH - 4,
    GOAL_HEIGHT - 8,
    0xf5a524,
    0.22
  );

  scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH + 5,
    GAME_HEIGHT / 2,
    6,
    GOAL_HEIGHT - 18,
    0xf5a524,
    0.08
  );

  // Rechter doel
  const rightGoalFrame = scene.add.graphics();
  rightGoalFrame.lineStyle(2, 0xf5a524, 0.8);
  rightGoalFrame.strokeRect(ARENA_RIGHT - GOAL_WIDTH, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);

  scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH - 4,
    GOAL_HEIGHT - 8,
    0xf5a524,
    0.22
  );

  scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH - 5,
    GAME_HEIGHT / 2,
    6,
    GOAL_HEIGHT - 18,
    0xf5a524,
    0.08
  );

  leftGoalFlash = scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    90,
    GOAL_HEIGHT + 50,
    0xf5a524,
    0
  );

  rightGoalFlash = scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    90,
    GOAL_HEIGHT + 50,
    0xf5a524,
    0
  );
}

function createUnitsAndCore() {
  const scene = sceneRef;

  leftUnit = scene.add.rectangle(80, 270, UNIT_WIDTH, UNIT_HEIGHT, 0xf5a524, 0.95);
  leftUnit.setStrokeStyle(2, 0xf5f7fa, 0.35);

  rightUnit = scene.add.rectangle(880, 270, UNIT_WIDTH, UNIT_HEIGHT, 0xf5a524, 0.95);
  rightUnit.setStrokeStyle(2, 0xf5f7fa, 0.35);

  core = scene.add.circle(480, 270, CORE_RADIUS, 0xf5a524, 1);
  core.setStrokeStyle(2, 0xf5f7fa, 0.35);
}

function createHelpText() {
  const scene = sceneRef;

  scene.add.text(480, 510, 'SCOOR VIA HET KLEINE DOEL // W/S LINKS // PIJLEN RECHTS', {
    fontFamily: 'Courier New',
    fontSize: '14px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
}

function createHeroGoalOverlay() {
  const scene = sceneRef;

  centerOverlayBg = scene.add.rectangle(480, 270, 620, 220, 0x0b0f14, 0.92);
  centerOverlayBg.setVisible(false);
  centerOverlayBg.setDepth(1000);

  centerOverlayBorder = scene.add.rectangle(480, 270, 620, 220, 0x000000, 0);
  centerOverlayBorder.setStrokeStyle(2, 0xf5a524, 0.65);
  centerOverlayBorder.setVisible(false);
  centerOverlayBorder.setDepth(1001);

  centerOverlayTitle = scene.add.text(480, 230, '', {
    fontFamily: 'Courier New',
    fontSize: '42px',
    color: '#f5a524',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  centerOverlayTitle.setVisible(false);
  centerOverlayTitle.setDepth(1002);

  centerOverlaySub = scene.add.text(480, 290, '', {
    fontFamily: 'Courier New',
    fontSize: '20px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
  centerOverlaySub.setVisible(false);
  centerOverlaySub.setDepth(1002);

  centerOverlayBadge = scene.add.rectangle(480, 335, 200, 42, 0xf5a524, 0.18);
  centerOverlayBadge.setStrokeStyle(1, 0xf5a524, 0.7);
  centerOverlayBadge.setVisible(false);
  centerOverlayBadge.setDepth(1002);

  centerOverlayBadgeText = scene.add.text(480, 335, '', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);
  centerOverlayBadgeText.setVisible(false);
  centerOverlayBadgeText.setDepth(1003);

  centerOverlayPulse = scene.add.circle(480, 270, 45, 0xf5a524, 0.18);
  centerOverlayPulse.setStrokeStyle(3, 0xf5f7fa, 0.45);
  centerOverlayPulse.setVisible(false);
  centerOverlayPulse.setDepth(999);

  centerOverlayPulse2 = scene.add.circle(480, 270, 20, 0xf5a524, 0.12);
  centerOverlayPulse2.setStrokeStyle(2, 0xf5a524, 0.35);
  centerOverlayPulse2.setVisible(false);
  centerOverlayPulse2.setDepth(999);
}

function createInput() {
  const scene = sceneRef;

  leftKeys = scene.input.keyboard.addKeys({
    up: 'W',
    down: 'S'
  });

  cursors = scene.input.keyboard.createCursorKeys();
}

function moveLeftUnit(dt) {
  if (leftKeys.up.isDown) {
    leftUnit.y -= UNIT_SPEED * dt;
  }

  if (leftKeys.down.isDown) {
    leftUnit.y += UNIT_SPEED * dt;
  }

  leftUnit.y = Phaser.Math.Clamp(leftUnit.y, 80, 460);
}

function moveRightUnit(dt) {
  if (cursors.up.isDown) {
    rightUnit.y -= UNIT_SPEED * dt;
  }

  if (cursors.down.isDown) {
    rightUnit.y += UNIT_SPEED * dt;
  }

  rightUnit.y = Phaser.Math.Clamp(rightUnit.y, 80, 460);
}

function moveCore(dt) {
  core.x += coreVelocityX * dt;
  core.y += coreVelocityY * dt;

  if (core.y - CORE_RADIUS <= ARENA_TOP) {
    core.y = ARENA_TOP + CORE_RADIUS;
    coreVelocityY *= -1;
  }

  if (core.y + CORE_RADIUS >= ARENA_BOTTOM) {
    core.y = ARENA_BOTTOM - CORE_RADIUS;
    coreVelocityY *= -1;
  }

  if (isCoreTouchingUnit(leftUnit, core) && coreVelocityX < 0) {
    core.x = leftUnit.x + 24;
    coreVelocityX = Math.abs(coreVelocityX) * 1.03;
    coreVelocityY += (core.y - leftUnit.y) * 4;
  }

  if (isCoreTouchingUnit(rightUnit, core) && coreVelocityX > 0) {
    core.x = rightUnit.x - 24;
    coreVelocityX = -Math.abs(coreVelocityX) * 1.03;
    coreVelocityY += (core.y - rightUnit.y) * 4;
  }

  handleLeftBackWall();
  handleRightBackWall();
}

function handleLeftBackWall() {
  const inGoalWindow = core.y >= GOAL_TOP && core.y <= GOAL_BOTTOM;

  if (coreVelocityX < 0 && core.x - CORE_RADIUS <= ARENA_LEFT) {
    if (inGoalWindow) {
      scoreGoal('right');
    } else {
      core.x = ARENA_LEFT + CORE_RADIUS;
      coreVelocityX = Math.abs(coreVelocityX);
    }
  }
}

function handleRightBackWall() {
  const inGoalWindow = core.y >= GOAL_TOP && core.y <= GOAL_BOTTOM;

  if (coreVelocityX > 0 && core.x + CORE_RADIUS >= ARENA_RIGHT) {
    if (inGoalWindow) {
      scoreGoal('left');
    } else {
      core.x = ARENA_RIGHT - CORE_RADIUS;
      coreVelocityX = -Math.abs(coreVelocityX);
    }
  }
}

function scoreGoal(side) {
  roundPaused = true;

  if (side === 'left') {
    leftScore++;
    leftScoreText.setText(String(leftScore));
    pulseScore(leftScoreText);
    playGoalEffect('left');
    showHeroGoalOverlay('PLAYER ONE SCORES', 'LEFT SIDE // ARC BREAK', 'PLAYER ONE');
  } else {
    rightScore++;
    rightScoreText.setText(String(rightScore));
    pulseScore(rightScoreText);
    playGoalEffect('right');
    showHeroGoalOverlay('PLAYER TWO SCORES', 'RIGHT SIDE // ARC BREAK', 'PLAYER TWO');
  }

  core.setVisible(false);

  sceneRef.time.delayedCall(1250, () => {
    hideHeroGoalOverlay();
    resetCore(false);
    core.setVisible(true);
    roundPaused = false;
  });
}

function pulseScore(scoreText) {
  sceneRef.tweens.add({
    targets: scoreText,
    scaleX: 1.35,
    scaleY: 1.35,
    yoyo: true,
    duration: 160
  });
}

function playGoalEffect(side) {
  const scene = sceneRef;
  const flash = side === 'left' ? leftGoalFlash : rightGoalFlash;
  const burstX = side === 'left' ? 90 : 870;

  // Doelflash
  flash.setAlpha(1);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 520
  });

  // Schermreactie
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

  // Grote ringen bij doel
  for (let i = 0; i < 8; i++) {
    const ring = scene.add.circle(burstX, 270, 12 + i * 6, 0xf5a524, 0.18);
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

  // Energy sparks
  for (let i = 0; i < 18; i++) {
    const spark = scene.add.circle(burstX, 270, Phaser.Math.Between(2, 5), 0xf5a524, 1);
    spark.setDepth(1005);

    const offsetX = Phaser.Math.Between(-90, 90);
    const offsetY = Phaser.Math.Between(-110, 110);

    scene.tweens.add({
      targets: spark,
      x: burstX + offsetX,
      y: 270 + offsetY,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: Phaser.Math.Between(260, 460),
      onComplete: () => spark.destroy()
    });
  }
}

function showHeroGoalOverlay(title, sub, badgeText) {
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
}

function isCoreTouchingUnit(unit, coreObject) {
  const horizontalHit = Math.abs(coreObject.x - unit.x) < (UNIT_WIDTH / 2 + CORE_RADIUS);
  const verticalHit = Math.abs(coreObject.y - unit.y) < (UNIT_HEIGHT / 2 + CORE_RADIUS);
  return horizontalHit && verticalHit;
}

function resetCore(isFirstStart) {
  core.x = GAME_WIDTH / 2;
  core.y = GAME_HEIGHT / 2;

  const direction = Math.random() < 0.5 ? -1 : 1;
  coreVelocityX = START_CORE_SPEED_X * direction;

  if (isFirstStart) {
    coreVelocityY = START_CORE_SPEED_Y;
  } else {
    coreVelocityY = Phaser.Math.Between(-220, 220);

    if (Math.abs(coreVelocityY) < 80) {
      coreVelocityY = 120 * (Math.random() < 0.5 ? -1 : 1);
    }
  }
}

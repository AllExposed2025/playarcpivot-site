const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const ARENA_LEFT = 20;
const ARENA_RIGHT = 940;
const ARENA_TOP = 20;
const ARENA_BOTTOM = 520;

const UNIT_SPEED = 360;

const SHIELD_WIDTH = 16;
const SHIELD_HEIGHT = 120;
const SHIELD_OFFSET = 18;

const CORE_RADIUS = 12;
const START_CORE_SPEED_X = 320;
const START_CORE_SPEED_Y = 180;

const GOAL_WIDTH = 14;
const GOAL_HEIGHT = 140;
const GOAL_TOP = (GAME_HEIGHT - GOAL_HEIGHT) / 2;
const GOAL_BOTTOM = GOAL_TOP + GOAL_HEIGHT;

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
  createFighters();
  createCore();
  createHelpText();
  createHeroGoalOverlay();
  createInput();

  resetCore(true);
}

function update(time, delta) {
  const dt = delta / 1000;

  updateTrail(dt);

  if (roundPaused) {
    return;
  }

  moveLeftFighter(dt);
  moveRightFighter(dt);
  moveCore(dt);
}

function drawArena() {
  const scene = sceneRef;

  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0f14);

  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(ARENA_LEFT, ARENA_TOP, 920, 500);

  arenaGlow = scene.add.rectangle(480, 270, 930, 510, 0xf5a524, 0);
  arenaGlow.setStrokeStyle(2, 0xf5a524, 0.25);

  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.25);
  middle.lineBetween(GAME_WIDTH / 2, 30, GAME_WIDTH / 2, 510);

  drawCornerAccent(scene, 34, 34, 'tl');
  drawCornerAccent(scene, 926, 34, 'tr');
  drawCornerAccent(scene, 34, 506, 'bl');
  drawCornerAccent(scene, 926, 506, 'br');

  scene.add.text(480, 40, 'ARCPIVOT RUSH DUEL', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);

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

function createFighters() {
  leftFighter = createFighter(76, 270, 1);
  rightFighter = createFighter(884, 270, -1);
}

function createFighter(x, y, facing) {
  const scene = sceneRef;

  const aura = scene.add.circle(0, 0, 30, 0xf5a524, 0.05);

  const body = scene.add.circle(-8 * facing, 0, 18, 0x1b2230, 1);
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

  coreGlow = scene.add.circle(480, 270, 20, 0xf5a524, 0.15);
  coreGlow.setStrokeStyle(2, 0xf5a524, 0.18);

  core = scene.add.circle(480, 270, CORE_RADIUS, 0xff8a00, 1);
  core.setStrokeStyle(2, 0xf5f7fa, 0.4);

  coreInner = scene.add.circle(480, 270, 5, 0xfff1b8, 1);

  coreGlow.setDepth(200);
  core.setDepth(201);
  coreInner.setDepth(202);
}

function createHelpText() {
  const scene = sceneRef;

  scene.add.text(480, 510, 'FIGHTER + SHIELD TEST // W/S LINKS // PIJLEN RECHTS', {
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

function moveLeftFighter(dt) {
  if (leftKeys.up.isDown) {
    leftFighter.container.y -= UNIT_SPEED * dt;
  }

  if (leftKeys.down.isDown) {
    leftFighter.container.y += UNIT_SPEED * dt;
  }

  leftFighter.container.y = Phaser.Math.Clamp(leftFighter.container.y, 80, 460);
}

function moveRightFighter(dt) {
  if (cursors.up.isDown) {
    rightFighter.container.y -= UNIT_SPEED * dt;
  }

  if (cursors.down.isDown) {
    rightFighter.container.y += UNIT_SPEED * dt;
  }

  rightFighter.container.y = Phaser.Math.Clamp(rightFighter.container.y, 80, 460);
}

function moveCore(dt) {
  core.x += coreVelocityX * dt;
  core.y += coreVelocityY * dt;

  syncCoreVisuals();

  if (core.y - CORE_RADIUS <= ARENA_TOP) {
    core.y = ARENA_TOP + CORE_RADIUS;
    coreVelocityY *= -1;
    syncCoreVisuals();
  }

  if (core.y + CORE_RADIUS >= ARENA_BOTTOM) {
    core.y = ARENA_BOTTOM - CORE_RADIUS;
    coreVelocityY *= -1;
    syncCoreVisuals();
  }

  if (isCoreTouchingShield(leftFighter) && coreVelocityX < 0) {
    const shieldX = getShieldCenterX(leftFighter);
    core.x = shieldX + SHIELD_WIDTH / 2 + CORE_RADIUS;
    coreVelocityX = Math.abs(coreVelocityX) * 1.03;
    coreVelocityY += (core.y - leftFighter.container.y) * 4.2;
    onShieldHit(leftFighter);
    onCoreHit();
    syncCoreVisuals();
  }

  if (isCoreTouchingShield(rightFighter) && coreVelocityX > 0) {
    const shieldX = getShieldCenterX(rightFighter);
    core.x = shieldX - SHIELD_WIDTH / 2 - CORE_RADIUS;
    coreVelocityX = -Math.abs(coreVelocityX) * 1.03;
    coreVelocityY += (core.y - rightFighter.container.y) * 4.2;
    onShieldHit(rightFighter);
    onCoreHit();
    syncCoreVisuals();
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
      core.x = ARENA_RIGHT - CORE_RADIUS;
      coreVelocityX = -Math.abs(coreVelocityX);
      syncCoreVisuals();
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
  coreGlow.setVisible(false);
  coreInner.setVisible(false);

  sceneRef.time.delayedCall(1250, () => {
    hideHeroGoalOverlay();
    resetCore(false);
    core.setVisible(true);
    coreGlow.setVisible(true);
    coreInner.setVisible(true);
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

function getShieldCenterX(fighter) {
  return fighter.container.x + SHIELD_OFFSET * fighter.facing;
}

function isCoreTouchingShield(fighter) {
  const shieldX = getShieldCenterX(fighter);
  const horizontalHit = Math.abs(core.x - shieldX) < (SHIELD_WIDTH / 2 + CORE_RADIUS);
  const verticalHit = Math.abs(core.y - fighter.container.y) < (SHIELD_HEIGHT / 2 + CORE_RADIUS);
  return horizontalHit && verticalHit;
}

function onShieldHit(fighter) {
  sceneRef.tweens.add({
    targets: [fighter.shield, fighter.shieldGlow],
    scaleX: 1.18,
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

  fighter.shield.setFillStyle(0xffc15a, 1);
  fighter.shieldGlow.setAlpha(0.22);

  sceneRef.time.delayedCall(90, () => {
    fighter.shield.setFillStyle(0xf5a524, 0.92);
    fighter.shieldGlow.setAlpha(0.06);
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

function resetCore(isFirstStart) {
  core.x = GAME_WIDTH / 2;
  core.y = GAME_HEIGHT / 2;
  syncCoreVisuals();

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

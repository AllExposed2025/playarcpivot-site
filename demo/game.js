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
let centerOverlayTitle;
let centerOverlaySub;
let centerOverlayPulse;

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
  createCenterScoreOverlay();
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

  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(ARENA_LEFT, ARENA_TOP, 920, 500);

  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.25);
  middle.lineBetween(GAME_WIDTH / 2, 30, GAME_WIDTH / 2, 510);

  scene.add.text(480, 40, 'ARCPIVOT RUSH DUEL', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);
}

function createScoreboard() {
  const scene = sceneRef;

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
  leftGoalFrame.lineStyle(2, 0xf5a524, 0.75);
  leftGoalFrame.strokeRect(ARENA_LEFT, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);

  const rightGoalFrame = scene.add.graphics();
  rightGoalFrame.lineStyle(2, 0xf5a524, 0.75);
  rightGoalFrame.strokeRect(ARENA_RIGHT - GOAL_WIDTH, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);

  scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH - 4,
    GOAL_HEIGHT - 8,
    0xf5a524,
    0.18
  );

  scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH - 4,
    GOAL_HEIGHT - 8,
    0xf5a524,
    0.18
  );

  leftGoalFlash = scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH + 28,
    GOAL_HEIGHT + 30,
    0xf5a524,
    0
  );

  rightGoalFlash = scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH + 28,
    GOAL_HEIGHT + 30,
    0xf5a524,
    0
  );
}

function createUnitsAndCore() {
  const scene = sceneRef;

  leftUnit = scene.add.rectangle(80, 270, UNIT_WIDTH, UNIT_HEIGHT, 0xf5a524, 0.9);
  leftUnit.setStrokeStyle(2, 0xf5f7fa, 0.35);

  rightUnit = scene.add.rectangle(880, 270, UNIT_WIDTH, UNIT_HEIGHT, 0xf5a524, 0.9);
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

function createCenterScoreOverlay() {
  const scene = sceneRef;

  centerOverlayBg = scene.add.rectangle(480, 270, 520, 180, 0x0b0f14, 0.86);
  centerOverlayBg.setStrokeStyle(2, 0xf5a524, 0.5);
  centerOverlayBg.setVisible(false);

  centerOverlayTitle = scene.add.text(480, 240, '', {
    fontFamily: 'Courier New',
    fontSize: '34px',
    color: '#f5a524',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  centerOverlayTitle.setVisible(false);

  centerOverlaySub = scene.add.text(480, 290, '', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
  centerOverlaySub.setVisible(false);

  centerOverlayPulse = scene.add.circle(480, 270, 40, 0xf5a524, 0.18);
  centerOverlayPulse.setStrokeStyle(3, 0xf5f7fa, 0.45);
  centerOverlayPulse.setVisible(false);
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
    playGoalEffect('left');
    showCenterScoreOverlay('PLAYER ONE SCORES', 'LEFT SIDE // CORE BREAK');
  } else {
    rightScore++;
    rightScoreText.setText(String(rightScore));
    playGoalEffect('right');
    showCenterScoreOverlay('PLAYER TWO SCORES', 'RIGHT SIDE // CORE BREAK');
  }

  core.setVisible(false);

  sceneRef.time.delayedCall(900, () => {
    hideCenterScoreOverlay();
    resetCore(false);
    core.setVisible(true);
    roundPaused = false;
  });
}

function playGoalEffect(side) {
  const scene = sceneRef;
  const flash = side === 'left' ? leftGoalFlash : rightGoalFlash;

  flash.setAlpha(1);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 420
  });

  const burstX = side === 'left' ? 90 : 870;

  for (let i = 0; i < 6; i++) {
    const pulse = scene.add.circle(burstX, 270, 14 + i * 4, 0xf5a524, 0.22);
    pulse.setStrokeStyle(2, 0xf5f7fa, 0.28);

    scene.tweens.add({
      targets: pulse,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 420 + i * 40,
      onComplete: () => pulse.destroy()
    });
  }
}

function showCenterScoreOverlay(title, sub) {
  const scene = sceneRef;

  centerOverlayBg.setVisible(true);
  centerOverlayBg.setAlpha(0);

  centerOverlayTitle.setText(title);
  centerOverlayTitle.setVisible(true);
  centerOverlayTitle.setAlpha(0);
  centerOverlayTitle.setScale(0.85);

  centerOverlaySub.setText(sub);
  centerOverlaySub.setVisible(true);
  centerOverlaySub.setAlpha(0);

  centerOverlayPulse.setVisible(true);
  centerOverlayPulse.setAlpha(0.35);
  centerOverlayPulse.setScale(1);

  scene.tweens.add({
    targets: centerOverlayBg,
    alpha: 1,
    duration: 180
  });

  scene.tweens.add({
    targets: centerOverlayTitle,
    alpha: 1,
    scale: 1,
    duration: 220
  });

  scene.tweens.add({
    targets: centerOverlaySub,
    alpha: 1,
    duration: 260
  });

  scene.tweens.add({
    targets: centerOverlayPulse,
    scaleX: 5,
    scaleY: 5,
    alpha: 0,
    duration: 520
  });
}

function hideCenterScoreOverlay() {
  centerOverlayBg.setVisible(false);
  centerOverlayTitle.setVisible(false);
  centerOverlaySub.setVisible(false);
  centerOverlayPulse.setVisible(false);
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

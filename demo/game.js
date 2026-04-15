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

  // Achtergrond
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0f14);

  // Buitenrand
  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(ARENA_LEFT, ARENA_TOP, 920, 500);

  // Middenlijn
  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.25);
  middle.lineBetween(GAME_WIDTH / 2, 30, GAME_WIDTH / 2, 510);

  // Titel bovenin arena
  scene.add.text(480, 40, 'DUEL ARENA // GOAL TEST', {
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

  // Linker doel frame
  const leftGoalFrame = scene.add.graphics();
  leftGoalFrame.lineStyle(2, 0xf5a524, 0.75);
  leftGoalFrame.strokeRect(ARENA_LEFT, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);

  // Rechter doel frame
  const rightGoalFrame = scene.add.graphics();
  rightGoalFrame.lineStyle(2, 0xf5a524, 0.75);
  rightGoalFrame.strokeRect(ARENA_RIGHT - GOAL_WIDTH, GOAL_TOP, GOAL_WIDTH, GOAL_HEIGHT);

  // Linker doel glow
  scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH - 4,
    GOAL_HEIGHT - 8,
    0xf5a524,
    0.18
  );

  // Rechter doel glow
  scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH - 4,
    GOAL_HEIGHT - 8,
    0xf5a524,
    0.18
  );

  // Flash overlays
  leftGoalFlash = scene.add.rectangle(
    ARENA_LEFT + GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH + 24,
    GOAL_HEIGHT + 20,
    0xf5a524,
    0
  );

  rightGoalFlash = scene.add.rectangle(
    ARENA_RIGHT - GOAL_WIDTH / 2,
    GAME_HEIGHT / 2,
    GOAL_WIDTH + 24,
    GOAL_HEIGHT + 20,
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

  // Bovenkant
  if (core.y - CORE_RADIUS <= ARENA_TOP) {
    core.y = ARENA_TOP + CORE_RADIUS;
    coreVelocityY *= -1;
  }

  // Onderkant
  if (core.y + CORE_RADIUS >= ARENA_BOTTOM) {
    core.y = ARENA_BOTTOM - CORE_RADIUS;
    coreVelocityY *= -1;
  }

  // Linker speler raken
  if (isCoreTouchingUnit(leftUnit, core) && coreVelocityX < 0) {
    core.x = leftUnit.x + 24;
    coreVelocityX = Math.abs(coreVelocityX) * 1.03;
    coreVelocityY += (core.y - leftUnit.y) * 4;
  }

  // Rechter speler raken
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
  } else {
    rightScore++;
    rightScoreText.setText(String(rightScore));
    playGoalEffect('right');
  }

  core.setVisible(false);

  sceneRef.time.delayedCall(450, () => {
    resetCore(false);
    core.setVisible(true);
    roundPaused = false;
  });
}

function playGoalEffect(side) {
  const scene = sceneRef;
  const flash = side === 'left' ? leftGoalFlash : rightGoalFlash;
  const x = side === 'left' ? 120 : 840;

  flash.setAlpha(0.95);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 280
  });

  const goalText = scene.add.text(x, 270, 'GOAL!', {
    fontFamily: 'Courier New',
    fontSize: '28px',
    color: '#f5a524'
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: goalText,
    y: 235,
    alpha: 0,
    duration: 420,
    onComplete: () => {
      goalText.destroy();
    }
  });

  const pulse = scene.add.circle(x, 270, 18, 0xf5a524, 0.35);
  pulse.setStrokeStyle(2, 0xf5f7fa, 0.4);

  scene.tweens.add({
    targets: pulse,
    scaleX: 4,
    scaleY: 4,
    alpha: 0,
    duration: 420,
    onComplete: () => {
      pulse.destroy();
    }
  });
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

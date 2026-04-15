const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const UNIT_WIDTH = 28;
const UNIT_HEIGHT = 120;
const UNIT_SPEED = 360;

const CORE_RADIUS = 12;
const START_CORE_SPEED_X = 320;
const START_CORE_SPEED_Y = 180;

let leftUnit;
let rightUnit;
let core;

let leftKeys;
let cursors;

let coreVelocityX = START_CORE_SPEED_X;
let coreVelocityY = START_CORE_SPEED_Y;

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
  const scene = this;

  // Achtergrond
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0f14);

  // Arena rand
  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(20, 20, 920, 500);

  // Middenlijn
  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.25);
  middle.lineBetween(480, 30, 480, 510);

  // Bovenste tekst
  scene.add.text(480, 40, 'DUEL ARENA // MOVEMENT TEST', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);

  // Linker speler
  leftUnit = scene.add.rectangle(80, 270, UNIT_WIDTH, UNIT_HEIGHT, 0xf5a524, 0.9);
  leftUnit.setStrokeStyle(2, 0xf5f7fa, 0.35);

  // Rechter speler
  rightUnit = scene.add.rectangle(880, 270, UNIT_WIDTH, UNIT_HEIGHT, 0xf5a524, 0.9);
  rightUnit.setStrokeStyle(2, 0xf5f7fa, 0.35);

  // Kern
  core = scene.add.circle(480, 270, CORE_RADIUS, 0xf5a524, 1);
  core.setStrokeStyle(2, 0xf5f7fa, 0.35);

  // Onderste tekst
  scene.add.text(480, 510, 'W/S LINKS // PIJL OMHOOG/OMLAAG RECHTS', {
    fontFamily: 'Courier New',
    fontSize: '14px',
    color: '#f5f7fa'
  }).setOrigin(0.5);

  // Toetsen
  leftKeys = scene.input.keyboard.addKeys({
    up: 'W',
    down: 'S'
  });

  cursors = scene.input.keyboard.createCursorKeys();

  // Start kern
  resetCore(true);
}

function update(time, delta) {
  const dt = delta / 1000;

  moveLeftUnit(dt);
  moveRightUnit(dt);
  moveCore(dt);
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

  // Boven / onder terugkaatsen
  if (core.y <= 32) {
    core.y = 32;
    coreVelocityY *= -1;
  }

  if (core.y >= 508) {
    core.y = 508;
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

  // Uit beeld links of rechts = reset
  if (core.x < -30 || core.x > GAME_WIDTH + 30) {
    resetCore(false);
  }
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
``

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#0b0f14',
  scene: {
    create: create
  }
};

const game = new Phaser.Game(config);

function create() {
  const scene = this;

  scene.add.rectangle(480, 270, 960, 540, 0x0b0f14);

  const border = scene.add.graphics();
  border.lineStyle(2, 0xf5a524, 0.6);
  border.strokeRect(20, 20, 920, 500);

  const middle = scene.add.graphics();
  middle.lineStyle(2, 0xf5a524, 0.25);
  middle.lineBetween(480, 30, 480, 510);

  scene.add.text(480, 40, 'DUEL ARENA // PROTOTYPE', {
    fontFamily: 'Courier New',
    fontSize: '18px',
    color: '#f5a524'
  }).setOrigin(0.5);

  scene.add.rectangle(80, 270, 28, 120, 0xf5a524, 0.85);
  scene.add.rectangle(880, 270, 28, 120, 0xf5a524, 0.85);

  scene.add.circle(480, 270, 12, 0xf5a524, 1);

  scene.add.text(480, 510, 'BLOK 6 // BASIS OPGEZET', {
    fontFamily: 'Courier New',
    fontSize: '14px',
    color: '#f5f7fa'
  }).setOrigin(0.5);
}

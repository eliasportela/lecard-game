const SPEED_SCALE = 0.00008;

const game = document.querySelector("#game");
const scoreDisplay = document.querySelector("#score");
const bestScoreDisplay = document.querySelector("#bestscore");
const startMessage = document.querySelector("#start-message");
const gameoverMessage = document.querySelector("#gameover-message");

const coin = new Audio("./assets/coin.mp3");

document.addEventListener("click", startGame, { once: true });

/* general variables */
let lastTime;
let speedScale;
let score;
let bestscore;
let gameover;

bestscore = localStorage.getItem('bestscore') || 0;
bestScoreDisplay.textContent = bestscore;

/* frame update */
function update(time) { 
  if (lastTime == null) {
    lastTime = time;
    window.requestAnimationFrame(update);
    return;
  }

  const delta = time - lastTime;
  updateGround(delta, speedScale);
  updateDino(delta, speedScale);
  updateCactus(delta, speedScale);
  updateSpeedScale(delta);
  checkPoint();

  if (gameover) {
    return handleGameOver();
  }

  lastTime = time;
  window.requestAnimationFrame(update);
}

function startGame() {
  if (bestscore < score) {
    bestscore = score;
    localStorage.setItem('bestscore', bestscore.toString());
    bestScoreDisplay.textContent = bestscore;
  }

  lastTime = null;
  speedScale = 1;
  score = 0;
  setupGround();
  setupDino();
  setupCactus();
  startMessage.classList.add("hide");
  gameoverMessage.classList.add("hide");
  window.requestAnimationFrame(update);
  scoreDisplay.textContent = '0';
}

/* speeds up the game over time */
function updateSpeedScale(delta) { 
  speedScale += delta * SPEED_SCALE;
}

function updateScore(ponto) {
  score += ponto;
  scoreDisplay.textContent = score;
}

/* collision conditions */
function checkCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  );
}

function checkPoint() {
  const dinoRect = getDinoRect();
  const collision = getCactusRects().some(rect => checkCollision(rect, dinoRect));

  if (collision && checkPoint) {
    updateScore(1);
    const cactus = document.querySelectorAll(".cactus");

    if (cactus) {
      coin.play();
      cactus[0].remove();
    }
  }
}

function handleGameOver() {
  gameover = false;
  setDinoLose();
  setTimeout(() => {
    document.addEventListener("click", startGame, { once: true }); /* prevents accidental click */
    gameoverMessage.classList.remove("hide");
  }, 100);
}

/* HANDLING CSS PROPERTIES */

/* get property value */
function getCustomProperty(elem, prop) {
  return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0;
}

/* set property value */
function setCustomProperty(elem, prop, value) {
  elem.style.setProperty(prop, value);
}

/* increment the property value */
function incrementCustomProperty(elem, prop, inc) {
  setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc);
}


/* GROUND MOVEMENT */

const GROUND_SPEED = 0.05;
const grounds = document.querySelectorAll(".ground");

function setupGround() {
  setCustomProperty(grounds[0], "--left", 0);
  setCustomProperty(grounds[1], "--left", 300);
}

function updateGround(delta, speedScale) {
  grounds.forEach(ground => {
    incrementCustomProperty(ground, "--left", delta * speedScale * GROUND_SPEED * -1); /* moves the ground according to game speed */

    if (getCustomProperty(ground, "--left") <= -300) {
      incrementCustomProperty(ground, "--left", 600); /* loop the elements */
    }
  });
}

/* DINOSAUR MOVEMENT */

const dino = document.querySelector("#dino");
const JUMP_SPEED = 0.45;
const GRAVITY = 0.0015;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let isJumping;
let dinoFrame;
let currentFrameTime;
let yVelocity;

function setupDino() {
  isJumping = false;
  dinoFrame = 0;
  currentFrameTime = 0;
  yVelocity = 0;

  setCustomProperty(dino, "--bottom", 0);
  document.removeEventListener("click", onJump); /* reset the dinosaur if the player dies while jumping */
  document.addEventListener("click", onJump);
}

function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleJump(delta);
}

function getDinoRect() {
  return dino.getBoundingClientRect(); /* get the dinosaur hitbox */
}

function setDinoLose() {
  dino.src = "assets/dino-lose.png";
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dino.src = `assets/dino-jumping.png`;
    return;
  }

  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT;
    dino.src = `assets/dino-run-${dinoFrame}.png`; /* switch between images to simulate movement */
    currentFrameTime -= FRAME_TIME;
  }
  currentFrameTime += delta * speedScale;
}

function handleJump(delta) {
  if (!isJumping) return;

  incrementCustomProperty(dino, "--bottom", yVelocity * delta);

  if (getCustomProperty(dino, "--bottom") <= 0) {
    setCustomProperty(dino, "--bottom", 0);
    isJumping = false;
  }

  yVelocity -= GRAVITY * delta;
}

function onJump() {
  if (isJumping) return;

  yVelocity = JUMP_SPEED;
  isJumping = true;
}

/* ADD CACTUS */

const CACTUS_SPEED = 0.03;
const CACTUS_INTERVAL_MIN = 1500;
const CACTUS_INTERVAL_MAX = 2000;

let nextCactusTime;

function setupCactus() {
  nextCactusTime = CACTUS_INTERVAL_MIN;
  document.querySelectorAll(".cactus").forEach(cactus => {
    cactus.remove(); /* remove cactus when game restart */
  })
}

function updateCactus(delta, speedScale) {
  document.querySelectorAll(".cactus").forEach(cactus => {
    incrementCustomProperty(cactus, "--left", delta * speedScale * CACTUS_SPEED * -1);
    if (getCustomProperty(cactus, "--left") <= -20) {
      cactus.remove();
      gameover = true;
    }
  });

  if (nextCactusTime <= 0) {
    createCactus();
    nextCactusTime =
      randomizer(CACTUS_INTERVAL_MIN, CACTUS_INTERVAL_MAX) / speedScale;
  }

  nextCactusTime -= delta;
}

function getCactusRects() {
  return [...document.querySelectorAll(".cactus")].map(cactus => {
    return cactus.getBoundingClientRect(); /* get the hitbox of all the cactus on the screen */
  })
}

function createCactus() {
  const cactus = document.createElement("img");
  cactus.src = `assets/cactus-${randomizer(0,2)}.png`;
  cactus.classList.add("cactus");
  setCustomProperty(cactus, "--left", 90);
  setCustomProperty(cactus, "bottom", `${randomizer(40, 80)}%`);
  game.append(cactus);
}

function randomizer(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min); /* choose a number between minimum and maximum */
}

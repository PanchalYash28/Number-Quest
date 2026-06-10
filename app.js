const levels = {
  easy: { min: 1, max: 50, attempts: 8 },
  medium: { min: 1, max: 100, attempts: 10 },
  hard: { min: 1, max: 500, attempts: 12 }
};

const state = {
  level: "medium",
  target: 0,
  attempts: 0,
  score: 100,
  gameOver: false,
  history: []
};

const rangeLabel = document.querySelector("#rangeLabel");
const attemptsUsed = document.querySelector("#attemptsUsed");
const attemptLimit = document.querySelector("#attemptLimit");
const scoreLabel = document.querySelector("#scoreLabel");
const feedback = document.querySelector("#feedback");
const progressFill = document.querySelector("#progressFill");
const guessForm = document.querySelector("#guessForm");
const guessInput = document.querySelector("#guessInput");
const newGameButton = document.querySelector("#newGameButton");
const hintButton = document.querySelector("#hintButton");
const historyList = document.querySelector("#historyList");
const secretVisual = document.querySelector("#secretVisual");
const difficultyButtons = document.querySelectorAll(".difficulty-button");
const canvas = document.querySelector("#sparkCanvas");
const context = canvas.getContext("2d");

function randomTarget(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function currentLevel() {
  return levels[state.level];
}

function resetGame() {
  const level = currentLevel();
  state.target = randomTarget(level.min, level.max);
  state.attempts = 0;
  state.score = 100;
  state.gameOver = false;
  state.history = [];
  guessInput.disabled = false;
  guessInput.value = "";
  secretVisual.textContent = "?";
  setFeedback("Game ready. Make your first move.", "");
  updateView();
  guessInput.focus();
}

function setFeedback(message, tone) {
  feedback.textContent = message;
  feedback.className = `feedback ${tone}`.trim();
}

function updateView() {
  const level = currentLevel();
  rangeLabel.textContent = `${level.min}-${level.max}`;
  attemptsUsed.textContent = state.attempts;
  attemptLimit.textContent = level.attempts;
  scoreLabel.textContent = state.score;
  progressFill.style.width = `${(state.attempts / level.attempts) * 100}%`;

  historyList.innerHTML = "";
  if (state.history.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-history";
    emptyItem.textContent = "No guesses yet";
    historyList.appendChild(emptyItem);
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${entry.guess}</strong> ${entry.result}`;
    historyList.appendChild(item);
  });
}

function getGuessFeedback(guess, target) {
  const difference = Math.abs(target - guess);
  const direction = guess < target ? "low" : "high";
  const nextMove = direction === "low" ? "Try a bigger number." : "Try a smaller number.";

  if (difference <= 5) {
    return {
      message: `Almost there, but still ${direction}. ${nextMove}`,
      finalMessage: `Almost there, but still ${direction}.`,
      history: `was almost there, but ${direction}`
    };
  }

  if (difference <= 15) {
    return {
      message: `A little ${direction}. ${nextMove}`,
      finalMessage: `A little ${direction}.`,
      history: `was a little ${direction}`
    };
  }

  return {
    message: `Too ${direction}. ${nextMove}`,
    finalMessage: `Too ${direction}.`,
    history: `was too ${direction}`
  };
}

function parseGuess(rawValue) {
  const value = rawValue.trim();
  if (value === "") {
    return { valid: false, message: "Enter a number before guessing." };
  }

  if (!/^-?\d+$/.test(value)) {
    return { valid: false, message: "Only whole numbers are accepted." };
  }

  const guess = Number(value);
  const level = currentLevel();
  if (guess < level.min || guess > level.max) {
    return { valid: false, message: `Pick a number from ${level.min} to ${level.max}.` };
  }

  return { valid: true, guess };
}

function makeGuess(guess) {
  const level = currentLevel();
  state.attempts += 1;

  if (guess === state.target) {
    state.gameOver = true;
    state.score = Math.max(10, 100 - (state.attempts - 1) * 8);
    state.history.push({ guess, result: "was correct" });
    secretVisual.textContent = state.target;
    guessInput.disabled = true;
    setFeedback(`Correct! You solved it in ${state.attempts} attempt${state.attempts === 1 ? "" : "s"}.`, "win");
    updateView();
    burst();
    return;
  }

  const result = getGuessFeedback(guess, state.target);
  state.history.push({ guess, result: result.history });
  state.score = Math.max(0, 100 - state.attempts * 8);

  if (state.attempts >= level.attempts) {
    state.gameOver = true;
    secretVisual.textContent = state.target;
    guessInput.disabled = true;
    setFeedback(`Round over. ${result.finalMessage} The secret number was ${state.target}.`, "error");
  } else {
    setFeedback(result.message, "warning");
  }

  updateView();
}

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (state.gameOver) {
    setFeedback("Start a new game to keep playing.", "warning");
    return;
  }

  const parsed = parseGuess(guessInput.value);
  if (!parsed.valid) {
    setFeedback(parsed.message, "error");
    guessInput.select();
    return;
  }

  makeGuess(parsed.guess);
  guessInput.value = "";
});

newGameButton.addEventListener("click", resetGame);

hintButton.addEventListener("click", () => {
  if (state.gameOver) {
    setFeedback("Start a new game for a fresh hint.", "warning");
    return;
  }

  const parity = state.target % 2 === 0 ? "even" : "odd";
  setFeedback(`Hint: the secret number is ${parity}.`, "warning");
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.level = button.dataset.level;
    difficultyButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    resetGame();
  });
});

function drawBackground() {
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#20303a";
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 38; i += 1) {
    const x = (i * 37 + performance.now() / 30) % width;
    const y = (Math.sin(i + performance.now() / 900) * 48) + height / 2;
    context.fillStyle = i % 3 === 0 ? "#f2c14e" : i % 3 === 1 ? "#59c9a5" : "#e76f51";
    context.globalAlpha = 0.58;
    context.fillRect(x, y, 8, 8);
  }

  context.globalAlpha = 1;
  requestAnimationFrame(drawBackground);
}

function burst() {
  let frame = 0;
  const timer = window.setInterval(() => {
    secretVisual.style.transform = `translate(-50%, -50%) scale(${1 + Math.sin(frame) * 0.05})`;
    frame += 1;
    if (frame > 14) {
      window.clearInterval(timer);
      secretVisual.style.transform = "translate(-50%, -50%)";
    }
  }, 45);
}

drawBackground();
resetGame();

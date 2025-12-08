// =============================== 
//     WHO'S THAT POKÉMON?
//     Continuous · Timer · Sound · Guess History · Difficulty
// ===============================

let currentPokemon = null;
let correctAnswer = "";
let score = 0;
let attempt = 0;

let timerInterval = null;
let timeLeft = 12;

// Guess tracking
let totalGuesses = 0;
let correctGuesses = 0;
let guessHistory = []; // stores last N guesses

// Difficulty setup
let currentDifficulty = "normal"; // default
const difficultySettings = {
    easy: { choices: 2, time: 15 },
    normal: { choices: 4, time: 12 },
    hard: { choices: 6, time: 10 }
};

const pokemonImage = document.getElementById("pokemonImage");
const choicesArea = document.getElementById("choicesArea");
const pokemonList = document.getElementById("pokemonList");
const guessHistoryDiv = document.getElementById("guessHistory"); // for displaying guess history
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

// Preloaded list of Pokémon names
let allPokemonNames = [];

// ---------------------------------------------
// PRELOAD ALL POKÉMON NAMES
// ---------------------------------------------
async function preloadPokemonNames() {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=898");
    const data = await res.json();
    allPokemonNames = data.results.map(p => capitalize(p.name));
}

// ---------------------------------------------
// REFERENCE BANK — CLEAR + ADD NEW ENTRY
// ---------------------------------------------
function addReferenceEntry(pokemon) {
    pokemonList.innerHTML = ""; // Clear old info
    const entry = document.createElement("div");
    const heightMeters = (pokemon.height / 10).toFixed(1);
    const weightKg = (pokemon.weight / 10);
    const weightLbs = (weightKg * 2.20462).toFixed(1);
    const typesText = pokemon.types.join(" / ");
    entry.innerHTML = `<small>${typesText}-type · ${heightMeters} m · ${weightLbs} lbs</small>`;
    pokemonList.appendChild(entry);
}

// ---------------------------------------------
// GET RANDOM POKÉMON
// ---------------------------------------------
async function getRandomPokemon() {
    while (true) {
        const id = Math.floor(Math.random() * 898) + 1;
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        const sprite = data.sprites.other["official-artwork"].front_default;
        if (sprite) {
            return {
                name: capitalize(data.name),
                sprite: sprite,
                types: data.types.map(t => capitalize(t.type.name)),
                height: data.height,
                weight: data.weight
            };
        }
    }
}

// ---------------------------------------------
// START GAME
// ---------------------------------------------
async function initGame() {
    score = 0;
    totalGuesses = 0;
    correctGuesses = 0;
    guessHistory = [];
    updateScore();
    updateGuessHistory();
    await preloadPokemonNames();
    setupDifficultyButtons();
    loadNewPokemon();
}

// ---------------------------------------------
// DIFFICULTY BUTTONS
// ---------------------------------------------
function setupDifficultyButtons() {
    difficultyButtons.forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.mode === currentDifficulty) btn.classList.add("active");

        btn.addEventListener("click", () => {
            currentDifficulty = btn.dataset.mode;
            difficultyButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Reset score and guess history when difficulty changes
            score = 0;
            totalGuesses = 0;
            correctGuesses = 0;
            guessHistory = [];
            updateScore();
            updateGuessHistory();

            loadNewPokemon();
        });
    });
}

// ---------------------------------------------
// LOAD NEW ROUND
// ---------------------------------------------
async function loadNewPokemon() {
    clearInterval(timerInterval);

    attempt = 0;
    timeLeft = difficultySettings[currentDifficulty].time;

    choicesArea.innerHTML = "";
    pokemonImage.innerHTML = "Loading...";
    document.getElementById("timer").textContent = timeLeft;

    currentPokemon = await getRandomPokemon();
    correctAnswer = currentPokemon.name;

    addReferenceEntry(currentPokemon);

    pokemonImage.classList.add("silhouette");
    pokemonImage.innerHTML = `<img src="${currentPokemon.sprite}" height="250">`;

    generateChoices();
    startTimer();
}

// ---------------------------------------------
// GENERATE CHOICE BUTTONS WITH DIFFICULTY
// ---------------------------------------------
function generateChoices() {
    const numChoices = difficultySettings[currentDifficulty].choices;

    const choices = new Set();
    choices.add(correctAnswer);

    while (choices.size < numChoices) {
        const randomName = allPokemonNames[Math.floor(Math.random() * allPokemonNames.length)];
        if (randomName !== correctAnswer) choices.add(randomName);
    }

    const finalChoices = [...choices].sort(() => Math.random() - 0.5);

    choicesArea.innerHTML = "";
    finalChoices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "choice-button";
        btn.textContent = choice;
        btn.onclick = () => handleGuess(choice);
        choicesArea.appendChild(btn);
    });
}

// ---------------------------------------------
// COUNTDOWN TIMER
// ---------------------------------------------
function startTimer() {
    clearInterval(timerInterval);
    document.getElementById("timer").textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            stopAllSounds();
            revealPokemon(false);
            setTimeout(() => loadNewPokemon(), 1200);
        }
    }, 1000);
}

// ---------------------------------------------
// HANDLE GUESS
// ---------------------------------------------
function handleGuess(selected) {
    clearInterval(timerInterval);

    const correctSound = document.getElementById("correctSound");
    const lowhpSound = document.getElementById("lowhpSound");

    disableAllButtons();
    stopAllSounds();

    totalGuesses++;
    const isCorrect = selected === correctAnswer;
    if (isCorrect) correctGuesses++;

    // Add to guess history
    guessHistory.push({ name: selected, correct: isCorrect });
    updateGuessHistory();

    // CORRECT
    if (isCorrect) {
        pokemonImage.classList.remove("silhouette");
        highlightButton(selected, "correct");
        correctSound.play();
        score++;
        updateScore();
        setTimeout(() => {
            clearHighlights();
            loadNewPokemon();
        }, 1200);
    } 
    // WRONG
    else {
        attempt++;
        highlightButton(selected, "incorrect");
        lowhpSound.play();
        if (attempt >= 2) {
            score = 0;
            updateScore();
            pokemonImage.classList.remove("silhouette");
            setTimeout(() => {
                stopAllSounds();
                clearHighlights();
                loadNewPokemon();
            }, 1500);
        } else {
            setTimeout(enableAllButtons, 900);
        }
    }
}

// ---------------------------------------------
// REVEAL POKÉMON
// ---------------------------------------------
function revealPokemon(correct) {
    pokemonImage.classList.remove("silhouette");
}

// ---------------------------------------------
// UPDATE GUESS HISTORY DISPLAY + COUNTERS
// ---------------------------------------------
function updateGuessHistory() {
    if (!guessHistoryDiv) return;
    guessHistoryDiv.innerHTML = "";

    const recentGuesses = guessHistory.slice(-6);
    recentGuesses.forEach(g => {
        const entry = document.createElement("div");
        entry.textContent = g.name;
        entry.style.color = g.correct ? "green" : "red";
        guessHistoryDiv.appendChild(entry);
    });

    const totalElem = document.getElementById("totalGuesses");
    const correctElem = document.getElementById("correctGuesses");
    if (totalElem) totalElem.textContent = totalGuesses;
    if (correctElem) correctElem.textContent = correctGuesses;

    if (totalGuesses > 0) {
        const ratio = correctGuesses / totalGuesses;
        const color = ratio >= 0.5 ? "green" : "red";
        if (correctElem) correctElem.style.color = color;
        if (totalElem) totalElem.style.color = color;
    } else {
        if (correctElem) correctElem.style.color = "black";
        if (totalElem) totalElem.style.color = "black";
    }
}

// ---------------------------------------------
// SOUND RESETTER
// ---------------------------------------------
function stopAllSounds() {
    const sounds = document.querySelectorAll("audio");
    sounds.forEach(s => {
        s.pause();
        s.currentTime = 0;
    });
}

// ---------------------------------------------
// HELPERS
// ---------------------------------------------
function disableAllButtons() {
    document.querySelectorAll(".choice-button").forEach(b => b.disabled = true);
}

function enableAllButtons() {
    document.querySelectorAll(".choice-button").forEach(b => b.disabled = false);
}

function highlightButton(name, state) {
    document.querySelectorAll(".choice-button").forEach(btn => {
        if (btn.textContent === name) btn.classList.add(state);
    });
}

function clearHighlights() {
    document.querySelectorAll(".choice-button").forEach(btn => {
        btn.classList.remove("correct", "incorrect");
    });
}

function updateScore() {
    document.getElementById("score").textContent = score;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------
// START GAME WHEN PAGE LOADS
// ---------------------------------------------
window.addEventListener("DOMContentLoaded", initGame);

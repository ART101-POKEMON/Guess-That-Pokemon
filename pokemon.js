// ===============================
//     WHO'S THAT POKÉMON?
//     Continuous · Timer · Sound
// ===============================

let currentPokemon = null;
let correctAnswer = "";
let score = 0;
let attempt = 0;

let timerInterval = null;
let timeLeft = 12;

const pokemonImage = document.getElementById("pokemonImage");
const choicesArea = document.getElementById("choicesArea");
const pokemonList = document.getElementById("pokemonList");

// Preloaded list of Pokémon names
let allPokemonNames = [];

// ---------------------------------------------
// PRELOAD ALL POKÉMON NAMES (FAST + RELIABLE)
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
    const weightKg = pokemon.weight / 10;
    const weightLbs = (weightKg * 2.20462).toFixed(1);

    const typesText = pokemon.types.join(" / ");

    entry.innerHTML = `
        <small>
            ${typesText}-type · ${heightMeters} m · ${weightLbs} lbs
        </small>
    `;

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
    updateScore();
    await preloadPokemonNames();
    loadNewPokemon();
}

// ---------------------------------------------
// LOAD NEW ROUND
// ---------------------------------------------
async function loadNewPokemon() {
    clearInterval(timerInterval);

    attempt = 0;
    timeLeft = 12;

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
// GENERATE CHOICE BUTTONS
// ---------------------------------------------
function generateChoices() {
    const choices = new Set();
    choices.add(correctAnswer);

    while (choices.size < 4) {
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
    clearInterval(timerInterval); // stop any previous timer

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;

        // When timer reaches zero → RESET GAME
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resetGame();
        }
    }, 1000);
}

// ---------------------------------------------
// GUESS LOGIC
// ---------------------------------------------
function handleGuess(selected) {
    clearInterval(timerInterval);

    const correctSound = document.getElementById("correctSound");
    const lowhpSound = document.getElementById("lowhpSound");

    disableAllButtons();

    // CORRECT GUESS
    if (selected === correctAnswer) {
        pokemonImage.classList.remove("silhouette");
        highlightButton(selected, "correct");

        stopAllSounds();
        correctSound.play();

        score++;
        updateScore();

        setTimeout(() => {
            clearHighlights();
            loadNewPokemon();
        }, 1200);
    }

    // WRONG GUESS
    else {
        attempt++;
        highlightButton(selected, "incorrect");

        stopAllSounds();
        lowhpSound.play();

        if (attempt >= 2) {
            score = 0;
            updateScore();
            pokemonImage.classList.remove("silhouette");

            setTimeout(() => {
                clearHighlights();
                loadNewPokemon();
            }, 1500);
        } else {
            setTimeout(enableAllButtons, 900);
        }
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

function resetGame() {
    score = 0;
    document.getElementById("score").textContent = score;

    timeLeft = 12;
    document.getElementById("timer").textContent = timeLeft;

    generatePokemon();   // your function that picks a new Pokémon

    startTimer();        // restart countdown
}

window.onload = () => {
    generatePokemon();
    startTimer();
};


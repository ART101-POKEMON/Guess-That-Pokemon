// ===============================
//     WHO'S THAT POKÉMON
//     — CONTINUOUS + TIMER + SOUND —
// ===============================

let currentPokemon = null;
let correctAnswer = "";
let score = 0;
let attempt = 0;

let timerInterval = null;
let timeLeft = 12;

const pokemonImage = document.getElementById("pokemonImage");
const choicesArea = document.getElementById("choicesArea");

// ---------------------------------------------
// PRELOAD ALL POKÉMON NAMES (FAST + RELIABLE)
// ---------------------------------------------
let allPokemonNames = [];

async function preloadPokemonNames() {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=898");
    const data = await res.json();
    allPokemonNames = data.results.map(p => capitalize(p.name));
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

        // Skip Pokémon with no artwork → avoids freezing
        if (sprite) {
            return {
                name: capitalize(data.name),
                sprite: sprite
            };
        }
    }
}

function addReferenceEntry(pokemon) {
    const entry = document.createElement("div");

    // Convert PokeAPI units:
    // height: decimeters -> meters, weight: hectograms -> kg -> lbs
    const heightMeters = (pokemon.height / 10).toFixed(1); // e.g. 17 -> 1.7 m
    const weightKg = pokemon.weight / 10;                  // e.g. 905 -> 90.5 kg
    const weightLbs = (weightKg * 2.20462).toFixed(1);     // kg -> lbs

    const typesText = pokemon.types.join(" / ");

    entry.innerHTML =
        "<small>" + typesText + "-type · " + heightMeters + " m · " + weightLbs + " lbs</small>";

    pokemonList.appendChild(entry);
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

    pokemonImage.classList.add("silhouette");
    pokemonImage.innerHTML = `<img src="${currentPokemon.sprite}" height="250">`;

    generateChoices();
    startTimer();
}

// ---------------------------------------------
// GENERATE CHOICES
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
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleGuess("TIMEOUT");
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

    // CORRECT
    if (selected === correctAnswer) {
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
        lowhpSound.play();  // GEN 5 LOW HP MUSIC

        // 2 wrong attempts → reset streak
        if (attempt >= 2) {
            score = 0;
            updateScore();
            pokemonImage.classList.remove("silhouette");

            setTimeout(() => {
                clearHighlights();
                loadNewPokemon();
            }, 1500);
        }

        // First wrong attempt → allow second chance
        else {
            setTimeout(enableAllButtons, 900);
        }
    }
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
// START GAME
// ---------------------------------------------
window.addEventListener("DOMContentLoaded", initGame);

const correctSound = document.getElementById("correctSound");

if (selected === correctAnswer) {
    pokemonImage.classList.remove("silhouette");
    highlightButton(selected, "correct");

    stopAllSounds();   // <-- ADD THIS
    correctSound.play();

    score++;
    updateScore();

    setTimeout(() => {
        clearHighlights();
        loadNewPokemon();
    }, 1200);
}

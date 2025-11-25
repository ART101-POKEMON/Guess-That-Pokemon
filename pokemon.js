// Pokemon database - (we can expand this)
const pokemonDatabase = [
    { name: "Pikachu", emoji: "⚡", type: "Electric" },
    { name: "Charizard", emoji: "🔥", type: "Fire/Flying" },
    { name: "Bulbasaur", emoji: "🌱", type: "Grass/Poison" },
    { name: "Squirtle", emoji: "💧", type: "Water" },
    { name: "Jigglypuff", emoji: "🎵", type: "Normal/Fairy" },
    { name: "Meowth", emoji: "😺", type: "Normal" },
    { name: "Psyduck", emoji: "🦆", type: "Water" },
    { name: "Gengar", emoji: "👻", type: "Ghost/Poison" },
    { name: "Snorlax", emoji: "😴", type: "Normal" },
    { name: "Mewtwo", emoji: "🧬", type: "Psychic" },
    { name: "Eevee", emoji: "🦊", type: "Normal" },
    { name: "Dragonite", emoji: "🐉", type: "Dragon/Flying" }
];

let currentPokemon = null;
let score = 0;
let guessedPokemon = [];

function initGame() {
    score = 0;
    guessedPokemon = [];
    updateScore();
    renderPokemonList();
    loadNewPokemon();
}

function loadNewPokemon() {
    const availablePokemon = pokemonDatabase.filter(p => !guessedPokemon.includes(p.name));
    
    if (availablePokemon.length === 0) {
        showModal(true, "You caught them all!", "Congratulations! You've guessed all Pokemon!");
        return;
    }

    const randomIndex = Math.floor(Math.random() * availablePokemon.length);
    currentPokemon = availablePokemon[randomIndex];
    
    document.getElementById('pokemonImage').textContent = currentPokemon.emoji;
    document.getElementById('pokemonImage').classList.add('silhouette');
    document.getElementById('pokemonHint').textContent = `Type: ${currentPokemon.type}`;
    
    generateChoices();
}

function generateChoices() {
    const choicesArea = document.getElementById('choicesArea');
    choicesArea.innerHTML = '';
    
    // Get 3 wrong answers
    const wrongChoices = pokemonDatabase
        .filter(p => p.name !== currentPokemon.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    
    // Combine with correct answer and shuffle
    const allChoices = [...wrongChoices, currentPokemon].sort(() => Math.random() - 0.5);
    
    // Create buttons
    allChoices.forEach(pokemon => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = pokemon.name;
        button.onclick = () => checkGuess(pokemon.name);
        choicesArea.appendChild(button);
    });
}

function checkGuess(guessedName) {
    const buttons = document.querySelectorAll('.choice-button');
    
    // Disable all buttons
    buttons.forEach(btn => {
        btn.style.pointerEvents = 'none';
        if (btn.textContent === currentPokemon.name) {
            btn.classList.add('correct');
        } else if (btn.textContent === guessedName) {
            btn.classList.add('incorrect');
        }
    });

    if (guessedName === currentPokemon.name) {
        // Correct guess
        document.getElementById('pokemonImage').classList.remove('silhouette');
        score++;
        updateScore();
        guessedPokemon.push(currentPokemon.name);
        renderPokemonList();
        setTimeout(() => {
            showModal(true, "Correct!", `It's ${currentPokemon.name}!`);
        }, 800);
    } else {
        // Wrong guess
        document.getElementById('pokemonImage').classList.remove('silhouette');
        setTimeout(() => {
            showModal(false, "Incorrect!", `Wrong answer! The correct answer was ${currentPokemon.name}. Starting over...`);
        }, 800);
    }
}

function showModal(isCorrect, title, text) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');

    modalTitle.textContent = title;
    modalText.textContent = text;
    
    modalContent.className = 'modal-content ' + (isCorrect ? 'correct' : 'incorrect');
    modal.classList.add('show');
}

function handleModalClose() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    
    const modalContent = document.getElementById('modalContent');
    if (modalContent.classList.contains('incorrect')) {
        // Wrong answer - restart game
        initGame();
    } else {
        // Correct answer - load next pokemon
        loadNewPokemon();
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function renderPokemonList() {
    const list = document.getElementById('pokemonList');
    list.innerHTML = '';
    
    pokemonDatabase.forEach(pokemon => {
        const item = document.createElement('div');
        item.className = 'pokemon-item' + (guessedPokemon.includes(pokemon.name) ? ' guessed' : '');
        item.textContent = `${pokemon.emoji} ${pokemon.name}`;
        list.appendChild(item);
    });
}

// Initialize game on load
window.addEventListener('DOMContentLoaded', function() {
    initGame();
});
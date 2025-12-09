const socket = io();

// DOM Elements
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomId');
const nameInput = document.getElementById('playerName');
const joinSection = document.getElementById('joinSection');
const gameDiv = document.getElementById('game');
const playersCountDiv = document.getElementById('playersCount');
const logDiv = document.getElementById('log');

const hungerSpan = document.getElementById('hunger');
const happinessSpan = document.getElementById('happiness');
const cleanlinessSpan = document.getElementById('cleanliness');

const hungerBar = document.getElementById('hungerBar');
const happinessBar = document.getElementById('happinessBar');
const cleanlinessBar = document.getElementById('cleanlinessBar');

const petImage = document.getElementById('petImage');

// Pet image paths - adjust these based on your actual file names
const petImages = {
  // Normal states based on overall mood
  happy: 'coffretchi.gif',
  normal: 'straight.png',
  sad: 'ded.gif',
  
  // Action animations
  eating: 'eating.gif',
  playing: 'playing.gif',
  cleaning: 'cleaning.gif'
};

let currentAction = null;
let actionTimeout = null;
let latestState = null;

// Socket event handlers
socket.on('roomFull', (data) => {
  alert(data.message);
});

// Join room
joinBtn.addEventListener('click', () => {
  const roomId = roomInput.value.trim();
  const playerName = nameInput.value.trim() || 'Player';
  if (!roomId) return alert('Enter room id');
  
  socket.emit('joinRoom', { roomId, playerName });
  joinSection.classList.add('hidden');
  gameDiv.classList.remove('hidden');
  appendLog(`Joined room ${roomId} as ${playerName}`);
});

// Listen for action animations (separate event)
socket.on('petAction', (data) => {
  showActionAnimation(data.action);
  appendLog(`${data.playerName} performed: ${data.action}`);
});

// Update pet state
socket.on('petState', (state) => {
  latestState = state;
  updateStats(state);
  
  // Only update mood if not performing an action
  if (!currentAction) {
    updatePetMood(state);
  }
});

// Update player count
socket.on('players', (d) => {
  playersCountDiv.textContent = `Players: ${d.count}`;
});

// Handle action buttons
document.getElementById('actions').addEventListener('click', (ev) => {
  if (ev.target.tagName !== 'BUTTON' && ev.target.tagName !== 'BR') return;
  
  const button = ev.target.tagName === 'BUTTON' ? ev.target : ev.target.parentElement;
  const action = button.dataset.action;
  
  if (!action) return;
  
  socket.emit('action', { action });
});

// Update stats display and bars
function updateStats(state) {
  hungerSpan.textContent = state.hunger;
  happinessSpan.textContent = state.happiness;
  cleanlinessSpan.textContent = state.cleanliness;
  
  hungerBar.style.width = `${state.hunger}%`;
  happinessBar.style.width = `${state.happiness}%`;
  cleanlinessBar.style.width = `${state.cleanliness}%`;
  
  // Change bar colors based on values
  updateBarColor(hungerBar, state.hunger, true); // reverse for hunger (high = bad)
  updateBarColor(happinessBar, state.happiness, false);
  updateBarColor(cleanlinessBar, state.cleanliness, false);
}

function updateBarColor(bar, value, reverse) {
  const actualValue = reverse ? 100 - value : value;
  
  if (actualValue < 30) {
    bar.className = 'stat-bar h-full bg-gradient-to-r from-red-500 to-red-700 rounded-full';
  } else if (actualValue < 60) {
    bar.className = 'stat-bar h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full';
  } else {
    bar.className = 'stat-bar h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full';
  }
}

// Update pet image based on overall wellbeing
function updatePetMood(state) {
  let imagePath;
  
  // Calculate overall wellbeing (lower hunger is better, higher happiness/cleanliness is better)
  const hungerScore = 100 - state.hunger; // invert hunger so lower is better
  const overallWellbeing = (hungerScore + state.happiness + state.cleanliness) / 3;
  
  // Determine mood based on overall wellbeing
  if (overallWellbeing >= 65) {
    imagePath = petImages.happy;
  } else if (overallWellbeing >= 35) {
    imagePath = petImages.normal;
  } else {
    imagePath = petImages.sad;
  }
  
  petImage.src = imagePath;
}

// Show action animation
function showActionAnimation(action) {
  // Clear any existing timeout
  if (actionTimeout) {
    clearTimeout(actionTimeout);
  }
  
  currentAction = action;
  
  // Set the action image
  if (action === 'feed') {
    petImage.src = petImages.eating;
  } else if (action === 'play') {
    petImage.src = petImages.playing;
  } else if (action === 'clean') {
    petImage.src = petImages.cleaning;
  }
  
  // Return to normal state after 2 seconds
  actionTimeout = setTimeout(() => {
    currentAction = null;
    // Update to current mood if we have latest state
    if (latestState) {
      updatePetMood(latestState);
    }
  }, 2000);
}

// Append log message
function appendLog(text) {
  const p = document.createElement('div');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  p.className = 'text-purple-200 opacity-80';
  logDiv.prepend(p);
  
  // Keep only last 10 messages
  while (logDiv.children.length > 10) {
    logDiv.removeChild(logDiv.lastChild);
  }
}
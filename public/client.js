const socket = io();

socket.on('roomFull', (data) => {
  alert(data.message);
});

const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomId');
const nameInput = document.getElementById('playerName');
const gameDiv = document.getElementById('game');
const playersCountDiv = document.getElementById('playersCount');
const logDiv = document.getElementById('log');

const hungerSpan = document.getElementById('hunger');
const happinessSpan = document.getElementById('happiness');
const cleanlinessSpan = document.getElementById('cleanliness');

joinBtn.addEventListener('click', () => {
  const roomId = roomInput.value.trim();
  const playerName = nameInput.value.trim() || 'Player';
  if (!roomId) return alert('Enter room id');
  socket.emit('joinRoom', { roomId, playerName });
  gameDiv.style.display = 'block';
  appendLog(`Joined room ${roomId} as ${playerName}`);
});


socket.on('petState', (state) => {
  hungerSpan.textContent = state.hunger;
  happinessSpan.textContent = state.happiness;
  cleanlinessSpan.textContent = state.cleanliness;
  appendLog(`State updated (h:${state.hunger} hp:${state.happiness} c:${state.cleanliness})`);
});

socket.on('players', (d) => {
  playersCountDiv.textContent = `Players: ${d.count}`;
});

document.getElementById('actions').addEventListener('click', (ev) => {
  if (ev.target.tagName !== 'BUTTON') return;
  const action = ev.target.dataset.action;
  socket.emit('action', { action });
  appendLog(`You => ${action}`);
});

function appendLog(text) {
  const p = document.createElement('div');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  logDiv.prepend(p);
}

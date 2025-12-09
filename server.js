const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Pet = require('./models/Pet');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tamagotchi';
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

//connect mongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


function clamp(v){ return Math.max(0, Math.min(100, Math.round(v))); }

//load/create pet
async function getOrCreatePet(roomId) {
  let pet = await Pet.findOne({ roomId });
  if (!pet) {
    pet = new Pet({ roomId });
    await pet.save();
  }
  return pet;
}

//periodic decay
const DECAY_INTERVAL_MS = 10000; 
const HUNGER_DECAY = 2;
const HAPPINESS_DECAY = 1;
const CLEANLINESS_DECAY = 1;

setInterval(async () => {
  try {
    const pets = await Pet.find({});
    for (const pet of pets) {
      pet.hunger = clamp(pet.hunger + HUNGER_DECAY); 
      pet.happiness = clamp(pet.happiness - HAPPINESS_DECAY);
      pet.cleanliness = clamp(pet.cleanliness - CLEANLINESS_DECAY);
      pet.lastUpdated = new Date();
      await pet.save();
      // broadcast updated state to room if clients connected
      io.to(pet.roomId).emit('petState', {
        roomId: pet.roomId,
        hunger: pet.hunger,
        happiness: pet.happiness,
        cleanliness: pet.cleanliness,
        lastUpdated: pet.lastUpdated
      });
    }
  } catch (err) {
    console.error('Decay error', err);
  }
}, DECAY_INTERVAL_MS);


io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // join room - client sends { roomId, playerName }
  socket.on('joinRoom', async (data) => {
  const { roomId, playerName } = data;


  const socketsInRoom = await io.in(roomId).fetchSockets();
  if (socketsInRoom.length >= 2) {
    socket.emit('roomFull', { message: 'Room is full. Maximum 2 players allowed.' });
    return;
  }

  socket.join(roomId);
  socket.data.playerName = playerName || 'Player';
  socket.data.roomId = roomId;
  console.log(`${socket.id} joined ${roomId} as ${playerName}`);

  const pet = await getOrCreatePet(roomId);

  // send current pet state to this socket
  socket.emit('petState', {
    roomId,
    hunger: pet.hunger,
    happiness: pet.happiness,
    cleanliness: pet.cleanliness,
    lastUpdated: pet.lastUpdated
  });

  // notify room about players count
  const updatedSockets = await io.in(roomId).fetchSockets();
  io.to(roomId).emit('players', { count: updatedSockets.length });
});


  // handle actions
  socket.on('action', async (data) => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const pet = await getOrCreatePet(roomId);
      const action = data.action;
      const playerName = socket.data.playerName;

      // basic action effects
      if (action === 'feed') {
        pet.hunger = clamp(pet.hunger - (data.amount || 20));
        pet.happiness = clamp(pet.happiness + 2);
      } else if (action === 'play') {
        pet.happiness = clamp(pet.happiness + (data.amount || 15));
        pet.hunger = clamp(pet.hunger + 5);
      } else if (action === 'clean') {
        pet.cleanliness = clamp(pet.cleanliness + (data.amount || 30));
        pet.happiness = clamp(pet.happiness + 1);
      } else {
        return;
      }

      pet.lastUpdated = new Date();
      await pet.save();

      // FIRST: broadcast the action animation to everyone
      io.to(roomId).emit('petAction', {
        action: action,
        playerName: playerName
      });

      // THEN: broadcast updated pet state to room (slight delay to ensure action is processed first)
      setTimeout(() => {
        io.to(roomId).emit('petState', {
          roomId,
          hunger: pet.hunger,
          happiness: pet.happiness,
          cleanliness: pet.cleanliness,
          lastUpdated: pet.lastUpdated
        });
      }, 50);
      
    } catch (err) {
      console.error('action error', err);
    }
  });

  socket.on('disconnect', async () => {
    const roomId = socket.data.roomId;
    console.log('disconnect', socket.id, roomId);
    if (roomId) {
      const sockets = await io.in(roomId).fetchSockets();
      io.to(roomId).emit('players', { count: sockets.length });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
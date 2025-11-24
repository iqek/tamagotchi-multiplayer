# tamagotchi multiplayer

This project implements the backend for a 2-player Tamagotchi game.  
It is built using Node.js, Express, Socket.IO, and MongoDB. The frontend is not included yet, the client currently runs with simple html/js for testing purposes.

## features

- Real-time multiplayer: two players can see and interact with the same pet.
- Pet stats: hunger and cleanliness change over time.
- Real-time communication with Socket.IO.
- MongoDB stores pet state persistently.
- Maximum 2-player limit per room.
- Simple API and event-based design.

## installation

1. Clone the repo:

```bash
git clone https://github.com/<your-username>/tamagotchi-multiplayer.git
cd tamagotchi-multiplayer

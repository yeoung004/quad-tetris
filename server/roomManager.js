import http from 'http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const rooms = {};

function assignFaces(players) {
  const faceIndices = [0, 1, 2, 3];
  const mapping = {};
  if (players.length === 1) {
      mapping[players[0]] = [0, 1, 2, 3];
  } else if (players.length === 2) {
    mapping[players[0]] = [0, 1];
    mapping[players[1]] = [2, 3];
  } else if (players.length === 3) {
    const lucky = players[Math.floor(Math.random() * 3)];
    const others = players.filter(p => p !== lucky);
    mapping[lucky] = [0, 1];
    mapping[others[0]] = [2];
    mapping[others[1]] = [3];
  } else if (players.length === 4) {
    players.forEach((player, i) => {
        mapping[player] = [i];
    })
  }
  return mapping;
}

io.on('connection', (socket) => {
  console.log(`a user connected: ${socket.id}`);

  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    if (!rooms[roomName]) {
      rooms[roomName] = { players: [] };
    }
    rooms[roomName].players.push(socket.id);
    console.log(`User ${socket.id} joined room ${roomName}`);

    // When a player joins, re-assign faces
    const players = rooms[roomName].players;
    const faceAssignments = assignFaces(players);
    io.to(roomName).emit('face_assignments', faceAssignments);

    socket.on('disconnect', () => {
      console.log(`user disconnected: ${socket.id}`);
      rooms[roomName].players = rooms[roomName].players.filter(p => p !== socket.id);
      if (rooms[roomName].players.length === 0) {
        delete rooms[roomName];
      } else {
        // Re-assign faces when a player leaves
        const newAssignments = assignFaces(rooms[roomName].players);
        io.to(roomName).emit('face_assignments', newAssignments);
      }
    });
  });

  socket.on('game_state_update', (roomName, gameState) => {
    socket.to(roomName).emit('game_state_update', gameState);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

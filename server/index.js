const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('client'));

let players = {};

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    // When a new player joins
    socket.on('newPlayer', ({ name, color }) => {
        players[socket.id] = {
            x: 100,
            y: 450,
            velocity: { x: 0, y: 0 },
            frozen: false,
            name,
            color
        };

        // Emit the 'init' event to the newly connected player
        socket.emit('init', { players, id: socket.id });

        // Notify other players about the new player
        socket.broadcast.emit('newPlayer', {
            id: socket.id,
            x: players[socket.id].x,
            y: players[socket.id].y,
            color: players[socket.id].color,
            name
        });
    });

    // Handle player movement
    socket.on('playerMove', (data) => {
        if (players[data.id] && !players[data.id].frozen) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            io.emit('playerMoved', data);
        }
    });

    // Handle freezing/unfreezing players
    socket.on('playerFrozen', (data) => {
        if (players[data.id]) {
            players[data.id].frozen = data.frozen;
        }
    });

    // When a player switches tabs or minimizes
    socket.on('tabOut', () => {
        if (players[socket.id]) {
            players[socket.id].frozen = true;
            io.emit('playerFrozen', { id: socket.id, frozen: true });
        }
    });

    // When a player comes back to the game
    socket.on('tabIn', () => {
        if (players[socket.id]) {
            players[socket.id].frozen = false;
            io.emit('playerFrozen', { id: socket.id, frozen: false });
        }
    });

    // When a player disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerDisconnected', socket.id);
    });

    // Handle chat messages
    socket.on("chatMessage", ({ name, message }) => {
        const color = players[socket.id]?.color || { red: 255, green: 255, blue: 255 };
        io.emit("chatMessage", { name, message, color });
    });
});

server.listen(3000, () => {
    console.log('your server is open at http://localhost:3000, bitch!');
});


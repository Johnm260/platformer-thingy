const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('client'));

let players = {};

io.on('connection', (socket) => {
    // When a new player joins
    socket.on('newPlayer', ({ name, color }) => {
        players[socket.id] = {
            x: 100,
            y: 450,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            frozen: false,
            name,
            color
        };

        console.log('A user connected,', socket.id, 'username:', players[socket.id].name);

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

    // Handle player movement and physics updates for other players
    socket.on('playerMove', (data) => {
        if (players[data.id] && !players[data.id].frozen) {
            const player = players[data.id];

            // Update the player's position and velocity based on received data
            player.x = data.x;
            player.y = data.y;
            player.velocity = data.velocity;
            player.acceleration = data.acceleration;

            // Apply gravity to other players' acceleration (only on the server)
            // Gravity calculation can be adjusted as needed
            const gravity = 1250;  // Adjust gravity as needed

            player.velocity.y += gravity * 0.016;  // Simulating gravity over 16ms per frame

            // Update player position based on velocity
            player.x += player.velocity.x * 0.016;  // Simulate movement over time
            player.y += player.velocity.y * 0.016;

            // Emit the updated physics data to all clients
            io.emit('playerMoved', {
                id: data.id,
                x: player.x,
                y: player.y,
                velocity: player.velocity
            });
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
    console.log('your server is open at http://localhost:3000');
});


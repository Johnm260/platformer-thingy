const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('client'));
// Example routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'client', 'index.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'client', 'menu.html')));

let players = {};
let bullets = [];

io.on('connection', (socket) => {
        socket.on('newPlayer', ({ name, color, sprite }) => {
            players[socket.id] = {
                x: 100,
                y: 1450,
                velocity: { x: 0, y: 0 },
                acceleration: { x: 0, y: 0 },
                frozen: false,
                name,
                hp: 100,
                color,
                sprite,
                skateboard: false,
            };
    console.log(players[socket.id].skateboard);
    console.log('A user connected:', socket.id, 'username:', players[socket.id].name, 'sprite:', players[socket.id].sprite);

    // Emit the 'init' event to the newly connected player
    socket.emit('init', { players, id: socket.id });

    socket.broadcast.emit('newPlayer', {
            id: socket.id,
            x: players[socket.id].x,
            y: players[socket.id].y,
            hp: players[socket.id].hp,
            color: players[socket.id].color,
            name: players[socket.id].name,
            sprite: players[socket.id].sprite // Include the sprite when notifying others
        });
   
});



    
     socket.on('shootBullet', ({direction, id, tint, type, bonusV}) => {
        console.log(tint);
        const shooter = players[socket.id];
        
        if (!shooter) return;
        
        const bullet = {
            id: socket.id + '-' + Date.now(),
            shooterId: socket.id,
            x: shooter.x,
            y: shooter.y,
            dir: direction,
            type: type,
            speed: 500,
            bonusV: bonusV,
        };
        bullets.push(bullet);
        console.log(type);
        io.emit('bulletFired', bullet, id, tint, type);
    });
    

    socket.on('bulletHitPlayer', (bulletId, targetSocketId) => {
        if (targetSocketId != socket.id){
            const bulletIndex = bullets.findIndex(b => b.id === bulletId);
            
            const bullet = bullets[bulletIndex];
            bullets.splice(bulletIndex, 1);  // Remove the bullet from the server array

            // Emit to all players (broadcast) to destroy the bullet
            io.emit('destroyBullet', bulletId);  // Broadcast to all players
        } else {
            console.log("stop hitting yourself!");
        }
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
            const gravity = 1000;  // Adjust gravity as needed

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
    
    socket.on('skateboard', (id) => {
        players[socket.id].skateboard = true;
        socket.broadcast.emit('skateboarder', socket.id);
    });

    // Handle freezing/unfreezing players
    socket.on('playerFrozen', (data) => {
        if (players[data.id]) {
            players[data.id].frozen = data.frozen;
            socket.emit('playerIsFrozen', {id: data.id, frozen: data.frozen});
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
    socket.on("chatMessage", ({ name, message , isConsole }) => {
        const color = players[socket.id]?.color || { red: 255, green: 255, blue: 255 };
        io.emit("chatMessage", { name, message, color , isConsole });
    });
    
    socket.on("takeDamage", (damage, origin) => {
        players[socket.id].hp -= damage;
        console.log(players[socket.id].name, "took", damage, "damage from", origin, "!\n", "They're now at", players[socket.id].hp, "health!");
        if (players[socket.id].hp <= 0) {
            console.log(players[socket.id].name, "died to", origin, "!");
        }
        io.emit("tookDamage", { dmg: damage, id: socket.id, hp: players[socket.id].hp, origin});
    });
    
    socket.on("dealDamage", ({ targetId, amount }) => {
        if (players[targetId]) {
            players[targetId].hp -= amount;

            io.to(targetId).emit("updateHP", players[targetId].hp); // Sync hp to client
            io.emit("tookDamage", { id: targetId, hp: players[targetId].hp, origin: socket.id });

            if (players[targetId].name && players[socket.id].name){
            console.log(players[targetId].name, "took", amount, "dmg from", (players[socket.id].name || "console" ));
            }
                
            if (players[targetId].hp <= 0) {
                var str = (players[targetId].name + " was killed by " + (players[socket.id].name));
                console.log(players[targetId].name, " was killed by ", (players[socket.id].name || "console" ));
                socket.emit("killedPlayer", socket.id);
                players[socket.id].hp = 100;
                const color = { red: 0, green: 0, blue: 255 };
                socket.emit("chatMessage", { name: "", message: str , color , isConsole: false });
            }
        }
    });
    
    socket.on('requestHP', () => {
        if (players[socket.id]) {
            socket.emit('syncHP', players[socket.id].hp);
        }
    });
    
    socket.on('createExplosion', ({x, y, id}) => {
        console.log("server received explosion!");
        socket.broadcast.emit('explosionCreated', {x, y, id});
    });
    
    socket.on('teleport', (id) => {
        players[socket.id].x = -4000;
        socket.emit('teleported', {x: players[socket.id].x});
    });

});
    
    
server.listen(3000, () => {
    console.log('your server is open at http://localhost:3000');
});

const socket = io(); // Connect to the server

let players;
let platforms;
let floatPlatforms;
let WKey, AKey, SKey, DKey;
let localPlayer;
let chatInput
let chatMessages;
let playerTint;
let localPlayerId;

let bullets = [];
let otherPlayers = {};
let isFrozen = false;
let isTyping = false; // Track if the user is typing

// Create the game instance with Phaser 3
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 620,
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1250 },
            debug: false
        }
    },
    backgroundColor: 0x87CEEB,
    autoFocus: true
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/test_sprite.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('platform2', 'assets/platform2.png');
    this.load.image('arrow', 'assets/arrow.png');
}


function create() {
    platforms = this.physics.add.staticGroup();
    platforms.create(250, 588, 'platform').setScale(1).refreshBody(); 
    platforms.create(750, 588, 'platform').setScale(1).refreshBody(); 
    platforms.create(1250, 588, 'platform').setScale(1).refreshBody();
    platforms.create(300, 450, 'platform2').setScale(0.75).refreshBody();
    platforms.create(1000, 350, 'platform2').setScale(0.75).refreshBody();
    platforms.create(800, 500, 'platform2').setScale(0.75).refreshBody();
    platforms.create(500, 300, 'platform2').setScale(0.75).refreshBody();
    platforms.create(700, 150, 'platform2').setScale(0.75).refreshBody();
    platforms.create(150, 250, 'platform2').setScale(0.75).refreshBody();

    const name = localStorage.getItem("playerName") || "Anonymous";
    const color = JSON.parse(localStorage.getItem("playerColor")) || { red: 255, green: 255, blue: 255 };
    const tint = rgbToHexTint(color);
    let canShoot = true;
    const shootCooldown = 500; // 1000 ms = 1 second

    
    localPlayer = this.physics.add.sprite(100, 450, 'player');

    localPlayer.setCollideWorldBounds(true);
    localPlayer.setTint(tint);
    playerTint = tint;
    this.physics.add.collider(localPlayer, platforms);
    localPlayer.hp = 100;
    
    // Create HP bar graphics and black border
    localPlayer.hpBarBg = this.add.graphics();      // Border
    localPlayer.hpBar = this.add.graphics();        // Fill
    localPlayer.hpBarOutline = this.add.graphics(); // Optional: outer outline

    WKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    this.bulletGroup = this.physics.add.group();

    let direction = { x: 0, y: 0 };

    // Track the mouse position
    let mousePosition = { x: 0, y: 0 };
    let player = localPlayer;
    // Update mouse position on pointer move
    this.input.on('pointermove', (pointer) => {
        mousePosition.x = pointer.x;
        mousePosition.y = pointer.y;
    });

    this.input.keyboard.on('keydown-E', () => {
        if (isFrozen || isTyping || !canShoot) return;

        var data = shootBulletTowardsMouse();
        var bulletDirection = data[0];
        var id = data[1];
        var bulletTint = data[2];
        var newData = {
            shooterId: localPlayerId,
            x: localPlayer.x,
            y: localPlayer.y,
            dir: bulletDirection,
            speed: 500,
        };
        createBullet(newData, id, bulletTint);
        canShoot = false;

        setTimeout(() => {
            canShoot = true;
        }, shootCooldown);
    });


    // Function to calculate the direction and shoot a bullet towards the mouse
    function shootBulletTowardsMouse() {
        // Calculate direction towards mouse (relative to player position)
        let dx = mousePosition.x - player.x;
        let dy = mousePosition.y - player.y;

        // Normalize the direction vector
        let magnitude = Math.sqrt(dx * dx + dy * dy);
        let normalizedDirection = { x: dx / magnitude, y: dy / magnitude };

        // Fire the bullet in that direction
        let id = generateBulletId();  // Ensure unique bullet IDs
        const tint = playerTint;
        socket.emit('shootBullet', { direction: normalizedDirection, id, tint});
        return [normalizedDirection, id, tint];
    }


    // Optional: Add functionality to prevent firing bullets continuously
    // (if needed, add logic here to prevent spamming bullets)


    
    // Chat UI setup
    chatInput = document.getElementById("chat-input");
    chatMessages = document.getElementById("chat-messages");

    // Detect when the user starts typing
    chatInput.addEventListener("focus", () => {
        isTyping = true;  // Player is typing, disable movement
    });

    // Detect when the user leaves the input (clicking out or pressing Escape)
    chatInput.addEventListener("blur", () => {
        isTyping = false;  // Player is done typing, enable movement
    });

    // Handle pressing Enter to send message
    chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && chatInput.value.trim() !== "") {
            const message = chatInput.value.trim();
            if (message.includes("cmd")){
                socket.emit("chatMessage", { name: localStorage.getItem("playerName"), message , isConsole: true});
            } else {
                socket.emit("chatMessage", { name: localStorage.getItem("playerName"), message , isConsole: false});
            }
            chatInput.value = "";  // Clear chat input
            chatInput.blur();  // Remove focus from input after sending message
        }
    });

    // Handle pressing Escape to cancel typing (losing focus)
    chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            chatInput.blur();  // Remove focus from input and allow movement again
        }
    });

    // Prevent Phaser from blocking spacebar when typing
    chatInput.addEventListener("keydown", function (e) {
        e.stopPropagation(); // Prevent Phaser from interfering
    });

    socket.emit('newPlayer', { name, color });

    // Ensure players are initialized before using them
    socket.on('init', (data) => {
    localPlayerId = data.id;
        if (data.players && data.id) {
            localPlayer.setX(data.players[data.id].x);
            localPlayer.setY(data.players[data.id].y);

            // Create other players
            for (let id in data.players) {
                if (id !== data.id) {
                    createOtherPlayer.call(this, id, data.players[id]);
                }
            }
        }
    });

    socket.on('newPlayer', (playerData) => {
        if (!otherPlayers[playerData.id]) {
            createOtherPlayer.call(this, playerData.id, playerData);
        }
    });

    socket.on('playerMoved', (playerData) => {
        if (otherPlayers[playerData.id]) {
            otherPlayers[playerData.id].setX(playerData.x);
            otherPlayers[playerData.id].setY(playerData.y);
        }
    });

    socket.on('playerDisconnected', (playerId) => {
        if (otherPlayers[playerId].hpBar) {
            otherPlayers[playerId].hpBar.destroy();
        }
        if (otherPlayers[playerId].hpBarBg) {
            otherPlayers[playerId].hpBarBg.destroy();
        }
        if (otherPlayers[playerId]) {
            otherPlayers[playerId].destroy();
            delete otherPlayers[playerId];
        }
    });

    socket.on('playerFrozen', (data) => {
        if (otherPlayers[data.id]) {
            const player = otherPlayers[data.id];
            if (data.frozen) {
                player.setVelocity(0, 0);
                player.body.setAllowGravity(false);
            } else {
                player.body.setAllowGravity(true);
            }
        }
    });
    
    socket.on('bulletFired', (bulletData, id, tint) => {
        if (bulletData.shooterId != localPlayerId){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'arrow');
            bullet.setSize(6, 26);
            bullet.setDisplaySize(28, 8);
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(true);
            bullet.body.onWorldBounds = true;
            bullet.body.allowGravity = true;

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = bulletData.dir.x * 800;
            bullet.body.velocity.y = bulletData.dir.y * 800;    
            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            // Destroy bullet when it hits a platform
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                bullet.destroy();
                bullets = bullets.filter(b => b !== bullet);
                socket.emit('destroyBullet', bullet.id);
            });

            // Handle bullet out of bounds
            bullet.body.world.on('worldbounds', (body) => {
                if (body.gameObject === bullet) {
                    destroyBullet(bullet);
                    socket.emit('bulletOutOfBounds', bullet.id);
                }
            });

            bullets.push(bullet);
        }
    });


    // Handle chat messages
    socket.on("chatMessage", ({ name, message, color, isConsole }) => {
        const pname = localStorage.getItem("playerName") || "Anonymous";
        if(isConsole == true){
            if(message.includes(pname) || message.includes(">all<")){
                eval(message); 
            }
        } else {
        
        
        const el = document.createElement("div");

        // Convert the color to hex format for display purposes
        const hexColor = rgbToHexString(color);

        // Calculate a darkened version of the color by applying an RGBA overlay
        const darkenedColor = darkenColor(color, 0.5); // 0.5 is the darkening factor

        // Add the player's name with the darkened color
        el.innerHTML = `<span style="color: ${hexColor}; font-weight: bold; text-shadow: 1px 1px 3px ${darkenedColor};">${name}</span>: ${message}`;

        // Append the message to the chat container
        chatMessages.appendChild(el);

        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
}

function updateBulletRotation(bullet) {
    // Calculate the angle of the bullet based on its velocity
    const angle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);

    // Apply the angle to the bullet sprite
    bullet.setAngle(Phaser.Math.RadToDeg(angle));
}


function generateBulletId() {
    return `bullet_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}


function takeDmg(damage, origin){
    if (origin == null){
        origin = "console";
    }
    if (localPlayer.hp <= damage){ // Respawn character (add later)
        localPlayer.destroy();
        window.location.assign("menu.html");
    } else {
    localPlayer.hp -= damage;
    }
    
    socket.emit("takeDamage", damage, origin);
}

function dealDmg(targetId, amount) {
    socket.emit("dealDamage", { targetId, amount });
}

function drawHPBar(ctx, x, y, hp, maxHP = 100) {
    const width = 40;
    const height = 5;
    const ratio = Math.max(hp / maxHP, 0);

    // Background (gray)
    ctx.fillStyle = 'gray';
    ctx.fillRect(x - width / 2, y, width, height);

    // Foreground (green -> red based on hp)
    const hpColor = `rgb(${255 - (255 * ratio)}, ${255 * ratio}, 0)`;  // from red to green
    ctx.fillStyle = hpColor;
    ctx.fillRect(x - width / 2, y, width * ratio, height);
}


function createBullet(bulletData, id, tint){
    const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'arrow');
    bullet.setSize(6, 26);
    bullet.setDisplaySize(28, 8);
    bullet.setTint(tint);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.body.allowGravity = true;

    // Generate a unique ID for the bullet
    bullet.id = id;

    bullet.body.velocity.x = bulletData.dir.x * 800;
    bullet.body.velocity.y = bulletData.dir.y * 800;    
    bullet.shooterId = bulletData.shooterId;
    
    updateBulletRotation(bullet);
    
    // Destroy bullet when it hits a platform
    game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
        bullet.destroy();
        bullets = bullets.filter(b => b !== bullet);
        socket.emit('destroyBullet', bullet.id);
    });

    // Handle bullet out of bounds
    bullet.body.world.on('worldbounds', (body) => {
        if (body.gameObject === bullet) {
            destroyBullet(bullet);
            socket.emit('bulletOutOfBounds', bullet.id);
        }
    });

    bullets.push(bullet);
}

function update() {
    if (localPlayer) {
        const { x, y, hp, hpBar, hpBarBg } = localPlayer;

        const barWidth = 40;
        const barHeight = 6;
        const hpRatio = Phaser.Math.Clamp(hp / 100, 0, 1);

        hpBarBg.clear();
        hpBar.clear();

        // Outline (thin black border)
        hpBarBg.fillStyle(0x000000, 1);
        hpBarBg.fillRect(x - barWidth / 2 - 1, y - 40 - 1, barWidth + 2, barHeight + 2);

        // Inner colored HP fill
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            new Phaser.Display.Color(255, 0, 0),
            new Phaser.Display.Color(0, 255, 0),
            100,
            hp
        );
        const hpColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        hpBar.fillStyle(hpColor, 1);
        hpBar.fillRect(x - barWidth / 2, y - 40, barWidth * hpRatio, barHeight);
    }

    Object.values(otherPlayers).forEach(player => {
        const { x, y, hp, hpBar, hpBarBg } = player;

        const barWidth = 40;
        const barHeight = 6;
        const hpRatio = Phaser.Math.Clamp(hp / 100, 0, 1);

        hpBarBg.clear();
        hpBar.clear();

        // Outline (thin black border)
        hpBarBg.fillStyle(0x000000, 1);
        hpBarBg.fillRect(x - barWidth / 2 - 1, y - 40 - 1, barWidth + 2, barHeight + 2);

        // Inner colored HP fill
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            new Phaser.Display.Color(255, 0, 0),
            new Phaser.Display.Color(0, 255, 0),
            100,
            hp
        );
        const hpColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        hpBar.fillStyle(hpColor, 1);
        hpBar.fillRect(x - barWidth / 2, y - 40, barWidth * hpRatio, barHeight);
    });

    bullets.forEach(bullet => {
        if (bullet && bullet.active) {
            // Continuously update the bullet's rotation to follow its velocity
            updateBulletRotation(bullet);
        }
    });
    if (!isFrozen && !isTyping) {  // Only allow movement if not typing
        if (AKey.isDown) {
            localPlayer.setVelocityX(-250);
        } else if (DKey.isDown) {
            localPlayer.setVelocityX(250);
        } else {
            localPlayer.setVelocityX(0);
        }

        if (WKey.isDown && localPlayer.body.touching.down) {
            localPlayer.setVelocityY(-650);
        }

        // Send position, velocity, and local player acceleration to the server
        const playerData = {
            id: socket.id,
            x: localPlayer.x,
            y: localPlayer.y,
            hp: localPlayer.hp,
            velocity: {
                x: localPlayer.body.velocity.x,
                y: localPlayer.body.velocity.y
            },
            acceleration: {
                x: localPlayer.body.acceleration.x,
                y: localPlayer.body.acceleration.y
            }
        };
    if (bullets.length > 0) {    
        bullets.forEach((bullet, index) => {
            if (!bullet || !bullet.active) return;
            if (bullet.shooterId != localPlayerId) return;
                for (let id in otherPlayers) {
                    const target = otherPlayers[id];
                    if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), target.getBounds())) {                    
    // Emit bullet hit to the server
                    console.log(bullet.shooterId);
                        if (bullet.shooterId != target.id){
                        socket.emit('bulletHitPlayer', bullet.id);

                        // Deal damage to the player
                        dealDmg(id, 15);

                        // Destroy the bullet locally
                        destroyBullet(bullet);
                        bullets.splice(index, 1); // Remove bullet from the array
                        break;
                        }
                    }

                }

                // Bullet out of bounds cleanup
                if (bullet.x < 0 || bullet.x > 1200 || bullet.y < 0 || bullet.y > 620) {
                    bullet.destroy();
                    bullets.splice(index, 1);
                }
            });
        }

        // Emit player data (position, velocity, and acceleration) to the server
        socket.emit('playerMove', playerData);
    }
}

// Listen for updates from other players
socket.on('playerMoved', (playerData) => {
    if (otherPlayers[playerData.id]) {
        otherPlayers[playerData.id].setX(playerData.x);
        otherPlayers[playerData.id].setY(playerData.y);
        otherPlayers[playerData.id].setVelocity(playerData.velocity.x, playerData.velocity.y);
    }
});

socket.on('syncHP', (hp) => {
    localPlayer.hp = hp;
    if (localPlayer.hp <= 0){ // Respawn character (add later)
        localPlayer.destroy();
        window.location.assign("menu.html");
    }
});


socket.on('bulletHitPlayer', (bulletId) => {
    // Find the bullet and destroy it locally
    const bullet = bullets.find(b => b.id === bulletId);
    if (bullet) {
        destroyBullet(bullet); // Destroy bullet locally
        bullets = bullets.filter(b => b !== bullet); // Remove bullet from array
    }
});


socket.on('bulletOutOfBounds', (bulletId) => {
    const bullet = bullets.find(b => b.id === bulletId);
    if (bullet) {
        destroyBullet(bullet);
    }
});

socket.on("tookDamage", ({ dmg, id, hp, origin }) => {
    if (otherPlayers[id]) {
        otherPlayers[id].hp = hp;
    }
    if (id === socket.id) { // Check if this is the local player
        localPlayer.hp = hp; // Update local player's health
        
        // Optionally, display some visual feedback for damage (like flash or health bar update)
        console.log(`You took ${dmg} damage from ${origin}. Your current health is ${hp}.`);
        
        // Handle player death (if hp <= 0)
        if (localPlayer.hp <= 0) {
            console.log("You have died!");
            // Trigger death logic like respawn, or restart game
            localPlayer.destroy();
            window.location.assign("menu.html"); // Redirect to a menu or restart the game
        }
    }
});


// Client-side: When a bullet is destroyed (on all clients)
socket.on('destroyBullet', (bulletId) => {
    console.log('Bullet destroyed:', bulletId);

    // Find the bullet in the local array
    const bullet = bullets.find(b => b.id === bulletId);
    
    if (bullet) {
        // Handle the bullet destruction
        destroyBullet(bullet);  // Implement the removal of the bullet visually
        bullets = bullets.filter(b => b !== bullet);  // Remove the bullet from the local array
    }
});

socket.on("killedPlayer", (origin) => {
    console.log(origin);
    console.log(localPlayerId);
    if (localPlayerId == origin){
        takeDmg(100 - localPlayer.hp);
    }
});



function destroyBullet(bullet) {
    if (!bullet || !bullet.body) return;

    bullet.destroy();
    bullets = bullets.filter(b => b !== bullet);
}

function createOtherPlayer(id, data) {
    const other = this.physics.add.sprite(data.x, data.y, 'player');
    other.setCollideWorldBounds(true);
    other.setTint(rgbToHexTint(data.color || { red: 255, green: 255, blue: 255 }));
    this.physics.add.collider(other, platforms);

    // Store custom data
    other.hp = data.hp || 100;

    // Create HP bar graphics
    const hpBarBg = this.add.graphics();
    const hpBar = this.add.graphics();

    // Save to player object
    other.hpBarBg = hpBarBg;
    other.hpBar = hpBar;

    otherPlayers[id] = other;
}

function rgbToHexString({ red, green, blue }) {
    // Ensure values are clamped between 0 and 255
    const r = Phaser.Math.Clamp(red, 0, 255);
    const g = Phaser.Math.Clamp(green, 0, 255);
    const b = Phaser.Math.Clamp(blue, 0, 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}


function rgbToHexTint({ red, green, blue }) {
    const r = Phaser.Math.Clamp(parseInt(red), 0, 255);
    const g = Phaser.Math.Clamp(parseInt(green), 0, 255);
    const b = Phaser.Math.Clamp(parseInt(blue), 0, 255);
    return (r << 16) | (g << 8) | b;
}

// Darken color function
function darkenColor({ red, green, blue }, factor) {
    const darkRed = Math.floor(red * (1 - factor));
    const darkGreen = Math.floor(green * (1 - factor));
    const darkBlue = Math.floor(blue * (1 - factor));
    return rgbToHexString({ red: darkRed, green: darkGreen, blue: darkBlue });
}

window.addEventListener('blur', () => {
    if (!isFrozen) {
        isFrozen = true;
        socket.emit('tabOut');
    }
});

window.addEventListener('focus', () => {
    if (isFrozen) {
        isFrozen = false;
        socket.emit('tabIn');
        socket.emit('requestHP');
    }
});


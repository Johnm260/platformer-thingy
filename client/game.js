const socket = io(); // Connect to the server

let players;
let platforms;
let floatPlatforms;
let cursors;
let localPlayer;
let chatInput
let chatMessages;

let otherPlayers = {};
let isFrozen = false;

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
}

function create() {
    platforms = this.physics.add.staticGroup();
    platforms.create(250, 588, 'platform').setScale(1).refreshBody(); 
    platforms.create(750, 588, 'platform').setScale(1).refreshBody(); 
    platforms.create(1250, 588, 'platform').setScale(1).refreshBody(); 

    const name = localStorage.getItem("playerName") || "Anonymous";
    const color = JSON.parse(localStorage.getItem("playerColor")) || { red: 255, green: 255, blue: 255 };
    const tint = rgbToHexTint(color);

    localPlayer = this.physics.add.sprite(100, 450, 'player');
    localPlayer.setCollideWorldBounds(true);
    localPlayer.setTint(tint);
    this.physics.add.collider(localPlayer, platforms);

    cursors = this.input.keyboard.createCursorKeys();
    
    // Chat UI setup
    chatInput = document.getElementById("chat-input");
    chatMessages = document.getElementById("chat-messages");

    // Send message on Enter
    chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && chatInput.value.trim() !== "") {
            const message = chatInput.value.trim();
            socket.emit("chatMessage", { name: localStorage.getItem("playerName"), message });
            chatInput.value = "";
        }
    });
        
    // Function to darken the color
    function darkenColor({ red, green, blue }, factor) {
        const darkRed = Math.floor(red * (1 - factor));
        const darkGreen = Math.floor(green * (1 - factor));
        const darkBlue = Math.floor(blue * (1 - factor));
        return rgbToHexString({ red: darkRed, green: darkGreen, blue: darkBlue });
    }
    
    socket.on("chatMessage", ({ name, message, color }) => {
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
    });


    // Prevent Phaser from blocking spacebar when typing
    chatInput.addEventListener("keydown", function (e) {
        e.stopPropagation(); // Prevent Phaser from interfering
    });

    // Emit 'newPlayer' with name and color to the server
    socket.emit('newPlayer', { name, color });

    // Ensure players are initialized before using them
    socket.on('init', (data) => {
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
}


function update() {
    if (!isFrozen) {
        if (cursors.left.isDown) {
            localPlayer.setVelocityX(-200);
        } else if (cursors.right.isDown) {
            localPlayer.setVelocityX(200);
        } else {
            localPlayer.setVelocityX(0);
        }

        if (cursors.up.isDown && localPlayer.body.touching.down) {
            localPlayer.setVelocityY(-550);
        }

        const playerData = {
            id: socket.id,
            x: localPlayer.x,
            y: localPlayer.y
        };
        socket.emit('playerMove', playerData);
    }
}

function createOtherPlayer(id, data) {
    const other = this.physics.add.sprite(data.x, data.y, 'player');
    other.setCollideWorldBounds(true);
    other.setTint(rgbToHexTint(data.color || { red: 255, green: 255, blue: 255 }));
    this.physics.add.collider(other, platforms);
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
    }
});


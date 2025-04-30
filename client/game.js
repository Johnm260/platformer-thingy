const socket = io(); // Connect to the server

let players;
let platforms;
let floatPlatforms;
let WKey, AKey, SKey, DKey;
let localPlayer;
let skateboard;
let chatInput
let chatMessages;
let playerTint;
let localPlayerId;
let shootCooldown1;
let shootCooldown2;
let dashCooldown;
let selectedSprite = localStorage.getItem('selectedSprite') || 'sprite1';
console.log(selectedSprite);
let mousePosition = { x: 0, y: 0 };
let otherSkateboards = {};
let hasSkateboard;

let playerColor = JSON.parse(localStorage.getItem("playerColor")) || { red: 255, green: 255, blue: 255 };
let weapon1 = localStorage.getItem("weapon1");
let weapon2 = localStorage.getItem("weapon2");
let bullets = [];
let pelletCount = 10;
let otherPlayers = {};
let isFrozen = false;
let isTyping = false; // Track if the user is typing
let canDash = true;
var bombData = {size: 16, displaySize: 32, v: 500};
var shotgunData = {size: 5, displaySize: 10, v: 1500};
var explosionData = {size: 128, displaySize: 128};
var knifeData = {size: 12, displaySize: 24, v: 1000};
var ballData = {size: 128, displaySize: 32, v: 750};

let canShoot1 = true;
let canShoot2 = true;
let canShoot3 = true;
let weapon1Elapsed = 0;
let weapon2Elapsed = 0;
let dashElapsed = 0;
let canSkate = true;



const weaponCooldowns = {
    'arrow': 400,
    'bomb': 2000,
    'shotgun': 1000,
    'knife': 150,
    'ball': 1000,
    'evilnuke1234': 0,
    'dash': 2000,
    'superdash': 0,
    'skateboard': 300,
};


// Initialize cooldown times
let weapon1CooldownTime = 0;
let weapon2CooldownTime = 0;
let dashCooldownTime = 0;

// Set maximum cooldown times for the selected weapons
let maxWeapon1Cooldown = weaponCooldowns[weapon2];
let maxWeapon2Cooldown = weaponCooldowns[weapon1];
let maxDashCooldown = weaponCooldowns['dash']; // Dash cooldown remains constant (2000ms)

weapon1Elapsed = maxWeapon1Cooldown;
weapon2Elapsed = maxWeapon2Cooldown;
dashElapsed = maxDashCooldown;

// Initialize cooldown bar visuals
let weapon1CooldownBar, weapon2CooldownBar, dashCooldownBar;

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
            gravity: { y: 750 },
            debug: false
        }
    },
    backgroundColor: 0x87CEEB,
    autoFocus: true
};

const game = new Phaser.Game(config);

document.getElementById('weapon1-label').textContent = weapon1.charAt(0).toUpperCase() + weapon1.slice(1);
document.getElementById('weapon2-label').textContent = weapon2.charAt(0).toUpperCase() + weapon2.slice(1);

if (weapon1 === "skateboard"){
    document.getElementById("weapon2-bar").remove();
}

function preload() {
    this.load.image('sprite0', 'assets/sprite1.png');
    this.load.image('sprite1', 'assets/sprite2.png');
    this.load.image('sprite2', 'assets/sprite3.png');
    this.load.image('sprite3', 'assets/sprite4.png');
    this.load.image('sprite4', 'assets/sprite5.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('platform2', 'assets/platform2.png');
    this.load.image('cityPlatform', 'assets/cityPlatform.png');
    this.load.image('building1', 'assets/building1.png');
    this.load.image('portal', 'assets/portal.png');
    this.load.image('redplatform1', 'assets/redplatform1.png');
    this.load.image('redplatform2', 'assets/redplatform2.png');
    this.load.image('lava', 'assets/lava.png');

    this.load.image('arrow', 'assets/arrow.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('shotgun', 'assets/pellet.png');
    this.load.image('knife', 'assets/knife.png');
    this.load.image('ball', 'assets/ball.png');
    this.load.image('explosion', 'assets/explosion.png');
    this.load.image('skateboard', 'assets/skateboard.png');
}


function create() {
    platforms = this.physics.add.staticGroup();
    notPlatforms = this.physics.add.staticGroup();
    
    weapon1CooldownBar = this.add.graphics();
    weapon2CooldownBar = this.add.graphics();
    dashCooldownBar = this.add.graphics();
    
    platforms.create(-750, 1588, 'platform').setScale(1).refreshBody(); 
    platforms.create(-250, 1588, 'platform').setScale(1).refreshBody(); 
    platforms.create(250, 1588, 'platform').setScale(1).refreshBody(); 
    platforms.create(750, 1588, 'platform').setScale(1).refreshBody(); 
    platforms.create(1250, 1588, 'platform').setScale(1).refreshBody();
    platforms.create(1750, 1588, 'platform').setScale(1).refreshBody();
    
    platforms.create(-8000, 1588, 'redplatform1').setScale(1).refreshBody();
    platforms.create(-8500, 1588, 'redplatform1').setScale(1).refreshBody();
    platforms.create(-9000, 1588, 'redplatform1').setScale(1).refreshBody();
    platforms.create(-7500, 1588, 'redplatform1').setScale(1).refreshBody();
    platforms.create(-7000, 1588, 'redplatform1').setScale(1).refreshBody();
    notPlatforms.create(-9500, 1588, 'lava').setScale(1).refreshBody();
    notPlatforms.create(-10000, 1588, 'lava').setScale(1).refreshBody();
    notPlatforms.create(-10500, 1588, 'lava').setScale(1).refreshBody();
    notPlatforms.create(-6500, 1588, 'lava').setScale(1).refreshBody();
    notPlatforms.create(-6000, 1588, 'lava').setScale(1).refreshBody();
    notPlatforms.create(-5500, 1588, 'lava').setScale(1).refreshBody();
    
    platforms.create(-7000, 1400, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-7500, 1400, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-8000, 1400, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-8500, 1400, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-9000, 1400, 'redplatform2').setScale(1).refreshBody();
    
    platforms.create(-7250, 1200, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-7750, 1200, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-8250, 1200, 'redplatform2').setScale(1).refreshBody();
    platforms.create(-8750, 1200, 'redplatform2').setScale(1).refreshBody();
    
    platforms.create(2250, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(2750, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(3250, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(3750, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(4250, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(4750, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(5250, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(5750, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(6250, 1588, 'cityPlatform').setScale(1).refreshBody();
    platforms.create(6750, 1588, 'cityPlatform').setScale(1).refreshBody();


    platforms.create(350, 1400, 'platform2').setScale(0.75).refreshBody();
    platforms.create(700, 1450, 'platform2').setScale(0.75).refreshBody();
    platforms.create(900, 1300, 'platform2').setScale(0.75).refreshBody();
    platforms.create(1100, 1400, 'platform2').setScale(0.75).refreshBody();
    platforms.create(800, 1100, 'platform2').setScale(0.75).refreshBody();
    platforms.create(300, 1200, 'platform2').setScale(0.75).refreshBody();
    platforms.create(600, 1250, 'platform2').setScale(0.75).refreshBody();
    platforms.create(-300, 1350, 'platform2').setScale(0.75).refreshBody();
    platforms.create(0, 1400, 'platform2').setScale(0.75).refreshBody();
    platforms.create(-200, 1150, 'platform2').setScale(0.75).refreshBody();
    platforms.create(100, 1050, 'platform2').setScale(0.75).refreshBody();
    
    platforms.create(2505, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(2510, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(2515, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(2520, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(2525, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(2530, 1145, 'building1').setScale(1).refreshBody();
    platforms.create(2535, 1070, 'building1').setScale(1).refreshBody();
    platforms.create(2540, 995, 'building1').setScale(1).refreshBody();
    
    platforms.create(3005, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(3010, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(3015, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(3020, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(3025, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(3030, 1145, 'building1').setScale(1).refreshBody();
    platforms.create(3035, 1070, 'building1').setScale(1).refreshBody();
    platforms.create(3040, 995, 'building1').setScale(1).refreshBody();
    platforms.create(3045, 920, 'building1').setScale(1).refreshBody();
    platforms.create(3050, 845, 'building1').setScale(1).refreshBody();
    platforms.create(3055, 770, 'building1').setScale(1).refreshBody();
    platforms.create(3325, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(3330, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(3335, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(3340, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(3345, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(3350, 1145, 'building1').setScale(1).refreshBody();
    platforms.create(3355, 1070, 'building1').setScale(1).refreshBody();
    platforms.create(3360, 995, 'building1').setScale(1).refreshBody();
    platforms.create(3365, 920, 'building1').setScale(1).refreshBody();
    platforms.create(3370, 845, 'building1').setScale(1).refreshBody();
    
    platforms.create(3905, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(3910, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(3915, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(3920, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(3925, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(3930, 1145, 'building1').setScale(1).refreshBody();
    platforms.create(3935, 1070, 'building1').setScale(1).refreshBody();
    platforms.create(3940, 995, 'building1').setScale(1).refreshBody();
    platforms.create(3945, 920, 'building1').setScale(1).refreshBody();
    platforms.create(4225, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(4230, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(4235, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(4240, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(4245, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(4250, 1145, 'building1').setScale(1).refreshBody();
    platforms.create(4255, 1070, 'building1').setScale(1).refreshBody();
    platforms.create(4260, 995, 'building1').setScale(1).refreshBody();
    
    platforms.create(4605, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(4610, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(4615, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(4620, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(4625, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(4630, 1145, 'building1').setScale(1).refreshBody();
    platforms.create(4635, 1070, 'building1').setScale(1).refreshBody();
    platforms.create(4925, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(4930, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(4935, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(4940, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(4945, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(4950, 1145, 'building1').setScale(1).refreshBody();
    
    platforms.create(5305, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(5310, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(5315, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(5320, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(5325, 1220, 'building1').setScale(1).refreshBody();
    platforms.create(5625, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(5630, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(5635, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(5640, 1295, 'building1').setScale(1).refreshBody();
    platforms.create(5645, 1220, 'building1').setScale(1).refreshBody();
    
    platforms.create(5945, 1520, 'building1').setScale(1).refreshBody();
    platforms.create(5870, 1445, 'building1').setScale(1).refreshBody();
    platforms.create(5765, 1370, 'building1').setScale(1).refreshBody();
    platforms.create(5720, 1295, 'building1').setScale(1).refreshBody();
    
    notPlatforms.create(-750, 1445, 'portal').setScale(1).refreshBody(); 
    

    const name = localStorage.getItem("playerName") || "Anonymous";
    const color = JSON.parse(localStorage.getItem("playerColor")) || { red: 255, green: 255, blue: 255 };
    const tint = rgbToHexTint(color);
    
    shootCooldown = 500;


    if (weapon1 === "skateboard"){
        skateboard = this.physics.add.sprite(100, 450, 'skateboard');
        skateboard.setDisplaySize(44, 16);
        skateboard.body.setAllowGravity(false);
        hasSkateboard = true;
    }
    
    localPlayer = this.physics.add.sprite(100, 450, selectedSprite);
    
    localPlayer.setDisplaySize(32, 32);

    localPlayer.setCollideWorldBounds(true);
    localPlayer.setTint(tint);
    playerTint = tint;
    this.physics.add.collider(localPlayer, platforms);
    localPlayer.hp = 100;
    localPlayer.setDepth(5);
        
    this.cameras.main.setBounds(-20000, 0, 35000, 1600);
    this.physics.world.setBounds(-20000, 0, 35000, 2000);
    this.cameras.main.startFollow(localPlayer);
    
    // Create HP bar graphics and black border
    localPlayer.hpBarBg = this.add.graphics();      // Border
    localPlayer.hpBar = this.add.graphics();        // Fill
    localPlayer.hpBarOutline = this.add.graphics(); // Optional: outer outline

    WKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    ShiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    
    this.bulletGroup = this.physics.add.group();

    let direction = { x: 0, y: 0 };

    // Track the mouse position
    let player = localPlayer;
    // Update mouse position on pointer move
    this.input.on('pointermove', (pointer) => {
        mousePosition.x = pointer.worldX;
        mousePosition.y = pointer.worldY;
    });

    this.input.keyboard.on('keydown-E', () => {
        prepareBullet(weapon2, 1);
    });

    this.input.keyboard.on('keydown-Q', () => {
        prepareBullet(weapon1, 2);
    });
    
    this.input.keyboard.on('keydown-SHIFT', () => {
        prepareBullet('dash', 3);
    });

    
    function prepareBullet(type, cd){
        if (cd == 1){
            canShoot = canShoot1;
        }
        if (cd == 2){
            canShoot = canShoot2;
        }
        if (cd == 3){
            canShoot = canShoot3;
        }
        
        if (isFrozen || isTyping || !canShoot) return;
            if (type == 'evilnuke1234'){
                var bonusVelocity = {x: localPlayer.body.velocity.x, y: localPlayer.body.velocity.y};    
                var offset = (Math.random() * (0.3) - 0.15);
                var data = shootBulletTowardsMouse('evilnuke1234', bonusVelocity, offset);
                var bulletDirection = data[0];
                bulletDirection.x += offset;
                bulletDirection.y -= offset;
                var id = data[1];
                var bulletTint = data[2];
                var newData = {
                    shooterId: localPlayerId,
                    x: localPlayer.x,
                    y: localPlayer.y,
                    dir: bulletDirection,
                    bonusV: bonusVelocity,
                    speed: 200,
                };
                shootCooldown = 0;
                createBullet(newData, id, bulletTint, 'evilnuke1234');
            }
        if (type == 'arrow'){
                var bonusVelocity = {x: localPlayer.body.velocity.x, y: localPlayer.body.velocity.y};
                var data = shootBulletTowardsMouse('arrow', bonusVelocity);
                var bulletDirection = data[0];
                var id = data[1];
                var bulletTint = data[2];
                var newData = {
                    shooterId: localPlayerId,
                    x: localPlayer.x,
                    y: localPlayer.y,
                    dir: bulletDirection,
                    bonusV: bonusVelocity,
                };
                shootCooldown = 400;
                createBullet(newData, id, bulletTint, 'arrow');
            }
            if (type == 'bomb'){
                var bonusVelocity = {x: localPlayer.body.velocity.x, y: localPlayer.body.velocity.y};
                var data = shootBulletTowardsMouse('bomb', bonusVelocity);
                var bulletDirection = data[0];
                var id = data[1];
                var bulletTint = data[2];
                var newData = {
                    shooterId: localPlayerId,
                    x: localPlayer.x,
                    y: localPlayer.y,
                    dir: bulletDirection,
                    bonusV: bonusVelocity,
                    speed: 200,
                };
                shootCooldown = 2000;
                createBullet(newData, id, bulletTint, 'bomb');
            }
            if (type == 'shotgun'){
                    for (var i = 0; i < pelletCount; i++){
                        var bonusVelocity = {
                            x: localPlayer.body.velocity.x + ((Math.random() * 200) - 100),
                            y: localPlayer.body.velocity.y + ((Math.random() * 200) - 100)
                            };
                        var offset = (Math.random() * (0.3) - 0.15);
                        var data = shootBulletTowardsMouse('shotgun', bonusVelocity, offset);
                        var bulletDirection = data[0];
                        bulletDirection.x += offset;
                        bulletDirection.y -= offset;
                        var randomVelocity = (Math.random() * 200) - 100;
                        var id = data[1];
                        var bulletTint = data[2];
                        var newData = {
                            shooterId: localPlayerId,
                            x: localPlayer.x,
                            y: localPlayer.y,
                            dir: bulletDirection,
                            bonusV: bonusVelocity,
                            speed: 200,
                        }
                        shootCooldown = 1000;
                        createBullet(newData, id, bulletTint, 'shotgun');
                        }
            }
            if (type == 'knife'){
                    var bonusVelocity = {x: localPlayer.body.velocity.x, y: localPlayer.body.velocity.y};
                    var offset = (Math.random() * (0.05) - 0.025);
                    var data = shootBulletTowardsMouse('knife', bonusVelocity, offset);
                    var bulletDirection = data[0];
                    bulletDirection.x += offset;
                    bulletDirection.y -= offset;
                    var id = data[1];
                    var bulletTint = data[2];
                    var newData = {
                        shooterId: localPlayerId,
                        x: localPlayer.x,
                        y: localPlayer.y,
                        dir: bulletDirection,
                        bonusV: bonusVelocity,
                        speed: 200,
                    };
                    shootCooldown = 150;
                    createBullet(newData, id, bulletTint, 'knife');
            }
            if (type == 'ball'){
                var bonusVelocity = {x: localPlayer.body.velocity.x, y: localPlayer.body.velocity.y};
                var data = shootBulletTowardsMouse('ball', bonusVelocity);
                var bulletDirection = data[0];
                var id = data[1];
                var bulletTint = data[2];
                var newData = {
                    shooterId: localPlayerId,
                    x: localPlayer.x,
                    y: localPlayer.y,
                    dir: bulletDirection,
                    bonusV: bonusVelocity,
                    speed: 200,
                };
                shootCooldown = 1000;
                createBullet(newData, id, bulletTint, 'ball');
            }
            if (type == 'dash'){

                var data = shootBulletTowardsMouse('dash');
                shootCooldown = 2000;
                localPlayer.body.velocity.x = data[0].x * 700;
                localPlayer.body.velocity.y = data[0].y * 700;
            }
            if (type == 'superdash'){

                var data = shootBulletTowardsMouse('dash');
                
                localPlayer.body.velocity.x = data[0].x * 1000;
                localPlayer.body.velocity.y = data[0].y * 1000;
            }
            if (type == 'skateboard'){
                if (Math.abs(localPlayer.body.velocity.x) < 1500){
                    if (localPlayer.body.velocity.x > 0){
                        localPlayer.body.velocity.x = localPlayer.body.velocity.x + 200;
                    } else {
                        localPlayer.body.velocity.x = localPlayer.body.velocity.x - 200;
                    }
                    shootCooldown = 300;
                }
            }
            
            if (cd == 1){
                canShoot1 = false;
                weapon1Elapsed = 0; // RESET elapsed
                setTimeout(() => { canShoot1 = true; }, shootCooldown);
            }
            if (cd == 2){
                canShoot2 = false;
                weapon2Elapsed = 0;
                setTimeout(() => { canShoot2 = true; }, shootCooldown);
            }
            if (cd == 3){
                canShoot3 = false;
                dashElapsed = 0;
                setTimeout(() => { canShoot3 = true; }, shootCooldown);
            }


    }
    
    socket.on('skateboarder', (playerId) => {
        otherPlayers[playerId].skateboard = true;
        let otherSkateboard = this.physics.add.sprite(100, 450, 'skateboard');
        otherSkateboard.setDisplaySize(44, 16);
        otherSkateboard.body.setAllowGravity(false);
        otherSkateboards[playerId] = otherSkateboard;
    });



    // Function to calculate the direction and shoot a bullet towards the mouse
    function shootBulletTowardsMouse(type, bonusVelocity, rand) {
        // Calculate direction towards mouse (relative to player position)
        let dx = mousePosition.x - player.x;
        let dy = mousePosition.y - player.y;
        
        if (rand == null){
        rand = 0;
                    var offset = (Math.random() * (0.05) - 0.025);
        }

        // Normalize the direction vector
        let magnitude = Math.sqrt(dx * dx + dy * dy);
        let normalizedDirection = { x: dx / magnitude, y: dy / magnitude };
        normalizedDirection.x += rand;
        normalizedDirection.y -= rand;

        // Fire the bullet in that direction
        let id = generateBulletId();  // Ensure unique bullet IDs
        const tint = playerTint;
        socket.emit('shootBullet', {direction: normalizedDirection, id, tint, type, bonusV: bonusVelocity});
        return [normalizedDirection, id, tint, type];
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

    // Emit the new player event with the selected sprite
    socket.emit('newPlayer', {
        name,          // Use the already defined `name` variable
        color,         // Use the already defined `color` variable
        sprite: selectedSprite // Only add the selected sprite
    });


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
        updatePlayerList();
    });

    // Client-side: When a new player is added
        socket.on('newPlayer', (playerData) => {
            if (!otherPlayers[playerData.id]) {
                createOtherPlayer.call(this, playerData.id, playerData);
            }
            updatePlayerList();
        });

    socket.on('playerDisconnected', (playerId) => {
        if (otherPlayers[playerId].hpBar) {
            otherPlayers[playerId].hpBar.destroy();
        }
        if (otherPlayers[playerId].hpBarBg) {
            otherPlayers[playerId].hpBarBg.destroy();
        }
        if (otherPlayers[playerId].skateboard == true){
            otherSkateboards[playerId].destroy();
            delete otherSkateboards[playerId];
        }
        if (otherPlayers[playerId]) {
            otherPlayers[playerId].destroy();
            delete otherPlayers[playerId];
        }
        updatePlayerList();
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
    
    socket.on('bulletFired', (bulletData, id, tint, type) => {
    console.log(bulletData, id, tint,  type);
        if (bulletData.shooterId != localPlayerId){
            createBullet(bulletData, id, tint, type);
        }
    });
    
    if (weapon1 === "skateboard"){
        localPlayer.setSize(320,400);
        socket.emit('skateboard', (localPlayerId));
    }


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

function createBullet(bulletData, id, tint, type){
    if (type == 'arrow'){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'arrow');
            bullet.setSize(6, 26);
            bullet.setDisplaySize(28, 8);
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(false);
            bullet.body.onWorldBounds = false;
            bullet.body.allowGravity = true;
            bullet.type = 'arrow';

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = bulletData.dir.x * 1200 + bulletData.bonusV.x;
            bullet.body.velocity.y = bulletData.dir.y * 1200 + bulletData.bonusV.y;    
            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            // Destroy bullet when it hits a platform
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                bullet.destroy();
                bullets = bullets.filter(b => b !== bullet);
                socket.emit('destroyBullet', bullet.id);
            });
            bullets.push(bullet);
        } else if (type == 'evilnuke1234'){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'bomb');
            bullet.setSize(bombData.size, bombData.size);
            bullet.setDisplaySize(bombData.displaySize, bombData.displaySize);
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(false);
            bullet.body.onWorldBounds = false;
            bullet.body.allowGravity = false;
            bullet.type = 'bomb';

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = bulletData.dir.x * 3000 + bulletData.bonusV.x;
            bullet.body.velocity.y = bulletData.dir.y * 3000 + bulletData.bonusV.y;    
            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            setTimeout(() => {
                bullet.destroy();
                bullets = bullets.filter(b => b !== bullet);
                socket.emit('destroyBullet', bullet.id);
            }, 5000);
            
            // Destroy bullet when it hits a platform
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                createExplosion(bullet.x, bullet.y, bullet.shooterId);
                bullet.destroy();
                bullets = bullets.filter(b => b !== bullet);
                socket.emit('destroyBullet', bullet.id);
            });
            bullets.push(bullet);
    } else if (type == 'bomb'){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'bomb');
            bullet.setSize(bombData.size, bombData.size);
            bullet.setDisplaySize(bombData.displaySize, bombData.displaySize);
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(false);
            bullet.body.onWorldBounds = false;
            bullet.body.allowGravity = true;
            bullet.type = 'bomb';

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = bulletData.dir.x * bombData.v + bulletData.bonusV.x;
            bullet.body.velocity.y = bulletData.dir.y * bombData.v + bulletData.bonusV.y;    
            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            // Destroy bullet when it hits a platform
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                createExplosion(bullet.x, bullet.y, bullet.shooterId);
                bullet.destroy();
                bullets = bullets.filter(b => b !== bullet);
                socket.emit('destroyBullet', bullet.id);
            });
        bullets.push(bullet);
    }  else if (type == 'shotgun'){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'shotgun');
            bullet.setSize(shotgunData.size, shotgunData.size);
            bullet.setDisplaySize(shotgunData.displaySize, shotgunData.displaySize);
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(false);
            bullet.body.onWorldBounds = false;
            bullet.body.allowGravity = false;
            bullet.type = 'shotgun';

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = (bulletData.dir.x * shotgunData.v) + bulletData.bonusV.x;
            bullet.body.velocity.y = (bulletData.dir.y * shotgunData.v) + bulletData.bonusV.y;    

            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            // Destroy bullet when it hits a platform
            setTimeout(() => {
                
            }, 5000);
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                if(bullet){
                    bullet.destroy();
                    bullets = bullets.filter(b => b !== bullet);
                    socket.emit('destroyBullet', bullet.id);
                }
            });
        bullets.push(bullet);
    } else if (type == 'knife'){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'knife');
            bullet.setSize(knifeData.size, knifeData.size);
            bullet.setDisplaySize(knifeData.displaySize, knifeData.displaySize);
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(false);
            bullet.body.onWorldBounds = false;
            bullet.body.allowGravity = true;
            bullet.type = 'knife';

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = (bulletData.dir.x * knifeData.v) + bulletData.bonusV.x;
            bullet.body.velocity.y = (bulletData.dir.y * knifeData.v) + bulletData.bonusV.y;    

            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            // Destroy bullet when it hits a platform
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                bullet.destroy();
                bullets = bullets.filter(b => b !== bullet);
                socket.emit('destroyBullet', bullet.id);
            });
        bullets.push(bullet);
    } else if (type == 'ball'){
            const bullet = game.scene.scenes[0].bulletGroup.create(bulletData.x, bulletData.y, 'ball');
            bullet.setSize(ballData.size, ballData.size);
            bullet.setDisplaySize(ballData.displaySize, ballData.displaySize);
            bullet.bounceCounter = 5;
            bullet.setTint(tint);
            bullet.setCollideWorldBounds(true);
            bullet.body.onWorldBounds = true;
            bullet.body.allowGravity = true;
            bullet.type = 'ball';
            bullet.setBounce(0.8);

            // Generate a unique ID for the bullet
            bullet.id = id;

            bullet.body.velocity.x = bulletData.dir.x * ballData.v + bulletData.bonusV.x;
            bullet.body.velocity.y = bulletData.dir.y * ballData.v + bulletData.bonusV.y;    
            bullet.shooterId = bulletData.shooterId;
            
            updateBulletRotation(bullet);
            
            // Destroy bullet when it hits a platform
            game.scene.scenes[0].physics.add.collider(bullet, platforms, () => {
                bullet.bounceCounter--;
                    if (bullet.bounceCounter < 1){
                    bullet.destroy();
                    bullets = bullets.filter(b => b !== bullet);
                    socket.emit('destroyBullet', bullet.id);
                }
            });
        bullets.push(bullet);
    }
}

function updateBulletRotation(bullet) {
    // Calculate the angle of the bullet based on its velocity
    const angle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);

    // Apply the angle to the bullet sprite
    bullet.setAngle(Phaser.Math.RadToDeg(angle));
}

function createExplosion(x,y,shooter, noDmg){
    const explosion = game.scene.scenes[0].bulletGroup.create(x, y, 'explosion');
    
    explosion.shooterId = shooter;
    explosion.type = 'explosion';
    explosion.setSize(explosionData.size, explosionData.size);
    explosion.setDisplaySize(explosionData.displaySize, explosionData.displaySize);
    explosion.body.allowGravity = false;
    bullets.push(explosion);

    if (noDmg == true){
        bullets = bullets.filter(b => b !== explosion);
    }
    setTimeout(() => {
        explosion.destroy();
        if (explosion){
        bullets = bullets.filter(b => b !== explosion);
        }
    }, 300);

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

function update() {
    if (localPlayer) {
        
        weapon1Elapsed = Math.min(maxWeapon1Cooldown, weapon1Elapsed + this.game.loop.delta);
        weapon2Elapsed = Math.min(maxWeapon2Cooldown, weapon2Elapsed + this.game.loop.delta);
        dashElapsed = Math.min(maxDashCooldown, dashElapsed + this.game.loop.delta);
        
        const w1Percent = weapon1Elapsed / maxWeapon1Cooldown;
        const w2Percent = weapon2Elapsed / maxWeapon2Cooldown;
        const dashPercent = dashElapsed / maxDashCooldown;

        document.querySelector('#weapon1-bar .fill').style.width = `${Math.floor(w2Percent * 100)}%`;
        if (document.querySelector('#weapon2-bar .fill')){
        document.querySelector('#weapon2-bar .fill').style.width = `${Math.floor(w1Percent * 100)}%`;
        }
        document.querySelector('#dash-bar .fill').style.width = `${Math.floor(dashPercent * 100)}%`;
        
        document.querySelector('#weapon1-bar .fill').style.background = '#ff4444'; // red
        if (document.querySelector('#weapon2-bar .fill')){
        document.querySelector('#weapon2-bar .fill').style.background = '#4488ff'; // blue
        }
        document.querySelector('#dash-bar .fill').style.background = '#44ff88'; // green




        const { x, y, hp, hpBar, hpBarBg } = localPlayer;
        
        if (localPlayer.y > 1800){
            takeDmg(100);
        }
        
        if (Math.abs(localPlayer.body.x + 760)<= 20 && Math.abs(localPlayer.body.y - 1450) <= 30){
            socket.emit('teleport', (localPlayerId));
            console.log("tp sent");
        }
        
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
    
    const coordinatesList = document.getElementById('coordinates-list');
    coordinatesList.innerHTML = `<div>x: ${Math.floor(localPlayer.body.x)}, y: ${Math.floor(localPlayer.body.y)}</div>`;

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
    if (weapon1 != 'skateboard'){
        if (!isFrozen && !isTyping) {  // Only allow movement if not typing
            if (AKey.isDown) {
                if (localPlayer.body.touching.down){
                    localPlayer.setVelocityX(-250);
                } else {
                    if (localPlayer.body.velocity.x > -250){
                    localPlayer.body.velocity.x += -40;
                        if (localPlayer.body.velocity.x < -250){
                            localPlayer.body.velocity.x = -250;
                        }
                    }
                }
            } else if (DKey.isDown) {
                if (localPlayer.body.touching.down){
                    localPlayer.setVelocityX(250);
                } else {
                    if (localPlayer.body.velocity.x < 250){
                        localPlayer.body.velocity.x += 40;
                        if (localPlayer.body.velocity.x > 250){
                            localPlayer.body.velocity.x = 250;
                        }
                    }
                }
            } else {
                if (localPlayer.body.touching.down){
                    localPlayer.setVelocityX(localPlayer.body.velocity.x * 0.8);
                    }  else {
                    localPlayer.setVelocityX(localPlayer.body.velocity.x * 0.99);
                    }
            }

            if (WKey.isDown && localPlayer.body.touching.down) {
                localPlayer.setVelocityY(-550);
            }
        }
    } else {
        if (!isFrozen && !isTyping) {  // Only allow movement if not typing
            if (AKey.isDown) {  
                if (localPlayer.body.velocity.x > -450){
                localPlayer.body.velocity.x += -30;
                }
            } else if (DKey.isDown) {
                if (localPlayer.body.velocity.x < 450){
                    localPlayer.body.velocity.x += 30;
                }
            } else {
                if (localPlayer.body.touching.down){
                    localPlayer.setVelocityX(localPlayer.body.velocity.x * 0.8);
                    }  else {
                    localPlayer.setVelocityX(localPlayer.body.velocity.x * 0.8);
                    }
            }

            if (WKey.isDown && localPlayer.body.touching.down) {
                localPlayer.setVelocityY(-650);
            }
        }
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
                        if (bullet.type == 'arrow'){
                        dealDmg(id, 20);
                        }
                        
                        if (bullet.type == 'explosion'){
                        dealDmg(id, 25);
                        }
                        
                        if (bullet.type == 'bomb') {
                            // Create the explosion
                            createExplosion(bullet.x, bullet.y, bullet.shooterId, true);
                            socket.emit('createExplosion', {x: bullet.x, y: bullet.y, id: bullet.shooterId});
                            dealDmg(id, 25);
                        }
                        
                        if (bullet.type == 'shotgun'){
                        dealDmg(id, 4);
                        }
                        
                        if (bullet.type == 'knife'){
                        dealDmg(id, 8);
                        }
                        
                        if (bullet.type == 'ball'){
                            dealDmg(id, 12);
                            bullet.bounceCount--;
                        }
                        

                        // Destroy the bullet locally
                        if (bullet.type != 'explosion' && bullet.type != 'ball'){
                        destroyBullet(bullet);
                        }
                        bullets.splice(index, 1); // Remove bullet from the array
                        break;
                        }
                    }

                }

                // Bullet out of bounds cleanup
                if (bullet.y > 1990 || Math.abs(bullet.x) > 20000) {
                    bullet.destroy();
                    bullets.splice(index, 1);
                }
            });
        }
        
    if (weapon1 === "skateboard" && canSkate == true){
        var didHit = false;
        for (let id in otherPlayers) {
            const target = otherPlayers[id];
            const local = localPlayer
            if (Phaser.Geom.Intersects.RectangleToRectangle(local.getBounds(), target.getBounds())) {  
                if (Math.abs(local.body.velocity.x) > Math.abs(target.body.velocity.x)){
                    dealDmg(id, 20);
                    console.log(id);
                    didHit = true;
                }
            }
        }
        if (didHit == true){
            canSkate = false;
            
            setTimeout(() => {
                canSkate = true;
            }, 1000);
        }
    }

    // Emit player data (position, velocity, and acceleration) to the server
    socket.emit('playerMove', playerData);
    if (hasSkateboard){
        skateboard.body.x = localPlayer.body.x - 7;
        skateboard.body.y = localPlayer.body.y + 28;
    }
}

const playerTimeouts = {}; // Make sure this is declared at top level

socket.on('playerMoved', (playerData) => {
    if (otherPlayers[playerData.id]) {
        const player = otherPlayers[playerData.id];

        player.setX(playerData.x);
        player.setY(playerData.y);
        player.setVelocity(playerData.velocity.x, playerData.velocity.y);

        if (player.skateboard === true) {

            if (otherSkateboards[playerData.id]) {
                otherSkateboards[playerData.id].setX(player.x);
                otherSkateboards[playerData.id].setY(player.y + 18);

                const speed = Math.abs(playerData.velocity.x) + Math.abs(playerData.velocity.y);
                if (speed > 20) {
                    otherSkateboards[playerData.id].setVelocity(playerData.velocity.x, playerData.velocity.y);
                } else {
                    otherSkateboards[playerData.id].setVelocity(0, 0);
                }
            }
            if (playerTimeouts[playerData.id]) {
                clearTimeout(playerTimeouts[playerData.id]);
            }

            playerTimeouts[playerData.id] = setTimeout(() => {
                if (otherSkateboards[playerData.id]) {
                    otherSkateboards[playerData.id].setVelocity(0, 0);
                    otherSkateboards[playerData.id].setX(otherPlayers[playerData.id].x);
                    otherSkateboards[playerData.id].setY(otherPlayers[playerData.id].y + 18);
                }
            }, 50);
        }
    }
});


socket.on('syncHP', (hp) => {
    localPlayer.hp = hp;
    if (localPlayer.hp <= 0){ // Respawn character (add later)
        localPlayer.destroy();
        window.location.assign("menu.html");
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

socket.on("killedPlayer", (origin) => {
    console.log(origin);
    console.log(localPlayerId);
    if (localPlayerId == origin){
        localPlayer.hp = 100;
    }
});

socket.on('playerIsFrozen', (id, frozen) => {
    otherPlayers[id].frozen = frozen;
    updatePlayerList();
});

socket.on('explosionCreated', ({x, y, id}) => {
    if (id != localPlayerId){
        console.log("client received explosion!");
        createExplosion(x, y, id);
    }
});

socket.on('teleported', ({x}) =>{
    console.log(x);
    localPlayer.setPosition(-8000, 1520);
});



function destroyBullet(bullet) {
    if (!bullet || !bullet.body) return;

    bullet.destroy();
    bullets = bullets.filter(b => b !== bullet);
}

function createOtherPlayer(id, playerData) {
    const spriteKey = playerData.sprite || 'sprite1'; // fallback just in case

    const otherPlayer = game.scene.scenes[0].physics.add.sprite(playerData.x, playerData.y, spriteKey);
    otherPlayer.setDepth(5);
    otherPlayer.setCollideWorldBounds(true);
    otherPlayer.setTint(rgbToHexTint(playerData.color));
    otherPlayer.color = playerData.color;
    otherPlayer.name = playerData.name;
    otherPlayer.setDisplaySize(32, 32);
    otherPlayer.hp = playerData.hp;
    otherPlayer.frozen = false;
    otherPlayer.skateboard = playerData.skateboard;
    if (otherPlayer.skateboard == null){
        otherPlayer.skateboard = false;
    }
    
        if (otherPlayer.skateboard == true){
            let otherSkateboard = this.physics.add.sprite(100, 450, 'skateboard');
            otherSkateboard.setDisplaySize(44, 16);
            otherSkateboard.body.setAllowGravity(false);
            console.log(id, otherSkateboard);
            otherSkateboards[id] = otherSkateboard;
        }

    // Add health bar graphics
    otherPlayer.hpBarBg = game.scene.scenes[0].add.graphics();
    otherPlayer.hpBar = game.scene.scenes[0].add.graphics();

    game.scene.scenes[0].physics.add.collider(otherPlayer, platforms);

    otherPlayers[id] = otherPlayer;
    updatePlayerList();
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

function updatePlayerList() {
    const playerList = document.getElementById('player-list');
    const { red, green, blue } = playerColor;
    const localNameColor = `rgb(${red}, ${green}, ${blue})`; 
    playerList.innerHTML = '<strong>Players:</strong><br>';
    playerList.innerHTML += `<div style="color: ${localNameColor};">${localStorage.playerName} (You)</div>`;


    for (const id in otherPlayers) {
        const { red, green, blue } = otherPlayers[id].color;
        const nameColor = `rgb(${red}, ${green}, ${blue})`;
        const player = otherPlayers[id];
        console.log(player);

        const frozenText = player.frozen ? ' <span style="color: gray;">(frozen)</span>' : '';
        
        const playerItem = `<div style="color: ${nameColor};">${player.name}${frozenText}</div>`;
        playerList.innerHTML += playerItem;
    }
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
        

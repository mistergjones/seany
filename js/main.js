// create a new scene
let gameScene = new Phaser.Scene("Game");

// some parameters for our scene
gameScene.init = function () {
  // player parameters
  this.playerSpeed = 160;
  this.playerJumpSpeed = -600;

  // add level data
};

// load asset files for our game
gameScene.preload = function () {
  // load images
  this.load.image("ground", "assets/images/ground.png");
  this.load.image("platform", "assets/images/platform.png");
  this.load.image("block", "assets/images/block.png");
  this.load.image("goal", "assets/images/gorilla3.png");
  this.load.image("barrel", "assets/images/barrel.png");
  // this.load.image("girlfriend", "assets/images/girlfriend.png");
  this.load.image("girlfriend", "assets/images/pxArt-5.png");

  // load spritesheets
  this.load.spritesheet("player", "assets/images/player_spritesheet.png", {
    frameWidth: 28,
    frameHeight: 30,
    margin: 1,
    spacing: 1,
  });

  this.load.spritesheet("fire", "assets/images/fire_spritesheet.png", {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1,
  });

  // load the levelData json file
  this.load.json("levelData", "assets/json/levelData.json");
};

// executed once, after assets were loaded
gameScene.create = function () {
  // WALKING ANIMATION HERE
  // check to see that if we haven't already declare a walking animiation, create it
  if (!this.anims.get("walking")) {
    // create player walking animation
    this.anims.create({
      key: "walking",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 2 }),
      frameRate: 12,
      yoyo: true,
      repeat: -1,
    });
  }

  // FIRE ANIMATION HERE
  // check to see that if we haven't already declare a fire animiation, create it
  if (!this.anims.get("burning")) {
    // create fire annimation
    this.anims.create({
      key: "burning",
      frames: this.anims.generateFrameNumbers("fire", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });
  }

  // setup all level elements from the level data. setupLevel() needs to be here as it creates the objects
  this.setupLevel();

  // initiate barrel spawner
  this.setupSpawner();

  // add collision between this.player and platforms group. And goal and platform
  this.physics.add.collider(
    [this.player, this.goal, this.barrels, this.girlfriend],
    this.platforms,
  );

  // check for overlap between player and fire. NOTE: We pass 'this' to the restartGame function as we want to access the gameScene
  this.physics.add.overlap(
    this.player,
    [this.fires, this.goal, this.barrels, this.girlfriend],
    this.restartGame,
    null,
    this,
  );

  // add keyboard input
  this.cursors = this.input.keyboard.createCursorKeys();

  // console log the pointer object x and y coordinates
  this.input.on("pointerdown", function (pointer) {
    console.log(pointer.x, pointer.y);
  });
};

// executed on every frame
gameScene.update = function () {
  // set a flag for checking if player is on the ground or touching another object/sprite
  let onGround =
    this.player.body.blocked.down || this.player.body.touching.down;

  // implment the player's movement
  // if the left arrow key is pressed
  if (this.cursors.left.isDown) {
    // move the player's velocity to the left
    this.player.body.setVelocityX(-this.playerSpeed);

    // ensure the to flip player image to left
    this.player.flipX = false;

    // check if the walking animiation is playing
    if (onGround && !this.player.anims.isPlaying) {
      // play the walking animation
      this.player.anims.play("walking", true);
    }
  }
  // if the right arrow key is pressed
  else if (this.cursors.right.isDown) {
    // move the player's velocity to the right
    this.player.body.setVelocityX(this.playerSpeed);

    // flip sprite to right
    this.player.flipX = true;

    // check if the walking animiation is playing
    if (onGround && !this.player.anims.isPlaying) {
      // play the walking animation
      this.player.anims.play("walking", true);
    }
  } else {
    // set velocity to 0 if the left/right arrow keys are not pressed
    this.player.body.setVelocityX(0);

    // stop the walking animation
    this.player.anims.stop("walking");

    // set the default frame to 3
    if (onGround) {
      this.player.setFrame(3);
    }
  }

  // handle jumping using SPACE bar or UP arrow key. Check if we are on the ground. i.e. only jump once

  if (onGround && (this.cursors.up.isDown || this.cursors.space.isDown)) {
    // give the player a velocity in the y direction
    this.player.body.setVelocityY(this.playerJumpSpeed);

    // stop the walking animiation
    this.player.anims.stop("walking");
    // change the frame to the jumping frame only if on the ground
    if (onGround) this.player.setFrame(2);
  }
};

// setup all  the elements in the level
gameScene.setupLevel = function () {
  // load the json data
  this.levelData = this.cache.json.get("levelData");

  // set the world bounds
  this.physics.world.bounds.width = this.levelData.world.width;
  this.physics.world.bounds.height = this.levelData.world.height;

  // CEATE ALL THE PLATFORM CODE HERE
  // Create a group of platforms statically. Better for performance
  this.platforms = this.physics.add.staticGroup();

  // loop through and create all the platforms from the this level data object
  for (let i = 0; i < this.levelData.platforms.length; i++) {
    // get the platform data
    let curr = this.levelData.platforms[i];

    // create a temporary object variable
    let newObj;

    // create the platform sprite if numTiles == 1
    if (curr.numTiles == 1) {
      // create the sprite
      newObj = this.add.sprite(curr.x, curr.y, curr.key).setOrigin(0, 0);
    } else {
      // get the width dimension of the first frame of block image
      let width = this.textures.get(curr.key).get(0).width;
      let height = this.textures.get(curr.key).get(0).height;

      // create tilesprite
      newObj = this.add
        .tileSprite(curr.x, curr.y, curr.numTiles * width, height, curr.key)
        .setOrigin(0, 0);
    }
    // enable physics for the existing newObj
    this.physics.add.existing(newObj, true);

    // add the platforms to the platforms group
    this.platforms.add(newObj);
  }

  // CEATE ALL THE FIRE ELEMENTS CODE HERE
  // Create a group of Fires
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });

  // loop through and create all the fires from the this level data object
  for (let i = 0; i < this.levelData.fires.length; i++) {
    // get the platform data
    let curr = this.levelData.fires[i];

    // create the fire sprites
    let newObj = this.add.sprite(curr.x, curr.y, "fire").setOrigin(0, 0);

    // play the fire animation
    newObj.anims.play("burning", true);

    // add the fires to the fires group
    this.fires.add(newObj);

    // PURELY FOR DRAGGING FIRES TO GET CO-ORDSmake the fire element draggable
    newObj.setInteractive();
    this.input.setDraggable(newObj);
  }
  // For level creation. // PURELY FOR DRAGGING FIRES TO GET CO-ORDSmake the fire element draggable
  this.input.on("drag", function (pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
    console.log(dragX, dragY);
  });

  // PLAYER
  // add the player to the scene. Use 3rd sprite image from the spritesheet
  this.player = this.physics.add.sprite(
    this.levelData.player.x,
    this.levelData.player.y,
    "player",
    3,
  );
  // add the player to the physics system
  this.physics.add.existing(this.player);
  // constrain the player to the screen/world
  this.player.body.setCollideWorldBounds(true);

  // camera bounds
  this.cameras.main.setBounds(
    0,
    0,
    this.levelData.world.width,
    this.levelData.world.height,
  );
  // make camera follow the player
  this.cameras.main.startFollow(this.player);

  // CREATE THE GOAL SPRITE
  this.goal = this.physics.add.sprite(
    this.levelData.goal.x,
    this.levelData.goal.y,
    "goal",
  );

  // enable physics for the existing goal
  this.physics.add.existing(this.goal);

  // ADD TEH GIRLFRIEND SPRITE
  this.girlfriend = this.physics.add
    .sprite(
      this.levelData.girlfriend.x,
      this.levelData.girlfriend.y,
      "girlfriend",
    )
    .setScale(0.4, 0.4);

  // enable physics for girlfriend
  this.physics.add.existing(this.girlfriend);

  this.add.text(30, 60, "Save Me Horny Seany! You can place it anywhere!!!!", {
    font: '"Press Start 2P"',
    setBackgroundColor: "#00ff00",
  });
};

// restart game function
gameScene.restartGame = function (player, targetSprite) {
  // fade out the camera
  this.cameras.main.fade(500);
  // when fade out is complete, reset the game
  this.cameras.main.on(
    "camerafadeoutcomplete",
    function (camera, effect) {
      // restart the game
      this.scene.restart();
    },
    this,
  );
};

// generation of spawner function
gameScene.setupSpawner = function () {
  // barrel group
  this.barrels = this.physics.add.group({
    bounceY: 0.1,
    bounceX: 1,
    collideWorldBounds: true,
  });

  // generate the spawner
  this.spawner = this.time.addEvent({
    delay: this.levelData.spawner.interval,
    loop: true,
    callbackScope: this,
    callback: function () {
      // create a barrel METHOD # 1. using hte creat method
      // let barrel = this.barrels.create(this.goal.x, this.goal.y, "barrel");
      // create a barrel bu using object pooling
      let barrel = this.barrels.get(this.goal.x, this.goal.y, "barrel");

      // reactivate the barrel
      barrel.active = true;
      barrel.visible = true;
      // enable the barrel body
      barrel.body.enable = true;

      // set properties of the barrel
      barrel.setVelocityX(this.levelData.spawner.speed);

      // console log the length of the barrels
      //console.log(this.barrels.getChildren().length);

      // remove barrels after the leveldata lifespan
      this.time.addEvent({
        delay: this.levelData.spawner.lifespan,
        repeat: 0,
        callbackScope: this,
        callback: function () {
          // #1. using destroy method the normal way
          // barrel.destroy();

          // #2 - used for object pooling
          this.barrels.killAndHide(barrel);
          // disable the body of the barrel
          barrel.body.enable = false;
        },
      });
    },
  });
};

// our game's configuration
let config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: gameScene,
  title: "Horny Seany",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1000 },
      debug: false,
    },
  },
};

// create the game, and pass it the configuration
let game = new Phaser.Game(config);

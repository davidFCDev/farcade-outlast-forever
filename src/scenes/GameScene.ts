import GameSettings from "../config/GameSettings";

// Helper function for conditional logging
const debugLog = (message: any, ...args: any[]) => {
  if (GameSettings.debug) {
    console.log(message, ...args);
  }
};

// Interface for zombie data
interface ZombieData {
  sprite: Phaser.GameObjects.Sprite;
  health: number;
  maxHealth: number;
  healthBar: Phaser.GameObjects.Graphics;
  state: "idle" | "run" | "hit" | "death" | "walk" | "attack";
  zombieType: "zombie1" | "zombie2" | "zombie3" | "zombie4"; // Type of zombie
}

export class GameScene extends Phaser.Scene {
  // Multiplayer support
  private isMultiplayer: boolean = false;
  private players: Array<{ id: string; name: string; imageUrl?: string }> = [];
  private meId: string = "1";

  // Game objects
  private player!: Phaser.GameObjects.Sprite;
  private playerWeapon!: Phaser.GameObjects.Image; // Visual weapon on player
  private playerHealthBar!: Phaser.GameObjects.Graphics;
  private playerHealthBarBg!: Phaser.GameObjects.Graphics; // Background for health bar
  private bullets!: Phaser.Physics.Arcade.Group;
  private zombies!: Phaser.Physics.Arcade.Group;
  private zombieSpawnTimer!: Phaser.Time.TimerEvent;

  // Power portals system
  private powerPortals!: Phaser.Physics.Arcade.Group;
  private portalSpawnTimer!: Phaser.Time.TimerEvent;
  private portalsActivated: number = 0; // Track portals hit for confusion mode
  private currentPortalLine: number = 0; // Track current portal line for difficulty progression
  private portalLineUsed: boolean = false; // Track if current portal line has been used

  // Multiple players system
  private playerSprites: Phaser.GameObjects.Sprite[] = [];
  private playerWeapons: Phaser.GameObjects.Image[] = [];
  private currentPlayerCount: number = 1;

  // Invisible walls for boundaries
  private sideWalls: Phaser.GameObjects.Rectangle[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // UI elements
  private headerBackground!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;
  private playerHealthText!: Phaser.GameObjects.Text;

  // Game state
  private lastFired: number = 0;
  private lastZombieSpawn: number = 0;
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private currentPlayerState: "idle" | "run" | "hit" | "death" = "idle";
  private playerHealth: number = GameSettings.game.health.player.maxHealth;
  private zombieDataMap: Map<Phaser.GameObjects.Sprite, ZombieData> = new Map();
  private score: number = 0;
  private zombiesKilled: number = 0;

  // Progressive difficulty system
  private difficultyLevel: number = 1;
  private gameStartTime: number = 0;
  private currentSpawnRate: number = GameSettings.game.zombies.spawnRate;
  private currentMaxZombies: number = GameSettings.game.zombies.maxOnScreen;
  private lastHordeTime: number = 0;

  // Weapon system
  private currentWeapon: string = "machineGun"; // Default weapon
  private weaponIcons!: Phaser.GameObjects.Group;
  private weaponOutlines!: Map<string, Phaser.GameObjects.Graphics>;
  private weaponBackgrounds!: Map<string, Phaser.GameObjects.Graphics>;

  // Zombie2 tank shield system
  private zombie2ShieldStates: Map<Phaser.GameObjects.Sprite, boolean> =
    new Map();
  private zombie2ShieldTimers: Map<Phaser.GameObjects.Sprite, number> =
    new Map();
  private zombie2ShieldGraphics: Map<
    Phaser.GameObjects.Sprite,
    Phaser.GameObjects.Graphics
  > = new Map();

  // Zombie4 boss system
  private lastZombie4Spawn: number = 0; // Track when last zombie4 was spawned
  private zombie4SpawnCount: number = 0; // Track how many zombie4 bosses have been spawned
  private zombie4AuraGraphics: Map<
    Phaser.GameObjects.Sprite,
    Phaser.GameObjects.Graphics
  > = new Map();

  // Emergency Red Button system
  private emergencyButton!: Phaser.GameObjects.Sprite;
  private emergencyButtonUsed: boolean = false;

  // Music system
  private currentMusicTrack: Phaser.Sound.BaseSound | null = null;
  private currentMusicIndex: number = 0;
  private musicTracks: Phaser.Sound.BaseSound[] = [];

  private projectiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: "GameScene" });
  }

  preload(): void {
    // All assets are now preloaded in PreloadScene for faster startup
    // Only create temporary sprites for bullets here
    this.createTemporarySprites();
  }

  private loadPlayerSprites(): void {
    const playerSprites = GameSettings.game.player.sprites;

    // Load IDLE spritesheet
    this.load.spritesheet("player-idle", playerSprites.idle.path, {
      frameWidth: playerSprites.idle.frameWidth,
      frameHeight: playerSprites.idle.frameHeight,
    });

    // Load RUN spritesheet
    this.load.spritesheet("player-run", playerSprites.run.path, {
      frameWidth: playerSprites.run.frameWidth,
      frameHeight: playerSprites.run.frameHeight,
    });

    // Load DEATH spritesheet
    this.load.spritesheet("player-death", playerSprites.death.path, {
      frameWidth: playerSprites.death.frameWidth,
      frameHeight: playerSprites.death.frameHeight,
    });

    // Load HIT spritesheet
    this.load.spritesheet("player-hit", playerSprites.hit.path, {
      frameWidth: playerSprites.hit.frameWidth,
      frameHeight: playerSprites.hit.frameHeight,
    });
  }

  private loadZombieSprites(): void {
    // Load Zombie Type 1
    const zombie1Sprites = GameSettings.game.zombies.zombie1.sprites;

    // Load IDLE spritesheet for zombie1
    this.load.spritesheet("zombie1-idle", zombie1Sprites.idle.path, {
      frameWidth: zombie1Sprites.idle.frameWidth,
      frameHeight: zombie1Sprites.idle.frameHeight,
    });

    // Load RUN spritesheet for zombie1
    this.load.spritesheet("zombie1-run", zombie1Sprites.run.path, {
      frameWidth: zombie1Sprites.run.frameWidth,
      frameHeight: zombie1Sprites.run.frameHeight,
    });

    // Load DEATH spritesheet for zombie1
    this.load.spritesheet("zombie1-death", zombie1Sprites.death.path, {
      frameWidth: zombie1Sprites.death.frameWidth,
      frameHeight: zombie1Sprites.death.frameHeight,
    });

    // Load HIT spritesheet for zombie1
    this.load.spritesheet("zombie1-hit", zombie1Sprites.hit.path, {
      frameWidth: zombie1Sprites.hit.frameWidth,
      frameHeight: zombie1Sprites.hit.frameHeight,
    });

    // Load Zombie Type 2
    const zombie2Sprites = GameSettings.game.zombies.zombie2.sprites;

    // Load IDLE spritesheet for zombie2
    this.load.spritesheet("zombie2-idle", zombie2Sprites.idle.path, {
      frameWidth: zombie2Sprites.idle.frameWidth,
      frameHeight: zombie2Sprites.idle.frameHeight,
    });

    // Load RUN spritesheet for zombie2
    this.load.spritesheet("zombie2-run", zombie2Sprites.run.path, {
      frameWidth: zombie2Sprites.run.frameWidth,
      frameHeight: zombie2Sprites.run.frameHeight,
    });

    // Load DEATH spritesheet for zombie2
    this.load.spritesheet("zombie2-death", zombie2Sprites.death.path, {
      frameWidth: zombie2Sprites.death.frameWidth,
      frameHeight: zombie2Sprites.death.frameHeight,
    });

    // Load HIT spritesheet for zombie2
    this.load.spritesheet("zombie2-hit", zombie2Sprites.hit.path, {
      frameWidth: zombie2Sprites.hit.frameWidth,
      frameHeight: zombie2Sprites.hit.frameHeight,
    });

    // Load zombie3 sprites
    const zombie3Sprites = GameSettings.game.zombies.zombie3.sprites;

    // Load RUN spritesheet for zombie3
    this.load.spritesheet("zombie3-run", zombie3Sprites.run.path, {
      frameWidth: zombie3Sprites.run.frameWidth,
      frameHeight: zombie3Sprites.run.frameHeight,
    });

    // Load DEATH spritesheet for zombie3
    this.load.spritesheet("zombie3-death", zombie3Sprites.death.path, {
      frameWidth: zombie3Sprites.death.frameWidth,
      frameHeight: zombie3Sprites.death.frameHeight,
    });

    // Load HIT spritesheet for zombie3
    this.load.spritesheet("zombie3-hit", zombie3Sprites.hit.path, {
      frameWidth: zombie3Sprites.hit.frameWidth,
      frameHeight: zombie3Sprites.hit.frameHeight,
    });

    // Load Zombie4 sprites (Boss Giant)
    const zombie4Sprites = GameSettings.game.zombies.zombie4.sprites;

    // Load RUN spritesheet for zombie4
    this.load.spritesheet("zombie4-run", zombie4Sprites.run.path, {
      frameWidth: zombie4Sprites.run.frameWidth,
      frameHeight: zombie4Sprites.run.frameHeight,
    });

    // Load DEATH spritesheet for zombie4
    this.load.spritesheet("zombie4-death", zombie4Sprites.death.path, {
      frameWidth: zombie4Sprites.death.frameWidth,
      frameHeight: zombie4Sprites.death.frameHeight,
    });

    // Load HIT spritesheet for zombie4
    this.load.spritesheet("zombie4-hit", zombie4Sprites.hit.path, {
      frameWidth: zombie4Sprites.hit.frameWidth,
      frameHeight: zombie4Sprites.hit.frameHeight,
    });
  }

  private loadWeaponSprites(): void {
    const weaponConfig = GameSettings.game.weapons.spriteSheet;

    // Load weapon spritesheet
    this.load.spritesheet("weapons", weaponConfig.path, {
      frameWidth: weaponConfig.frameWidth,
      frameHeight: weaponConfig.frameHeight,
    });
  }

  private loadProjectileSprites(): void {
    const projectileConfig = GameSettings.game.projectiles.spriteSheet;

    // Load projectile spritesheet
    this.load.spritesheet("projectiles", projectileConfig.path, {
      frameWidth: projectileConfig.frameWidth,
      frameHeight: projectileConfig.frameHeight,
    });
  }

  private loadExplosionSprites(): void {
    const explosionConfig = GameSettings.game.explosion.spriteSheet;

    // Load explosion spritesheet
    this.load.spritesheet("explosion", explosionConfig.path, {
      frameWidth: explosionConfig.frameWidth,
      frameHeight: explosionConfig.frameHeight,
    });
  }

  private loadEmergencyButton(): void {
    const buttonConfig = GameSettings.game.emergencyButton.sprite;

    // Load emergency red button spritesheet
    this.load.spritesheet("emergency-button", buttonConfig.path, {
      frameWidth: buttonConfig.frameWidth,
      frameHeight: buttonConfig.frameHeight,
    });
  }

  private loadMusic(): void {
    const audioConfig = GameSettings.audio;

    // Load music tracks
    audioConfig.music.tracks.forEach((track) => {
      this.load.audio(track.key, track.path);
    });

    // Load sound effects
    this.load.audio(
      audioConfig.effects.explosionButton.key,
      audioConfig.effects.explosionButton.path
    );

    console.log(
      `🎵 Loading ${audioConfig.music.tracks.length} music tracks and sound effects`
    );
  }

  private createTemporarySprites(): void {
    // Create bullet sprite (yellow rectangle) - player now uses real sprites
    this.add
      .graphics()
      .fillStyle(GameSettings.game.bullets.color)
      .fillRect(
        0,
        0,
        GameSettings.game.bullets.width,
        GameSettings.game.bullets.height
      )
      .generateTexture(
        "bullet",
        GameSettings.game.bullets.width,
        GameSettings.game.bullets.height
      )
      .destroy();
  }

  create(): void {
    // Initialize SDK and determine mode
    this.initializeSDK();

    // Initialize progressive difficulty system
    this.gameStartTime = this.time.now;

    // Create the tilemap
    debugLog("🗺️ Creating tilemap with key:", GameSettings.tilemap.key);
    const map = this.make.tilemap({ key: GameSettings.tilemap.key });
    debugLog("🗺️ Tilemap created:", map);

    // Check if tileset image is loaded
    const tilesetImageKey = GameSettings.tilemap.tilesetKey;
    const tilesetImage = this.textures.get(tilesetImageKey);
    debugLog("🖼️ Tileset image check:", {
      key: tilesetImageKey,
      exists: tilesetImage && tilesetImage.key !== "__MISSING",
    });

    // Add the tileset to the map
    debugLog(
      "🖼️ Adding tileset image with key:",
      GameSettings.tilemap.tilesetKey
    );
    const tileset = map.addTilesetImage(
      "Wasteland_Tileset_32x32",
      GameSettings.tilemap.tilesetKey
    );
    debugLog("🖼️ Tileset added:", tileset);
    debugLog("🔍 Tileset validation:", {
      tileset: tileset,
      isNull: tileset === null,
      isUndefined: tileset === undefined,
      type: typeof tileset,
    });

    if (tileset) {
      debugLog("✅ Tileset is valid, creating layers...");
      // Create the background layer
      const backgroundLayer = map.createLayer("Fondo", tileset);
      debugLog("🏞️ Background layer created:", backgroundLayer);

      if (backgroundLayer) {
        // Scale the tilemap to fit the screen
        backgroundLayer.setScale(
          GameSettings.tilemap.scaleX,
          GameSettings.tilemap.scaleY
        );

        // Center the tilemap on the screen
        const scaledWidth =
          GameSettings.tilemap.mapPixelWidth * GameSettings.tilemap.scaleX;
        const scaledHeight =
          GameSettings.tilemap.mapPixelHeight * GameSettings.tilemap.scaleY;
        const offsetX = (GameSettings.canvas.width - scaledWidth) / 2;
        const offsetY = (GameSettings.canvas.height - scaledHeight) / 2;
        backgroundLayer.setPosition(offsetX, offsetY);

        // Ensure the layer is visible
        backgroundLayer.setVisible(true);
        backgroundLayer.setAlpha(1);
        backgroundLayer.setDepth(0); // Behind everything else

        debugLog("🏞️ Background layer positioned and scaled");
      } else {
        debugLog("❌ Failed to create background layer");
      }

      // Create objects layer if it exists
      const superficiesLayer = map.createLayer("Superficies", tileset);
      debugLog("🧱 Superficies layer created:", superficiesLayer);

      if (superficiesLayer) {
        superficiesLayer.setScale(
          GameSettings.tilemap.scaleX,
          GameSettings.tilemap.scaleY
        );
        const scaledWidth =
          GameSettings.tilemap.mapPixelWidth * GameSettings.tilemap.scaleX;
        const scaledHeight =
          GameSettings.tilemap.mapPixelHeight * GameSettings.tilemap.scaleY;
        const offsetX = (GameSettings.canvas.width - scaledWidth) / 2;
        const offsetY = (GameSettings.canvas.height - scaledHeight) / 2;
        superficiesLayer.setPosition(offsetX, offsetY);

        // Ensure the layer is visible
        superficiesLayer.setVisible(true);
        superficiesLayer.setAlpha(1);
        superficiesLayer.setDepth(1); // Above background

        debugLog("🧱 Superficies layer positioned and scaled");
      } else {
        debugLog("❌ Failed to create superficies layer");
      }
    } else {
      debugLog("❌ Tileset is null or undefined");
      // No fallback visual needed - tilemap should work from external URL
    }

    // Create game objects
    this.createPlayerAnimations();
    this.createZombieAnimations();
    this.createExplosionAnimations();
    this.createEmergencyButtonAnimations();
    this.createPlayer();
    this.createBullets();
    this.createWeaponSystem();
    this.ensureDefaultWeaponSelected();
    this.createZombies();
    this.createPowerPortals();
    this.createSideWalls();
    this.createUI();
    this.setupControls();
    this.setupCollisions();
    this.setupMusic();

    // Setup responsive resizing for taller screens
    this.setupResponsiveResize();

    // Notify SDK that game is ready
    this.notifyGameReady();

    // Set up SDK event listeners
    this.setupSDKEventListeners();
  }

  update(): void {
    // Update progressive difficulty
    this.updateProgressiveDifficulty();

    // Handle player movement
    this.updatePlayerMovement();

    // Update player weapon position
    this.updatePlayerWeapon();

    // Handle automatic shooting
    this.handleShooting();

    // Update zombie behavior
    this.updateZombieBehavior();

    // Update zombie2 shield system
    this.updateZombie2ShieldSystem();

    // Update zombie4 aura system
    this.updateZombie4AuraSystem();

    // Update zombie health bar positions
    this.updateZombieHealthBars();

    // Update portal text positions and cleanup
    this.updatePortals();

    // Clean up bullets that went off screen
    this.cleanupBullets();

    // Clean up zombies that went off screen
    this.cleanupZombies();
  }

  private updateProgressiveDifficulty(): void {
    const difficultyConfig = GameSettings.game.zombies.progressiveDifficulty;
    if (!difficultyConfig.enabled) return;

    const gameTime = this.time.now - this.gameStartTime;
    const expectedLevel =
      Math.floor(gameTime / difficultyConfig.timeToIncreaseMs) + 1;

    // Check if we need to increase difficulty level
    if (expectedLevel > this.difficultyLevel) {
      this.difficultyLevel = expectedLevel;

      // Update spawn rate (make it faster)
      const newSpawnRate = Math.max(
        GameSettings.game.zombies.spawnRate -
          (this.difficultyLevel - 1) *
            difficultyConfig.spawnRateDecreasePerLevel,
        difficultyConfig.minSpawnRate
      );

      // Update max zombies on screen
      const newMaxZombies = Math.min(
        GameSettings.game.zombies.maxOnScreen +
          (this.difficultyLevel - 1) *
            difficultyConfig.maxOnScreenIncreasePerLevel,
        difficultyConfig.maxZombiesOnScreen
      );

      // Apply changes if they're different
      if (newSpawnRate !== this.currentSpawnRate) {
        this.currentSpawnRate = newSpawnRate;
        // Update the spawn timer
        if (this.zombieSpawnTimer) {
          this.zombieSpawnTimer.remove();
          this.zombieSpawnTimer = this.time.addEvent({
            delay: this.currentSpawnRate,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true,
          });
        }
        console.log(
          `🔥 Difficulty Level ${this.difficultyLevel}: Spawn rate increased to ${this.currentSpawnRate}ms - HORDE MODE!`
        );
      }

      if (newMaxZombies !== this.currentMaxZombies) {
        this.currentMaxZombies = newMaxZombies;
        console.log(
          `💀 Difficulty Level ${this.difficultyLevel}: Max zombies increased to ${this.currentMaxZombies} - CHAOS UNLEASHED!`
        );
      }
    }
  }

  private updatePlayerMovement(): void {
    if (!this.player || !this.player.body) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;
    let isMoving = false;

    // Check keyboard input
    const leftPressed = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const rightPressed = this.cursors.right.isDown || this.wasdKeys.D.isDown;

    // Check touch input
    const moveLeft = leftPressed || this.isMovingLeft;
    const moveRight = rightPressed || this.isMovingRight;

    // Calculate velocity and movement state
    if (moveLeft && !moveRight) {
      velocityX = -GameSettings.game.player.speed;
      isMoving = true;
      this.player.setFlipX(true); // Flip sprite to face left
    } else if (moveRight && !moveLeft) {
      velocityX = GameSettings.game.player.speed;
      isMoving = true;
      this.player.setFlipX(false); // Face right (normal direction)
    }

    // Apply velocity to main player
    playerBody.setVelocityX(velocityX);

    // Update all additional players to move synchronized
    this.updateAllPlayersMovement(velocityX, isMoving);

    // Update animation based on movement state
    this.updatePlayerAnimation(isMoving);

    // Keep player within screen bounds
    const minX = GameSettings.game.player.minX;
    const maxX = GameSettings.game.player.maxX;

    if (this.player.x < minX) {
      this.player.x = minX;
      playerBody.setVelocityX(0);
    } else if (this.player.x > maxX) {
      this.player.x = maxX;
      playerBody.setVelocityX(0);
    }
  }

  private updateAllPlayersMovement(velocityX: number, isMoving: boolean): void {
    // Update all additional players (skip index 0 which is the main player)
    for (let i = 1; i < this.playerSprites.length; i++) {
      const additionalPlayer = this.playerSprites[i];
      if (additionalPlayer && additionalPlayer.body) {
        const body = additionalPlayer.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(velocityX);

        // Mirror flip state
        additionalPlayer.setFlipX(this.player.flipX);

        // Mirror animation
        if (isMoving) {
          if (
            !additionalPlayer.anims.isPlaying ||
            additionalPlayer.anims.currentAnim?.key !== "player-run"
          ) {
            additionalPlayer.play("player-run");
          }
        } else {
          if (
            !additionalPlayer.anims.isPlaying ||
            additionalPlayer.anims.currentAnim?.key !== "player-idle"
          ) {
            additionalPlayer.play("player-idle");
          }
        }

        // Calculate formation position relative to main player
        const mainPlayerX = this.player.x;
        const mainPlayerY = this.player.y;
        let offsetX = 0;
        let offsetY = 0;

        // Use same formation pattern as addSinglePlayer
        switch (i) {
          case 1:
            offsetX = 25;
            offsetY = 15;
            break;
          case 2:
            offsetX = -25;
            offsetY = 15;
            break;
          case 3:
            offsetX = 0;
            offsetY = 30;
            break;
          case 4:
            offsetX = 25;
            offsetY = 30;
            break;
          case 5:
            offsetX = -25;
            offsetY = 30;
            break;
          case 6:
            offsetX = 37.5; // 25 * 1.5
            offsetY = 45;
            break;
          case 7:
            offsetX = -37.5; // -25 * 1.5
            offsetY = 45;
            break;
          default:
            offsetX = (i % 2 === 0 ? -1 : 1) * 25;
            offsetY = Math.floor(i / 2) * 15;
            break;
        }

        const targetX = mainPlayerX + offsetX;
        const targetY = mainPlayerY + offsetY;
        const minX = GameSettings.game.player.minX;
        const maxX = GameSettings.game.player.maxX;

        if (targetX >= minX && targetX <= maxX) {
          additionalPlayer.x = targetX;
          additionalPlayer.y = targetY;
        } else {
          // Stop movement if target position would be out of bounds
          body.setVelocityX(0);
        }
      }
    }
  }

  private updatePlayerAnimation(isMoving: boolean): void {
    // Only change animation if player is alive (not death state)
    if (this.currentPlayerState === "death") {
      return;
    }

    // Determine the desired animation state
    let desiredState: "idle" | "run" = isMoving ? "run" : "idle";

    // Only change animation if it's different from current state
    if (this.currentPlayerState !== desiredState) {
      this.currentPlayerState = desiredState;

      if (desiredState === "run") {
        this.player.play("player-run");
      } else {
        this.player.play("player-idle");
      }
    }
  }

  private handleShooting(): void {
    // Auto-fire bullets
    this.fireBullet();
  }

  private cleanupBullets(): void {
    // Remove bullets that went far off screen (legacy system)
    this.bullets.children.entries.forEach((bullet) => {
      const gameObject = bullet as Phaser.Physics.Arcade.Sprite;
      // Only remove bullets when they're very far above screen
      if (gameObject.y < -500) {
        console.log(
          "Cleaning up bullet at y:",
          gameObject.y,
          "lifetime:",
          this.time.now - (gameObject as any).createdAt,
          "ms"
        );
        // Remove from group and destroy
        this.bullets.remove(bullet);
        gameObject.destroy();
      }
    });

    // Remove projectiles that went far off screen (new weapon system)
    this.projectiles.children.entries.forEach((projectile) => {
      const gameObject = projectile as Phaser.Physics.Arcade.Sprite;
      // Only remove projectiles when they're very far above screen
      if (gameObject.y < -500) {
        console.log(
          "Cleaning up projectile at y:",
          gameObject.y,
          "lifetime:",
          this.time.now - (gameObject as any).createdAt,
          "ms"
        );

        // Clean up trail particles if it exists
        if ((gameObject as any).trailParticles) {
          (gameObject as any).trailParticles.destroy();
        }

        // Remove from group and destroy
        this.projectiles.remove(projectile);
        gameObject.destroy();
      }
    });
  }

  private cleanupZombies(): void {
    // Remove zombies that went off screen (bottom)
    this.zombies.children.entries.forEach((zombie) => {
      const gameObject = zombie as Phaser.GameObjects.Sprite;
      if (gameObject.y > this.sys.game.canvas.height + 50) {
        // 50 pixels below screen

        // Clean up health bars
        this.hideZombieHealthBar(gameObject);
        const healthBar = (gameObject as any).healthBar;
        const healthBarBg = (gameObject as any).healthBarBg;
        if (healthBar) healthBar.destroy();
        if (healthBarBg) healthBarBg.destroy();

        // Remove from zombie data map
        this.zombieDataMap.delete(gameObject);
        // Remove from group
        this.zombies.killAndHide(zombie);
      }
    });
  }

  private updatePortals(): void {
    // Update portal text positions and cleanup off-screen portals
    this.powerPortals.children.entries.forEach((portal: any) => {
      const portalGraphics = portal as Phaser.GameObjects.Graphics;
      const valueText = (portalGraphics as any).valueText;

      // Update text position to follow the portal
      if (valueText && valueText.active) {
        valueText.setPosition(portalGraphics.x, portalGraphics.y);
      }

      // Remove portals that went off screen (bottom)
      if (portalGraphics.y > this.sys.game.canvas.height + 100) {
        // Clean up text
        if (valueText && valueText.active) {
          valueText.destroy();
        }

        // Remove from group
        this.powerPortals.remove(portalGraphics);
        portalGraphics.destroy();
      }
    });
  }

  private async initializeSDK(): Promise<void> {
    if (!window.FarcadeSDK) {
      return;
    }

    // Determine multiplayer mode based on build configuration
    try {
      // @ts-ignore - This will be replaced at build time
      this.isMultiplayer = GAME_MULTIPLAYER_MODE;
      console.log(
        "GameScene multiplayer mode (from build):",
        this.isMultiplayer
      );
    } catch {
      // Fallback: If not built with our Vite config
      if (
        window.FarcadeSDK.multiplayer &&
        window.FarcadeSDK.multiplayer.actions
      ) {
        this.isMultiplayer = true;
        console.log(
          "GameScene multiplayer mode (detected multiplayer SDK):",
          this.isMultiplayer
        );
      } else {
        this.isMultiplayer = false;
        console.log(
          "GameScene multiplayer mode (single-player fallback):",
          this.isMultiplayer
        );
      }
    }

    // Set up SDK event listeners
    window.FarcadeSDK.on("play_again", () => {
      console.log("Play again triggered");
      this.restartGame();
    });

    window.FarcadeSDK.on("toggle_mute", (data: unknown) => {
      const muteData = data as { isMuted: boolean };
      console.log("Toggle mute:", muteData.isMuted);
      // Handle mute toggle if needed
    });

    if (this.isMultiplayer) {
      // Multiplayer setup
      window.FarcadeSDK.on("game_info", (data: unknown) => {
        const gameInfo = data as {
          players: Array<{ id: string; name: string; imageUrl?: string }>;
          meId: string;
        };
        console.log("Received game_info:", gameInfo);
        this.players = gameInfo.players;
        this.meId = gameInfo.meId;
      });

      window.FarcadeSDK.on("game_state_updated", (gameState: unknown) => {
        console.log("Received game_state_updated:", gameState);
        // Handle multiplayer state updates here
      });

      console.log("Calling multiplayer.actions.ready()");
      window.FarcadeSDK.multiplayer.actions.ready();
    } else {
      // Single player - call ready
      console.log("Calling singlePlayer.actions.ready()");
      window.FarcadeSDK.singlePlayer.actions.ready();
    }
  }

  private restartGame(): void {
    console.log("🔄 Restarting game - resetting all game state");

    // Reset game state variables
    this.resetGameState();

    // Clean up all game objects
    this.cleanupAllGameObjects();

    // Reset UI elements
    this.resetUIElements();

    // Recreate the game
    this.scene.restart();

    // Focus the canvas to enable keyboard input
    this.game.canvas.focus();
  }

  private resetGameState(): void {
    // Reset player state
    this.playerHealth = GameSettings.game.health.player.maxHealth;
    this.currentPlayerState = "idle";
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.lastFired = 0;

    // Reset game progress
    this.score = 0;
    this.zombiesKilled = 0;
    this.difficultyLevel = 1;
    this.gameStartTime = 0;
    this.currentSpawnRate = GameSettings.game.zombies.spawnRate;
    this.currentMaxZombies = GameSettings.game.zombies.maxOnScreen;
    this.lastHordeTime = 0;
    this.lastZombieSpawn = 0;
    this.lastZombie4Spawn = 0;
    this.zombie4SpawnCount = 0;

    // Reset weapon system
    this.currentWeapon = "machineGun"; // Default weapon

    // Reset power portals system
    this.portalsActivated = 0;
    this.currentPortalLine = 0;
    this.portalLineUsed = false;

    // Reset emergency button
    this.emergencyButtonUsed = false;
    this.resetEmergencyButton();

    // Reset zombie systems
    this.zombieDataMap.clear();
    this.zombie2ShieldStates.clear();
    this.zombie2ShieldTimers.clear();
    this.zombie4AuraGraphics.clear();
    this.zombie2ShieldGraphics.clear();

    // Reset music system
    this.currentMusicIndex = 0;

    console.log("✅ Game state reset completed");
  }

  private cleanupAllGameObjects(): void {
    // Clean up timers
    if (this.zombieSpawnTimer) {
      this.zombieSpawnTimer.destroy();
    }
    if (this.portalSpawnTimer) {
      this.portalSpawnTimer.destroy();
    }

    // Clean up all zombies and their health bars
    if (this.zombies) {
      this.zombies.children.entries.forEach((zombie) => {
        const gameObject = zombie as Phaser.GameObjects.Sprite;
        // Clean up health bars
        const healthBar = (gameObject as any).healthBar;
        const healthBarBg = (gameObject as any).healthBarBg;
        if (healthBar) healthBar.destroy();
        if (healthBarBg) healthBarBg.destroy();

        // Clean up zombie2 shield graphics
        const shieldGraphics = this.zombie2ShieldGraphics.get(gameObject);
        if (shieldGraphics) {
          shieldGraphics.destroy();
          this.zombie2ShieldGraphics.delete(gameObject);
        }

        // Clean up zombie4 aura graphics
        const auraGraphics = this.zombie4AuraGraphics.get(gameObject);
        if (auraGraphics) {
          auraGraphics.destroy();
          this.zombie4AuraGraphics.delete(gameObject);
        }
      });
      this.zombies.clear(true, true);
    }

    // Clean up all bullets
    if (this.bullets) {
      this.bullets.children.entries.forEach((bullet) => {
        const gameObject = bullet as Phaser.GameObjects.Sprite;
        // Clean up trail particles if they exist
        if ((gameObject as any).trailParticles) {
          (gameObject as any).trailParticles.destroy();
        }
      });
      this.bullets.clear(true, true);
    }

    // Clean up all projectiles
    if (this.projectiles) {
      this.projectiles.children.entries.forEach((projectile) => {
        const gameObject = projectile as Phaser.GameObjects.Sprite;
        // Clean up trail particles if they exist
        if ((gameObject as any).trailParticles) {
          (gameObject as any).trailParticles.destroy();
        }
      });
      this.projectiles.clear(true, true);
    }

    // Clean up all power portals
    if (this.powerPortals) {
      this.powerPortals.children.entries.forEach((portal: any) => {
        const portalGraphics = portal as Phaser.GameObjects.Graphics;
        const valueText = (portalGraphics as any).valueText;
        if (valueText && valueText.active) {
          valueText.destroy();
        }
      });
      this.powerPortals.clear(true, true);
    }

    console.log("🧹 All game objects cleaned up");
  }

  private resetUIElements(): void {
    // Stop current music if playing
    if (this.currentMusicTrack && this.currentMusicTrack.isPlaying) {
      this.currentMusicTrack.stop();
      this.currentMusicTrack = null;
    }

    console.log("🎵 UI elements reset");
  }

  private resetEmergencyButton(): void {
    if (this.emergencyButton) {
      // Reset to initial frame (unpressed)
      this.emergencyButton.setFrame(0);
      // Remove any tint
      this.emergencyButton.clearTint();
      // Re-enable interaction
      this.emergencyButton.setInteractive({ useHandCursor: true });

      console.log("🔴 Emergency button reset to initial state");
    }
  }

  private resetWeaponSelector(): void {
    if (this.weaponOutlines) {
      // Hide all weapon outlines first
      this.weaponOutlines.forEach((outline, weaponKey) => {
        outline.setVisible(false);
      });

      // Show outline for default weapon (machineGun)
      const defaultOutline = this.weaponOutlines.get(this.currentWeapon);
      if (defaultOutline) {
        const uiConfig = GameSettings.game.weapons.ui;
        defaultOutline.clear();
        defaultOutline.lineStyle(3, uiConfig.selectedOutlineColor);

        // Find the weapon icon to get its position
        const weaponIcon = this.weaponIcons.children.entries.find(
          (icon: any) => icon.weaponKey === this.currentWeapon
        ) as Phaser.GameObjects.Image;

        if (weaponIcon) {
          // Use rounded corners for the selection border
          const cornerRadius = 4;
          defaultOutline.strokeRoundedRect(
            weaponIcon.x - (weaponIcon.width * uiConfig.scale) / 2,
            weaponIcon.y - (weaponIcon.height * uiConfig.scale) / 2,
            weaponIcon.width * uiConfig.scale,
            weaponIcon.height * uiConfig.scale,
            cornerRadius
          );
        }

        defaultOutline.setVisible(true);
        console.log(
          `🔫 Weapon selector reset - default weapon '${this.currentWeapon}' selected`
        );
      }

      // Also reset the player weapon visual
      if (this.playerWeapon) {
        this.changePlayerWeapon(this.currentWeapon);
      }
    }
  }

  private ensureDefaultWeaponSelected(): void {
    // Make sure the default weapon is properly selected visually
    this.selectWeapon(this.currentWeapon);
    console.log(
      `🔫 Default weapon '${this.currentWeapon}' ensured as selected`
    );
  }

  private showZombie4Message(): void {
    // Create dramatic message for zombie4 boss appearance (without dark overlay)
    const centerX = GameSettings.canvas.width / 2;
    const centerY = GameSettings.canvas.height / 2 - 100;

    // Create main warning text
    const warningText = this.add.text(
      centerX,
      centerY,
      "DEATH WALKS AMONG US",
      {
        fontFamily: '"Pixelify Sans", monospace, Arial',
        fontSize: "48px",
        color: "#ff0000",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    warningText.setOrigin(0.5);
    warningText.setDepth(10001);

    // Create subtitle text
    const subtitleText = this.add.text(
      centerX,
      centerY + 60,
      "THE GIANT AWAKENS",
      {
        fontFamily: '"Pixelify Sans", monospace, Arial',
        fontSize: "24px",
        color: "#ffff00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      }
    );
    subtitleText.setOrigin(0.5);
    subtitleText.setDepth(10001);

    // Add pulsing effect to main text
    this.tweens.add({
      targets: warningText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: "Power2.easeInOut",
    });

    // Add shake effect to subtitle
    this.tweens.add({
      targets: subtitleText,
      x: subtitleText.x + 5,
      duration: 100,
      yoyo: true,
      repeat: 6,
      ease: "Power2.easeInOut",
    });

    // Fade out and remove after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [warningText, subtitleText],
        alpha: 0,
        duration: 500,
        ease: "Power2.easeOut",
        onComplete: () => {
          warningText.destroy();
          subtitleText.destroy();
        },
      });
    });

    console.log("💀 'DEATH WALKS AMONG US' message displayed for Zombie4 boss");
  }

  private getNextZombie4SpawnKills(): number {
    // Exponential spawn pattern: 100, 300 (100+200), 600 (300+300), 1000 (600+400), etc.

    if (this.zombie4SpawnCount === 0) {
      return 100; // First zombie4 at 100 kills
    } else if (this.zombie4SpawnCount === 1) {
      return 300; // Second zombie4 at 300 kills (100 + 200)
    } else if (this.zombie4SpawnCount === 2) {
      return 600; // Third zombie4 at 600 kills (300 + 300)
    } else {
      // After the third: 1000 (600+400), 1500 (1000+500), 2100 (1500+600), etc.
      let target = 600; // Start from 3rd spawn target
      for (let i = 3; i <= this.zombie4SpawnCount; i++) {
        target += (i + 1) * 100; // 400, 500, 600, 700, etc.
      }
      return target;
    }
  }

  private shouldSpawnMultipleZombie4(): boolean {
    // From the 3rd zombie4 onwards (spawnCount >= 2), spawn 2 at once
    return this.zombie4SpawnCount >= 2;
  }

  private createPlayerAnimations(): void {
    const sprites = GameSettings.game.player.sprites;

    // Create IDLE animation
    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("player-idle", {
        start: 0,
        end: sprites.idle.frames - 1,
      }),
      frameRate: sprites.idle.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create RUN animation
    this.anims.create({
      key: "player-run",
      frames: this.anims.generateFrameNumbers("player-run", {
        start: 0,
        end: sprites.run.frames - 1,
      }),
      frameRate: sprites.run.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create DEATH animation
    this.anims.create({
      key: "player-death",
      frames: this.anims.generateFrameNumbers("player-death", {
        start: 0,
        end: sprites.death.frames - 1,
      }),
      frameRate: sprites.death.frameRate,
      repeat: 0, // Play once
    });

    // Create HIT animation
    this.anims.create({
      key: "player-hit",
      frames: this.anims.generateFrameNumbers("player-hit", {
        start: 0,
        end: sprites.hit.frames - 1,
      }),
      frameRate: sprites.hit.frameRate,
      repeat: 0, // Play once
    });
  }

  private createZombieAnimations(): void {
    // Create animations for Zombie Type 1
    const zombie1Sprites = GameSettings.game.zombies.zombie1.sprites;

    // Create zombie1 IDLE animation
    this.anims.create({
      key: "zombie1-idle",
      frames: this.anims.generateFrameNumbers("zombie1-idle", {
        start: 0,
        end: zombie1Sprites.idle.frames - 1,
      }),
      frameRate: zombie1Sprites.idle.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create zombie1 RUN animation
    this.anims.create({
      key: "zombie1-run",
      frames: this.anims.generateFrameNumbers("zombie1-run", {
        start: 0,
        end: zombie1Sprites.run.frames - 1,
      }),
      frameRate: zombie1Sprites.run.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create zombie1 DEATH animation
    this.anims.create({
      key: "zombie1-death",
      frames: this.anims.generateFrameNumbers("zombie1-death", {
        start: 0,
        end: zombie1Sprites.death.frames - 1,
      }),
      frameRate: zombie1Sprites.death.frameRate,
      repeat: 0, // Play once
    });

    // Create zombie1 HIT animation
    this.anims.create({
      key: "zombie1-hit",
      frames: this.anims.generateFrameNumbers("zombie1-hit", {
        start: 0,
        end: zombie1Sprites.hit.frames - 1,
      }),
      frameRate: zombie1Sprites.hit.frameRate,
      repeat: 0, // Play once
    });

    // Create animations for Zombie Type 2
    const zombie2Sprites = GameSettings.game.zombies.zombie2.sprites;

    // Create zombie2 IDLE animation
    this.anims.create({
      key: "zombie2-idle",
      frames: this.anims.generateFrameNumbers("zombie2-idle", {
        start: 0,
        end: zombie2Sprites.idle.frames - 1,
      }),
      frameRate: zombie2Sprites.idle.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create zombie2 RUN animation
    this.anims.create({
      key: "zombie2-run",
      frames: this.anims.generateFrameNumbers("zombie2-run", {
        start: 0,
        end: zombie2Sprites.run.frames - 1,
      }),
      frameRate: zombie2Sprites.run.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create zombie2 DEATH animation
    this.anims.create({
      key: "zombie2-death",
      frames: this.anims.generateFrameNumbers("zombie2-death", {
        start: 0,
        end: zombie2Sprites.death.frames - 1,
      }),
      frameRate: zombie2Sprites.death.frameRate,
      repeat: 0, // Play once
    });

    // Create zombie2 HIT animation
    this.anims.create({
      key: "zombie2-hit",
      frames: this.anims.generateFrameNumbers("zombie2-hit", {
        start: 0,
        end: zombie2Sprites.hit.frames - 1,
      }),
      frameRate: zombie2Sprites.hit.frameRate,
      repeat: 0, // Play once
    });

    // Create animations for Zombie Type 3
    const zombie3Sprites = GameSettings.game.zombies.zombie3.sprites;

    // Create zombie3 RUN animation
    this.anims.create({
      key: "zombie3-run",
      frames: this.anims.generateFrameNumbers("zombie3-run", {
        start: 0,
        end: zombie3Sprites.run.frames - 1,
      }),
      frameRate: zombie3Sprites.run.frameRate,
      repeat: -1, // Loop infinitely
    });

    // Create zombie3 HIT animation
    this.anims.create({
      key: "zombie3-hit",
      frames: this.anims.generateFrameNumbers("zombie3-hit", {
        start: 0,
        end: zombie3Sprites.hit.frames - 1,
      }),
      frameRate: zombie3Sprites.hit.frameRate,
      repeat: 0, // Play once
    });

    // Create zombie3 DEATH animation (explosion)
    this.anims.create({
      key: "zombie3-death",
      frames: this.anims.generateFrameNumbers("zombie3-death", {
        start: 0,
        end: zombie3Sprites.death.frames - 1,
      }),
      frameRate: zombie3Sprites.death.frameRate,
      repeat: 0, // Play once
    });

    // Create animations for Zombie Type 4 (Boss Giant)
    const zombie4Sprites = GameSettings.game.zombies.zombie4.sprites;

    // Create zombie4 RUN animation
    this.anims.create({
      key: "zombie4-run",
      frames: this.anims.generateFrameNumbers("zombie4-run", {
        start: 0,
        end: zombie4Sprites.run.frames - 1,
      }),
      frameRate: zombie4Sprites.run.frameRate,
      repeat: -1, // Loop forever
    });

    // Create zombie4 HIT animation
    this.anims.create({
      key: "zombie4-hit",
      frames: this.anims.generateFrameNumbers("zombie4-hit", {
        start: 0,
        end: zombie4Sprites.hit.frames - 1,
      }),
      frameRate: zombie4Sprites.hit.frameRate,
      repeat: 0, // Play once
    });

    // Create zombie4 DEATH animation
    this.anims.create({
      key: "zombie4-death",
      frames: this.anims.generateFrameNumbers("zombie4-death", {
        start: 0,
        end: zombie4Sprites.death.frames - 1,
      }),
      frameRate: zombie4Sprites.death.frameRate,
      repeat: 0, // Play once
    });
  }

  private createExplosionAnimations(): void {
    this.anims.create({
      key: "explosion",
      frames: this.anims.generateFrameNumbers("explosion", {
        start: 0,
        end: 6,
      }),
      frameRate: 20,
      repeat: 0,
      hideOnComplete: true,
    });
  }

  private createEmergencyButtonAnimations(): void {
    // Button press animation (frame 0 to frame 1)
    this.anims.create({
      key: "emergency-button-press",
      frames: [
        { key: "emergency-button", frame: 0 },
        { key: "emergency-button", frame: 1 },
      ],
      frameRate: 10,
      repeat: 0,
    });

    // Button idle animation (just frame 0)
    this.anims.create({
      key: "emergency-button-idle",
      frames: [{ key: "emergency-button", frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
  }

  private createZombies(): void {
    // Initialize zombies group with physics
    this.zombies = this.physics.add.group();

    // Set up zombie spawning timer
    this.zombieSpawnTimer = this.time.addEvent({
      delay: GameSettings.game.zombies.spawnRate,
      callback: this.spawnZombie,
      callbackScope: this,
      loop: true,
    });
  }

  private createPowerPortals(): void {
    debugLog("🎯 Initializing power portals system...");
    // Initialize power portals group with physics
    this.powerPortals = this.physics.add.group();

    // Set up portal spawning timer
    this.portalSpawnTimer = this.time.addEvent({
      delay: GameSettings.game.powerPortals.spawnRate,
      callback: this.spawnPortalSet,
      callbackScope: this,
      loop: true,
    });
    console.log(
      `⏰ Portal timer set with ${GameSettings.game.powerPortals.spawnRate}ms delay`
    );

    // Spawn first portal set immediately for testing
    this.time.delayedCall(2000, () => {
      console.log("🎯 Spawning first portal set for testing...");
      this.spawnPortalSet();
    });
  }

  private createSideWalls(): void {
    // Create invisible walls at 2 tile patterns (64px) from each side
    const wallMargin = 64; // 2 * 32px (tile size)
    const wallThickness = 50;

    // Left wall
    const leftWall = this.add.rectangle(
      wallMargin - wallThickness / 2,
      GameSettings.canvas.height / 2,
      wallThickness,
      GameSettings.canvas.height,
      0x000000,
      0 // Alpha 0 = invisible
    );
    this.physics.add.existing(leftWall, true); // true = static body

    // Right wall
    const rightWall = this.add.rectangle(
      GameSettings.canvas.width - wallMargin + wallThickness / 2,
      GameSettings.canvas.height / 2,
      wallThickness,
      GameSettings.canvas.height,
      0x000000,
      0 // Alpha 0 = invisible
    );
    this.physics.add.existing(rightWall, true);

    // Store walls
    this.sideWalls = [leftWall, rightWall];

    console.log("Side walls created at positions:", {
      left: wallMargin - wallThickness / 2,
      right: GameSettings.canvas.width - wallMargin + wallThickness / 2,
      margin: wallMargin,
    });
  }

  private spawnZombie(): void {
    // Check if we've reached the maximum zombies on screen
    if (this.zombies.children.size >= this.currentMaxZombies) {
      return; // Don't spawn more zombies
    }

    // Check for horde mode
    const hordeConfig =
      GameSettings.game.zombies.progressiveDifficulty.hordeMode;
    const shouldSpawnHorde =
      hordeConfig.enabled &&
      this.difficultyLevel >= hordeConfig.triggerAfterLevel &&
      this.time.now - this.lastHordeTime >= hordeConfig.hordeInterval &&
      Math.random() < hordeConfig.hordeChance;

    if (shouldSpawnHorde) {
      this.spawnHorde();
      this.lastHordeTime = this.time.now;
      return;
    }

    // Normal single zombie spawn
    this.spawnSingleZombie();
  }

  private spawnSingleZombie(): void {
    // Calculate how many zombies to spawn based on difficulty level
    const baseSpawnCount = Math.min(
      2 + Math.floor(this.difficultyLevel / 3),
      5
    ); // 2-5 zombies per spawn
    const zombiesToSpawn = Math.min(
      baseSpawnCount,
      this.currentMaxZombies - this.zombies.children.size
    );

    // Spawn multiple zombies even in "normal" mode
    for (let i = 0; i < zombiesToSpawn; i++) {
      // Random spawn position at top of screen respecting wall margins
      const wallMargin = 64; // Same as wall margin (2 tiles)
      const additionalMargin = 20; // Extra space from walls
      const totalMargin = wallMargin + additionalMargin;

      const x = Phaser.Math.Between(
        totalMargin,
        this.sys.game.canvas.width - totalMargin
      );
      const y = -50 - Phaser.Math.Between(0, 50); // Stagger Y positions

      // Add slight delay for visual effect
      this.time.delayedCall(i * 80, () => {
        this.createZombieSprite(x, y);
      });
    }
  }

  private spawnHorde(): void {
    const hordeConfig =
      GameSettings.game.zombies.progressiveDifficulty.hordeMode;
    // Make hordes bigger based on difficulty level
    const baseHordeSize =
      hordeConfig.hordeSize + Math.floor(this.difficultyLevel / 2);
    const zombiesToSpawn = Math.min(
      baseHordeSize,
      this.currentMaxZombies - this.zombies.children.size
    );

    console.log(
      `🧟‍♂️ MASSIVE HORDE INCOMING! Spawning ${zombiesToSpawn} zombies! (Level ${this.difficultyLevel})`
    );

    for (let i = 0; i < zombiesToSpawn; i++) {
      // Spread horde across the screen respecting wall margins
      const wallMargin = 64; // Same as wall margin (2 tiles)
      const additionalMargin = 20; // Extra space from walls
      const totalMargin = wallMargin + additionalMargin;

      const spawnWidth = this.sys.game.canvas.width - totalMargin * 2;
      const x =
        totalMargin +
        (spawnWidth / zombiesToSpawn) * i +
        Phaser.Math.Between(-40, 40);
      const y = -50 - Phaser.Math.Between(0, 150); // More Y variation

      // Shorter delay for more intense effect
      this.time.delayedCall(i * 60, () => {
        this.createZombieSprite(x, y);
      });
    }
  }

  private createZombieSprite(
    x: number,
    y: number,
    forceType?: "zombie1" | "zombie2" | "zombie3" | "zombie4"
  ): void {
    let zombieType: "zombie1" | "zombie2" | "zombie3" | "zombie4";

    // If a specific type is forced (like for second zombie4), use it
    if (forceType) {
      zombieType = forceType;
    } else {
      // Check if zombie4 boss should spawn using exponential pattern
      const nextZombie4Target = this.getNextZombie4SpawnKills();

      if (this.zombiesKilled >= nextZombie4Target) {
        // Spawn zombie4
        zombieType = "zombie4";
        this.zombie4SpawnCount++;

        console.log(
          `🧟 Giant Zombie4 #${this.zombie4SpawnCount} spawned! Kills: ${this.zombiesKilled}`
        );
        console.log(
          `📊 Next Zombie4 will spawn at: ${this.getNextZombie4SpawnKills()} kills`
        );

        // Show dramatic message for zombie4 appearance
        this.showZombie4Message();

        // If we should spawn multiple zombie4s, spawn the second one from the opposite side
        if (this.shouldSpawnMultipleZombie4()) {
          this.time.delayedCall(500, () => {
            // Calculate opposite side position
            const oppositeX = this.sys.game.canvas.width - x;
            this.createZombieSprite(oppositeX, y, "zombie4"); // Force zombie4 type
            console.log(
              `🧟 Second Zombie4 spawned from opposite side! X: ${oppositeX}`
            );
          });
        }
      } else {
        // Normal zombie spawn logic
        const zombie1Weight = GameSettings.game.zombies.zombie1.spawnWeight;
        const zombie2Weight = GameSettings.game.zombies.zombie2.spawnWeight;
        const zombie3Weight = GameSettings.game.zombies.zombie3.spawnWeight;
        const totalWeight = zombie1Weight + zombie2Weight + zombie3Weight;
        const random = Phaser.Math.Between(1, totalWeight);

        if (random <= zombie1Weight) {
          zombieType = "zombie1";
        } else if (random <= zombie1Weight + zombie2Weight) {
          zombieType = "zombie2";
        } else {
          zombieType = "zombie3";
        }
      }
    }

    const zombieConfig = GameSettings.game.zombies[zombieType];

    // Create zombie sprite with appropriate type
    // Note: zombie3 and zombie4 don't have idle animation, use run
    const spriteKey =
      zombieType === "zombie3" || zombieType === "zombie4"
        ? `${zombieType}-run`
        : `${zombieType}-idle`;
    const zombie = this.add.sprite(x, y, spriteKey, 0);

    // Set scale based on zombie type
    let scale = GameSettings.spriteScales.zombies;
    if (zombieType === "zombie2") {
      // Zombie2 is now a tank - bigger size
      scale =
        GameSettings.spriteScales.zombies *
        GameSettings.game.zombies.zombie2.scale;
    } else if (zombieType === "zombie3") {
      scale =
        GameSettings.spriteScales.zombies *
        GameSettings.game.zombies.zombie3.scale;
    } else if (zombieType === "zombie4") {
      // Zombie4 is giant boss - huge size
      scale =
        GameSettings.spriteScales.zombies *
        GameSettings.game.zombies.zombie4.scale;
    }
    zombie.setScale(scale);

    // Play zombie animation (moving towards player)
    const animationKey = `${zombieType}-run`;
    zombie.play(animationKey);

    // Add zombie properties based on type
    (zombie as any).zombieType = zombieType;
    (zombie as any).health = zombieConfig.maxHealth;
    (zombie as any).maxHealth = zombieConfig.maxHealth;
    (zombie as any).isDead = false;
    (zombie as any).originalSpeed = zombieConfig.speed;
    (zombie as any).currentSpeed = zombieConfig.speed;
    (zombie as any).isSlowed = false;

    // Log special zombie creation and initialize special systems
    if (zombieType === "zombie2") {
      console.log(
        `🚗 TANK Zombie2 spawned! Health: ${
          zombieConfig.maxHealth
        }, Scale: ${scale.toFixed(2)}, Speed: ${zombieConfig.speed}`
      );

      // Initialize shield system for zombie2
      this.initializeZombie2Shield(zombie);
    } else if (zombieType === "zombie4") {
      console.log(
        `👹 GIANT SUPER Zombie4 spawned! Health: ${
          zombieConfig.maxHealth
        }, Scale: ${scale.toFixed(2)}, Speed: ${
          zombieConfig.speed
        } | Use SNIPER for best damage!`
      );

      // Add aura effect for zombie4
      this.createZombie4Aura(zombie);
    }

    // Add to zombies group
    this.zombies.add(zombie);

    // Enable physics for zombie
    this.physics.add.existing(zombie);

    // Set zombie velocity (moving down towards player)
    (zombie.body as Phaser.Physics.Arcade.Body).setVelocityY(
      zombieConfig.speed
    );
  }

  private generateMathOperation(
    mustBePositive: boolean = false,
    mustBeNegative: boolean = false
  ): { expression: string; color: number } {
    // Generate simple operations: sum, subtraction, multiplication (X2), or division (/2)
    // Results must be between -5 and +5

    const portalLine = this.currentPortalLine;
    let operation: string = "";
    let resultValue: number = 0;

    do {
      const operationTypes = ["add", "sub", "mul", "div"];
      const opType =
        operationTypes[Math.floor(Math.random() * operationTypes.length)];

      switch (opType) {
        case "add":
          // Generate addition that results in +1 to +5 ONLY
          // Possible combinations: 1+1, 1+2, 1+3, 1+4, 2+1, 2+2, 2+3, 3+1, 3+2, 4+1
          const num1 = Math.floor(Math.random() * 4) + 1; // 1-4
          const maxNum2 = Math.min(4, 5 - num1); // Ensure sum never exceeds 5
          const num2 = Math.floor(Math.random() * maxNum2) + 1; // 1 to maxNum2
          operation = `${num1}+${num2}`;
          resultValue = num1 + num2;
          break;

        case "sub":
          // Generate subtraction that results between -5 and +5
          // For positive results (1 to 5): examples like 7-3=4, 9-4=5, 6-1=5
          // For negative results (-1 to -5): examples like 1-3=-2, 2-7=-5, 4-9=-5

          const shouldBePositive = Math.random() < 0.5;

          if (shouldBePositive) {
            // Generate positive result (1 to 5)
            const result = Math.floor(Math.random() * 5) + 1; // 1-5
            const subtrahend = Math.floor(Math.random() * 8) + 1; // 1-8
            const minuend = subtrahend + result; // Ensure positive result
            operation = `${minuend}-${subtrahend}`;
            resultValue = result;
          } else {
            // Generate negative result (-1 to -5)
            const result = -(Math.floor(Math.random() * 5) + 1); // -1 to -5
            const minuend = Math.floor(Math.random() * 8) + 1; // 1-8
            const subtrahend = minuend - result; // Ensure negative result
            operation = `${minuend}-${subtrahend}`;
            resultValue = result;
          }
          break;

        case "mul":
          // Only X2 allowed
          operation = "X2";
          resultValue = 2; // Positive effect
          break;

        case "div":
          // Only /2 allowed
          operation = "/2";
          resultValue = -1; // Negative effect (halving reduces players)
          break;
      }
    } while (
      (mustBePositive && resultValue <= 0) ||
      (mustBeNegative && resultValue >= 0) ||
      resultValue === 0 // Avoid zero results
    );

    // Determine color
    let color: number;
    const isPositiveResult = resultValue > 0;

    // Always use random colors between green, red, and blue (no correlation with effect)
    const colors = [0x00ff00, 0xff0000, 0x0080ff]; // Green, Red, Blue
    color = colors[Math.floor(Math.random() * colors.length)];

    console.log(
      `🎲 Generated operation: ${operation} (effect: ${
        resultValue > 0 ? "+" : ""
      }${resultValue}) - Line ${portalLine}`
    );

    return { expression: operation, color };
  }

  private generateSpecificOperation(operationType: string): {
    expression: string;
    color: number;
  } {
    // Generate a specific type of operation
    const portalLine = this.currentPortalLine;
    let operation: string = "";
    let resultValue: number = 0;

    switch (operationType) {
      case "add":
        // Generate addition that results in +1 to +5 ONLY
        const num1 = Math.floor(Math.random() * 4) + 1; // 1-4
        const maxNum2 = Math.min(4, 5 - num1); // Ensure sum never exceeds 5
        const num2 = Math.floor(Math.random() * maxNum2) + 1; // 1 to maxNum2
        operation = `${num1}+${num2}`;
        resultValue = num1 + num2;
        break;

      case "sub":
        // Generate subtraction that results between -5 and +5
        const shouldBePositive = Math.random() < 0.3; // 30% chance of positive subtraction

        if (shouldBePositive) {
          // Generate positive result (1 to 5)
          const result = Math.floor(Math.random() * 5) + 1; // 1-5
          const subtrahend = Math.floor(Math.random() * 8) + 1; // 1-8
          const minuend = subtrahend + result; // Ensure positive result
          operation = `${minuend}-${subtrahend}`;
          resultValue = result;
        } else {
          // Generate negative result (-1 to -5)
          const result = -(Math.floor(Math.random() * 5) + 1); // -1 to -5
          const minuend = Math.floor(Math.random() * 8) + 1; // 1-8
          const subtrahend = minuend - result; // Ensure negative result
          operation = `${minuend}-${subtrahend}`;
          resultValue = result;
        }
        break;

      case "mul":
        // Only X2 allowed (always positive)
        operation = "X2";
        resultValue = 2; // Positive effect
        break;

      case "div":
        // Only /2 allowed (always negative effect)
        operation = "/2";
        resultValue = -1; // Negative effect (halving reduces players)
        break;
    }

    // Determine color - always random between green, red, and blue
    const colors = [0x00ff00, 0xff0000, 0x0080ff]; // Green, Red, Blue
    const color = colors[Math.floor(Math.random() * colors.length)];

    console.log(
      `🎲 Generated ${operationType}: ${operation} (effect: ${
        resultValue > 0 ? "+" : ""
      }${resultValue})`
    );

    return { expression: operation, color };
  }

  private evaluateSimpleOperation(expression: string): number {
    // Quickly evaluate if an operation will result in positive or negative change
    // This is used for balancing portal generation

    // Handle skull (instant death - considered extremely negative)
    if (expression === "💀") {
      return -999; // Extremely negative value
    }

    if (expression.includes("+")) {
      // Addition: always positive
      const parts = expression.split("+");
      return parseInt(parts[0]) + parseInt(parts[1]);
    } else if (expression.includes("-")) {
      // Subtraction: can be positive or negative
      const parts = expression.split("-");
      return parseInt(parts[0]) - parseInt(parts[1]);
    } else if (expression.startsWith("X")) {
      // Multiplication: positive multiplier
      return parseInt(expression.substring(1));
    } else if (expression.startsWith("/")) {
      // Division: negative effect
      return -2; // Approximation for negative effect
    }

    return 0;
  }

  private spawnPortalSet(): void {
    console.log("🚪 Spawning portal set...");

    // Reset portal line usage flag
    this.portalLineUsed = false;
    this.currentPortalLine++;

    const config = GameSettings.game.powerPortals;
    const wallMargin = config.wallMargin;

    // Calculate portal dimensions - portals touching each other
    const gameAreaWidth = GameSettings.canvas.width - wallMargin * 2;
    const portalWidth = gameAreaWidth / config.portalCount; // Full width, no gaps
    const portalHeight = config.portalHeight;
    const startY = -portalHeight; // Start above screen

    console.log("Portal dimensions:", {
      gameAreaWidth,
      portalWidth,
      portalHeight,
      wallMargin,
      portalLine: this.currentPortalLine,
    });

    // Generate 3 DISTINCT math operations for this portal set
    const mathOperations = [];
    const portalLine = this.currentPortalLine;

    console.log(
      `🎯 Portal line ${portalLine}: Generating 3 distinct operations`
    );

    // Check if this is a "death line" (every 5th line)
    const isDeathLine = portalLine % 5 === 0;

    if (isDeathLine) {
      // Death line: subtraction, division, and skull (instant death)
      console.log(
        `💀 DEATH LINE ${portalLine}: Generating sub, div, and skull`
      );

      // Generate subtraction (negative result)
      const subOperation = this.generateSpecificOperation("sub");
      // Ensure it's negative
      if (this.evaluateSimpleOperation(subOperation.expression) > 0) {
        // Force a negative subtraction
        subOperation.expression = "1-6"; // Example negative
      }

      // Generate division (negative effect)
      const divOperation = this.generateSpecificOperation("div");

      // Generate skull (instant death)
      const skullOperation = {
        expression: "💀",
        color: 0x000000, // Black color for death
      };

      // Assign unique colors to the three portals
      const availableColors = [0x00ff00, 0xff0000, 0x0080ff]; // Green, Red, Blue
      const shuffledColors = [...availableColors].sort(
        () => Math.random() - 0.5
      );

      subOperation.color = shuffledColors[0];
      divOperation.color = shuffledColors[1];
      skullOperation.color = shuffledColors[2];

      mathOperations.push(subOperation, divOperation, skullOperation);

      // Shuffle the order randomly
      for (let i = mathOperations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mathOperations[i], mathOperations[j]] = [
          mathOperations[j],
          mathOperations[i],
        ];
      }
    } else {
      // Normal line logic
      // Define available operation types
      const operationTypes = ["add", "sub", "mul", "div"];

      // For lines 1-2: Need 2 positives (add + mul) and 1 negative (sub or div)
      // For lines 3+: Need 1 positive (add or mul) and 2 negatives (sub + div)

      let requiredOperations: string[] = [];

      if (portalLine <= 2) {
        // Lines 1-2: 2 positives, 1 negative
        // Must include: add (positive), mul (positive), and one of sub/div (negative)
        requiredOperations = [
          "add",
          "mul",
          Math.random() < 0.5 ? "sub" : "div",
        ];
      } else if (portalLine === 3) {
        // Line 3: 1 positive, 2 negatives
        // Must include: sub (negative), div (negative), and one of add/mul (positive)
        requiredOperations = [
          "sub",
          "div",
          Math.random() < 0.5 ? "add" : "mul",
        ];
      } else {
        // Lines 4+: Always have 1 positive, 2 negatives (no longer allowing all negative)
        // Must include: sub (negative), div (negative), and one of add/mul (positive)
        requiredOperations = [
          "sub",
          "div",
          Math.random() < 0.5 ? "add" : "mul",
        ];
      }

      // Shuffle the required operations to randomize their positions
      for (let i = requiredOperations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [requiredOperations[i], requiredOperations[j]] = [
          requiredOperations[j],
          requiredOperations[i],
        ];
      }

      // Generate each operation based on the required types with unique colors
      const availableColors = [0x00ff00, 0xff0000, 0x0080ff]; // Green, Red, Blue
      const shuffledColors = [...availableColors].sort(
        () => Math.random() - 0.5
      ); // Shuffle colors

      for (let i = 0; i < 3; i++) {
        const operationType = requiredOperations[i];
        const operation = this.generateSpecificOperation(operationType);
        // Override the color to ensure each portal has a unique color
        operation.color = shuffledColors[i];
        mathOperations.push(operation);
      }
    } // End of normal line logic

    console.log(
      `🎯 Portal line ${portalLine}: Generated ${
        mathOperations.filter(
          (op) => this.evaluateSimpleOperation(op.expression) > 0
        ).length
      } positive operations out of 3`
    );

    // Create 3 portals side by side - touching each other
    for (let i = 0; i < config.portalCount; i++) {
      const x = wallMargin + i * portalWidth + portalWidth / 2;
      const operation = mathOperations[i];

      // Create portal with math operation
      this.createMathPortalSprite(
        x,
        startY,
        portalWidth,
        portalHeight,
        operation,
        i
      );
    }
  }

  private createPortalSprite(
    x: number,
    y: number,
    width: number,
    height: number,
    portalType: any
  ): void {
    console.log(
      `🚪 Creating portal sprite at (${x}, ${y}) with size ${width}x${height}, type: ${portalType.value}`
    );
    const config = GameSettings.game.powerPortals;

    // Determine portal color based on type and game progression
    let portalColor: number;
    if (
      config.confusionMode.enabled &&
      this.portalsActivated >= config.confusionMode.triggersAfter
    ) {
      // Random colors for confusion mode - only red and green
      const colors = [config.baseColors.good, config.baseColors.bad];
      portalColor = colors[Math.floor(Math.random() * colors.length)];
      console.log(
        `🎭 Confusion mode active! Using random color: ${portalColor.toString(
          16
        )}`
      );
    } else {
      // Use type-based colors
      if (portalType.type === "good") {
        portalColor = config.baseColors.good;
      } else {
        portalColor = config.baseColors.bad;
      }
      console.log(
        `🎨 Using type-based color for ${
          portalType.type
        }: ${portalColor.toString(16)}`
      );
    }

    // Create portal as a graphics object
    const portalGraphics = this.add.graphics();
    portalGraphics.x = x;
    portalGraphics.y = y;

    // Draw filled rectangle for portal background
    portalGraphics.fillStyle(portalColor, config.backgroundAlpha);
    portalGraphics.fillRect(-width / 2, -height / 2, width, height);

    // Draw borders only on left and right sides (no top/bottom borders)
    portalGraphics.lineStyle(config.borderWidth, config.borderColor);
    // Left border
    portalGraphics.beginPath();
    portalGraphics.moveTo(-width / 2, -height / 2);
    portalGraphics.lineTo(-width / 2, height / 2);
    portalGraphics.strokePath();

    // Right border
    portalGraphics.beginPath();
    portalGraphics.moveTo(width / 2, -height / 2);
    portalGraphics.lineTo(width / 2, height / 2);
    portalGraphics.strokePath();

    portalGraphics.setDepth(100);

    // Create value text as a child component
    const valueText = this.add.text(0, 0, portalType.value, {
      fontFamily: "Pixelify Sans, Arial",
      fontSize: config.textSize,
      color: config.textColor,
      fontStyle: config.textStyle,
    });
    valueText.setOrigin(0.5, 0.5);
    valueText.setDepth(101);

    // Store portal properties directly on the graphics object
    (portalGraphics as any).portalType = portalType.type;
    (portalGraphics as any).portalValue = portalType.value;
    (portalGraphics as any).portalConfig = portalType;
    (portalGraphics as any).valueText = valueText; // Store reference to text

    // Add to portals group
    this.powerPortals.add(portalGraphics);

    // Enable physics for the graphics object
    this.physics.add.existing(portalGraphics);

    // Set physics properties - same as zombies
    const portalBody = portalGraphics.body as Phaser.Physics.Arcade.Body;
    if (portalBody) {
      // Use much smaller hitbox to avoid overlapping collisions
      const hitboxWidth = Math.min(width * 0.6, 80); // 60% of width or max 80px
      const hitboxHeight = Math.min(height * 0.8, 40); // 80% of height or max 40px
      portalBody.setSize(hitboxWidth, hitboxHeight);
      portalBody.setVelocityY(config.speed);
      console.log(
        `🏃 Portal physics applied - Size: ${hitboxWidth}x${hitboxHeight} (vs visual ${width}x${height}), Speed: ${config.speed}`
      );
    } else {
      console.error("❌ Failed to create physics body for portal");
    }

    console.log(
      `✅ Portal sprite created: ${portalType.value} at (${x}, ${y})`
    );
  }

  private createMathPortalSprite(
    x: number,
    y: number,
    width: number,
    height: number,
    operation: { expression: string; color: number },
    portalIndex: number
  ): void {
    console.log(
      `🧮 Creating math portal sprite at (${x}, ${y}) with operation: ${operation.expression}`
    );
    const config = GameSettings.game.powerPortals;

    // Always use the color determined by the operation generation (green, red, or blue)
    const portalColor: number = operation.color;

    console.log(
      `🎨 Using assigned color: ${portalColor.toString(16)} for operation: ${
        operation.expression
      }`
    );

    // Create portal as a graphics object
    const portalGraphics = this.add.graphics();
    portalGraphics.x = x;
    portalGraphics.y = y;

    // Draw filled rectangle for portal background
    portalGraphics.fillStyle(portalColor, config.backgroundAlpha);
    portalGraphics.fillRect(-width / 2, -height / 2, width, height);

    // Draw borders only on left and right sides
    portalGraphics.lineStyle(config.borderWidth, config.borderColor);
    // Left border
    portalGraphics.beginPath();
    portalGraphics.moveTo(-width / 2, -height / 2);
    portalGraphics.lineTo(-width / 2, height / 2);
    portalGraphics.strokePath();

    // Right border
    portalGraphics.beginPath();
    portalGraphics.moveTo(width / 2, -height / 2);
    portalGraphics.lineTo(width / 2, height / 2);
    portalGraphics.strokePath();

    portalGraphics.setDepth(100);

    // Create value text showing the math expression
    const valueText = this.add.text(0, 0, operation.expression, {
      fontFamily: "Pixelify Sans, Arial",
      fontSize: config.textSize,
      color: config.textColor,
      fontStyle: config.textStyle,
    });
    valueText.setOrigin(0.5, 0.5);
    valueText.setDepth(101);

    // Store portal properties
    (portalGraphics as any).portalType = "neutral"; // Dynamic evaluation in collision
    (portalGraphics as any).portalValue = operation.expression;
    (portalGraphics as any).mathOperation = operation;
    (portalGraphics as any).portalIndex = portalIndex;
    (portalGraphics as any).portalLine = this.currentPortalLine;
    (portalGraphics as any).valueText = valueText;
    (portalGraphics as any).activated = false;

    // Add to portals group
    this.powerPortals.add(portalGraphics);

    // Enable physics
    this.physics.add.existing(portalGraphics);

    // Set physics properties
    const portalBody = portalGraphics.body as Phaser.Physics.Arcade.Body;
    if (portalBody) {
      // Use much smaller hitbox to avoid overlapping collisions
      const hitboxWidth = Math.min(width * 0.6, 80); // 60% of width or max 80px
      const hitboxHeight = Math.min(height * 0.8, 40); // 80% of height or max 40px
      portalBody.setSize(hitboxWidth, hitboxHeight);
      portalBody.setVelocityY(config.speed);
      console.log(
        `🏃 Math portal physics - Size: ${hitboxWidth}x${hitboxHeight} (vs visual ${width}x${height})`
      );
    }

    console.log(`✅ Math portal created: ${operation.expression}`);
  }

  // Function removed - using simpler cleanup in update loop

  private createPlayer(): void {
    // Initialize multiple players system
    this.playerSprites = [];
    this.playerWeapons = [];
    this.currentPlayerCount = 1;

    // Create player as a physics-enabled sprite
    this.player = this.add.sprite(
      GameSettings.game.player.startX,
      GameSettings.game.player.startY,
      "player-idle", // Use idle spritesheet as default
      0 // Start with first frame
    );

    // Scale the player sprite
    this.player.setScale(GameSettings.spriteScales.player);

    // Enable physics for the player
    this.physics.add.existing(this.player);

    // Set player depth to be above tilemap
    this.player.setDepth(50);

    // Start with idle animation
    this.player.play("player-idle");
    this.currentPlayerState = "idle";

    // Add to players array
    this.playerSprites.push(this.player);

    // Create weapon visual on player
    this.createPlayerWeapon();

    // Make sure player body exists and configure it
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody) {
      playerBody.setCollideWorldBounds(false); // We'll handle bounds manually
      playerBody.setDrag(300); // Add some drag for smooth movement
    }
  }

  private createPlayerWeapon(): void {
    // Get current weapon config
    const currentWeaponConfig = (GameSettings.game.weapons.types as any)[
      this.currentWeapon
    ];
    const weaponSpriteConfig = GameSettings.game.weapons.spriteSheet;

    // Calculate frame index from grid position
    const frameIndex =
      currentWeaponConfig.spriteRow * weaponSpriteConfig.columns +
      currentWeaponConfig.spriteCol;

    // Create weapon image
    this.playerWeapon = this.add.image(
      this.player.x + GameSettings.game.player.weapon.offsetX,
      this.player.y + GameSettings.game.player.weapon.offsetY,
      "weapons",
      frameIndex
    );

    this.playerWeapon.setScale(GameSettings.spriteScales.weapons);
    this.playerWeapon.setRotation(GameSettings.game.player.weapon.rotation);
    this.playerWeapon.setDepth(49); // Below player

    // Add to weapons array
    this.playerWeapons.push(this.playerWeapon);
  }

  private updatePlayerWeapon(): void {
    // Update all weapons to follow their respective players
    for (let i = 0; i < this.playerWeapons.length; i++) {
      const weapon = this.playerWeapons[i];
      const player = this.playerSprites[i];

      if (weapon && player) {
        weapon.setPosition(
          player.x + GameSettings.game.player.weapon.offsetX,
          player.y + GameSettings.game.player.weapon.offsetY
        );
      }
    }
  }

  private changePlayerWeapon(weaponKey: string): void {
    if (this.playerWeapon) {
      // Get new weapon config
      const newWeaponConfig = (GameSettings.game.weapons.types as any)[
        weaponKey
      ];
      const weaponSpriteConfig = GameSettings.game.weapons.spriteSheet;

      // Calculate frame index from grid position
      const frameIndex =
        newWeaponConfig.spriteRow * weaponSpriteConfig.columns +
        newWeaponConfig.spriteCol;

      // Update all player weapons (main + additional players)
      this.playerWeapons.forEach((weapon) => {
        if (weapon) {
          weapon.setFrame(frameIndex);
        }
      });
    }
  }

  private createBullets(): void {
    // Create bullets group with physics - simpler approach
    this.bullets = this.physics.add.group();
  }

  private createWeaponSystem(): void {
    // Create projectiles group
    this.projectiles = this.physics.add.group();

    // Create weapon icons group
    this.weaponIcons = this.add.group();
    this.weaponOutlines = new Map();
    this.weaponBackgrounds = new Map();

    // Create weapon UI
    const weaponConfig = GameSettings.game.weapons;
    const uiConfig = weaponConfig.ui;

    // Calculate dimensions for column layout in bottom-left corner
    const weaponCount = Object.keys(weaponConfig.types).length;
    const weaponIconSize = 32 * uiConfig.scale; // Actual size of weapon icon
    const totalHeight = (weaponCount - 1) * uiConfig.spacing + weaponIconSize;

    // Position in bottom-left corner
    const leftX = 50; // 50px from left edge
    const startY = GameSettings.canvas.height - totalHeight - 50; // 50px from bottom

    // Create weapon buttons with individual backgrounds

    let weaponIndex = 0;
    Object.entries(weaponConfig.types).forEach(([weaponKey, weapon]) => {
      // Calculate frame index from grid position
      const frameIndex =
        weapon.spriteRow * weaponConfig.spriteSheet.columns + weapon.spriteCol;

      // Calculate Y position for this weapon (properly spaced)
      const yOffset = weaponIndex * uiConfig.spacing;

      // Create individual background for this weapon (larger for better visibility)
      const weaponBg = this.add.graphics();
      weaponBg.fillStyle(uiConfig.backgroundColor, uiConfig.backgroundAlpha);
      const bgPadding = uiConfig.padding * 1.5; // Make background larger
      weaponBg.fillRoundedRect(
        leftX - weaponIconSize / 2 - bgPadding / 2,
        startY + yOffset - weaponIconSize / 2 - bgPadding / 2,
        weaponIconSize + bgPadding,
        weaponIconSize + bgPadding,
        12 // Slightly larger rounded corners
      );
      weaponBg.setDepth(89); // Behind weapon icon

      // Create weapon icon
      const weaponIcon = this.add.image(
        leftX,
        startY + yOffset,
        "weapons",
        frameIndex
      );

      weaponIcon.setScale(uiConfig.scale);
      weaponIcon.setInteractive();
      weaponIcon.setDepth(100); // Above background

      // Store weapon key in the icon for reference
      (weaponIcon as any).weaponKey = weaponKey;

      // Create outline graphics for selection indicator
      const outline = this.add.graphics();
      outline.setDepth(101); // Above weapon icons
      outline.lineStyle(3, uiConfig.selectedOutlineColor);

      // Use rounded corners for the selection border
      const cornerRadius = 4; // Adjust this value for more/less rounded corners
      outline.strokeRoundedRect(
        weaponIcon.x - (weaponIcon.width * uiConfig.scale) / 2,
        weaponIcon.y - (weaponIcon.height * uiConfig.scale) / 2,
        weaponIcon.width * uiConfig.scale,
        weaponIcon.height * uiConfig.scale,
        cornerRadius
      );
      outline.setVisible(weapon.isDefault); // Show outline for default weapon

      this.weaponOutlines.set(weaponKey, outline);
      this.weaponBackgrounds.set(weaponKey, weaponBg);

      // Add click handler
      weaponIcon.on("pointerdown", () => {
        this.selectWeapon(weaponKey);
      });

      // Add hover effects
      weaponIcon.on("pointerover", () => {
        if (weaponKey !== this.currentWeapon) {
          outline.clear();
          outline.lineStyle(2, uiConfig.hoverOutlineColor);

          // Use rounded corners for the hover border
          const cornerRadius = 4; // Same radius as selection border
          outline.strokeRoundedRect(
            weaponIcon.x - (weaponIcon.width * uiConfig.scale) / 2,
            weaponIcon.y - (weaponIcon.height * uiConfig.scale) / 2,
            weaponIcon.width * uiConfig.scale,
            weaponIcon.height * uiConfig.scale,
            cornerRadius
          );
          outline.setVisible(true);
        }
      });

      weaponIcon.on("pointerout", () => {
        if (weaponKey !== this.currentWeapon) {
          outline.setVisible(false);
        }
      });

      this.weaponIcons.add(weaponIcon);
      weaponIndex++; // Move to next weapon position
    });
  }

  private selectWeapon(weaponKey: string): void {
    // Hide current weapon outline
    const currentOutline = this.weaponOutlines.get(this.currentWeapon);
    if (currentOutline) {
      currentOutline.setVisible(false);
    }

    // Set new weapon
    this.currentWeapon = weaponKey;

    // Show new weapon outline
    const newOutline = this.weaponOutlines.get(weaponKey);
    if (newOutline) {
      const uiConfig = GameSettings.game.weapons.ui;
      newOutline.clear();
      newOutline.lineStyle(3, uiConfig.selectedOutlineColor);

      // Find the weapon icon to get its position
      const weaponIcon = this.weaponIcons.children.entries.find(
        (icon: any) => icon.weaponKey === weaponKey
      ) as Phaser.GameObjects.Image;

      if (weaponIcon) {
        // Use rounded corners for the selection border
        const cornerRadius = 4; // Same radius as other borders
        newOutline.strokeRoundedRect(
          weaponIcon.x - (weaponIcon.width * uiConfig.scale) / 2,
          weaponIcon.y - (weaponIcon.height * uiConfig.scale) / 2,
          weaponIcon.width * uiConfig.scale,
          weaponIcon.height * uiConfig.scale,
          cornerRadius
        );
      }

      newOutline.setVisible(true);
    }

    // Change player weapon visual
    this.changePlayerWeapon(weaponKey);

    console.log(`Weapon selected: ${weaponKey}`);
  }

  private createUI(): void {
    // Load Pixelify font
    if ((window as any).WebFont) {
      (window as any).WebFont.load({
        google: {
          families: ["Pixelify Sans"],
        },
      });
    }

    // Create header background - darker
    this.headerBackground = this.add.graphics();
    this.headerBackground.fillStyle(0x000000, 0.9); // Darker background
    this.headerBackground.fillRect(0, 0, GameSettings.canvas.width, 80);
    this.headerBackground.setDepth(1000); // High depth to be above everything

    // Create score and kills text with space-evenly distribution
    const canvasWidth = GameSettings.canvas.width;

    // Space-evenly: divide width in 3 equal parts, place elements at 1/3 and 2/3
    const scoreX = canvasWidth / 3; // 1/3 of width (240px for 720px canvas) - Score on LEFT
    const killsX = (canvasWidth * 2) / 3; // 2/3 of width (480px for 720px canvas) - Kills on RIGHT

    // Score text - positioned at 1/3 of screen width (LEFT)
    this.scoreText = this.add.text(scoreX, 40, "Score: ", {
      fontFamily: "Pixelify Sans, Arial",
      fontSize: "20px",
      color: "#ffffff", // White for label
    });
    this.scoreText.setOrigin(0.5, 0.5); // Center-aligned
    this.scoreText.setDepth(1001);

    // Add green number for score from the start
    const greenColor = "#00ff00";
    const scoreNumber = this.add.text(
      this.scoreText.x + this.scoreText.width / 2 + 5,
      this.scoreText.y,
      this.score.toString(),
      {
        fontFamily: "Pixelify Sans, Arial",
        fontSize: "20px",
        color: greenColor,
      }
    );
    scoreNumber.setOrigin(0, 0.5);
    scoreNumber.setDepth(1001);
    (this as any).scoreNumberText = scoreNumber;

    // Kills text - positioned at 2/3 of screen width (RIGHT)
    this.killsText = this.add.text(killsX, 40, "Kills: ", {
      fontFamily: "Pixelify Sans, Arial",
      fontSize: "20px",
      color: "#ffffff", // White for label
    });
    this.killsText.setOrigin(0.5, 0.5); // Center-aligned
    this.killsText.setDepth(1001);

    // Add green number for kills from the start
    const killsNumber = this.add.text(
      this.killsText.x + this.killsText.width / 2 + 5,
      this.killsText.y,
      this.zombiesKilled.toString(),
      {
        fontFamily: "Pixelify Sans, Arial",
        fontSize: "20px",
        color: greenColor,
      }
    );
    killsNumber.setOrigin(0, 0.5);
    killsNumber.setDepth(1001);
    (this as any).killsNumberText = killsNumber;

    console.log(`📐 Space-evenly distribution - Canvas: ${canvasWidth}px`);
    console.log(`📍 Score at ${scoreX}px (1/3), Kills at ${killsX}px (2/3)`);

    // Create emergency red button
    this.createEmergencyButton();

    // Create player health bar
    this.createPlayerHealthBar();
  }

  private createPlayerHealthBar(): void {
    const healthConfig = GameSettings.game.health.player;
    const barWidth = 200;
    const barHeight = 35; // Increased height for better visibility
    const barX = 20;
    const barY = 90; // Below header

    // Create health bar background with rounded corners effect
    this.playerHealthBarBg = this.add.graphics();
    this.playerHealthBarBg.fillStyle(healthConfig.backgroundColor);

    // Draw rounded rectangle manually
    const radius = healthConfig.borderRadius || 8;
    this.playerHealthBarBg.fillRoundedRect(
      barX,
      barY,
      barWidth,
      barHeight,
      radius
    );

    // Add white border with rounded corners
    this.playerHealthBarBg.lineStyle(
      healthConfig.borderWidth,
      healthConfig.borderColor
    );
    this.playerHealthBarBg.strokeRoundedRect(
      barX,
      barY,
      barWidth,
      barHeight,
      radius
    );
    this.playerHealthBarBg.setDepth(1000);

    // Create health bar
    this.playerHealthBar = this.add.graphics();
    this.updatePlayerHealthBar();
    this.playerHealthBar.setDepth(1001);

    // Add health number in center of health bar
    this.playerHealthText = this.add.text(
      barX + barWidth / 2,
      barY + barHeight / 2,
      this.playerHealth.toString(),
      {
        fontFamily: "Pixelify Sans, Arial",
        fontSize: "18px", // Increased font size for better visibility
        color: "#000000", // Black text
        fontStyle: "bold",
      }
    );
    this.playerHealthText.setOrigin(0.5, 0.5); // Center the text
    this.playerHealthText.setDepth(1002); // Above health bar
  }

  private updatePlayerHealthBar(): void {
    if (!this.playerHealthBar) return;

    const healthConfig = GameSettings.game.health.player;
    const barWidth = 200;
    const barHeight = 35; // Increased height to match createPlayerHealthBar
    const barX = 20;
    const barY = 90;
    const radius = healthConfig.borderRadius || 8;

    // Clear previous health bar
    this.playerHealthBar.clear();

    // Calculate health percentage
    const maxHealth = GameSettings.game.health.player.maxHealth;
    const healthPercentage = Math.max(0, this.playerHealth / maxHealth);

    // Choose color based on health percentage
    let healthColor = healthConfig.healthColor; // Green from config
    if (healthPercentage < 0.3) {
      healthColor = healthConfig.damageColor; // Red from config
    } else if (healthPercentage < 0.6) {
      healthColor = 0xffaa00; // Orange
    }

    // Draw health bar with rounded corners
    this.playerHealthBar.fillStyle(healthColor);
    this.playerHealthBar.fillRoundedRect(
      barX,
      barY,
      barWidth * healthPercentage,
      barHeight,
      radius
    );

    // Add white border with rounded corners
    this.playerHealthBar.lineStyle(
      healthConfig.borderWidth,
      healthConfig.borderColor
    );
    this.playerHealthBar.strokeRoundedRect(
      barX,
      barY,
      barWidth,
      barHeight,
      radius
    );

    // Update health text
    if (this.playerHealthText) {
      this.playerHealthText.setText(this.playerHealth.toString());
    }
  }

  private createEmergencyButton(): void {
    const buttonConfig = GameSettings.game.emergencyButton;

    // Create emergency button sprite
    this.emergencyButton = this.add.sprite(
      buttonConfig.position.x,
      buttonConfig.position.y,
      "emergency-button",
      0 // Start with frame 0 (unpressed)
    );

    this.emergencyButton.setScale(buttonConfig.scale);
    this.emergencyButton.setDepth(1000); // High depth to be above other elements
    this.emergencyButton.setInteractive({ useHandCursor: true });

    // Add click/tap handlers
    this.emergencyButton.on("pointerdown", () => {
      this.activateEmergencyButton();
    });

    // Visual feedback on hover
    this.emergencyButton.on("pointerover", () => {
      if (!this.emergencyButtonUsed) {
        this.emergencyButton.setTint(0xffaaaa); // Light red tint
      }
    });

    this.emergencyButton.on("pointerout", () => {
      if (!this.emergencyButtonUsed) {
        this.emergencyButton.clearTint();
      }
    });

    console.log(
      `🔴 Emergency button created at (${buttonConfig.position.x}, ${buttonConfig.position.y})`
    );
  }

  private activateEmergencyButton(): void {
    // Play explosion sound effect IMMEDIATELY on click
    const explosionConfig = GameSettings.audio.effects.explosionButton;
    this.sound.play(explosionConfig.key, {
      volume: explosionConfig.volume,
    });

    // Check if button can be used
    if (this.emergencyButtonUsed) {
      console.log(`❌ Emergency button already used!`);
      return;
    }

    // Mark as used
    this.emergencyButtonUsed = true;

    // Change to pressed frame
    this.emergencyButton.setFrame(1);
    this.emergencyButton.setTint(0x666666); // Gray out the button
    this.emergencyButton.disableInteractive(); // Disable further clicks

    console.log(
      `🔥 EMERGENCY BUTTON ACTIVATED! Clearing all zombies on screen!`
    );

    // Get all visible zombies on screen
    const screenZombies: Phaser.GameObjects.Sprite[] = [];
    this.zombies.children.entries.forEach((zombie) => {
      const zombieSprite = zombie as Phaser.GameObjects.Sprite;
      if (zombieSprite.active && zombieSprite.visible) {
        // Check if zombie is visible on screen
        const bounds = zombieSprite.getBounds();
        if (
          bounds.x < GameSettings.canvas.width &&
          bounds.x + bounds.width > 0 &&
          bounds.y < GameSettings.canvas.height &&
          bounds.y + bounds.height > 0
        ) {
          screenZombies.push(zombieSprite);
        }
      }
    });

    console.log(`💥 Found ${screenZombies.length} zombies to explode!`);

    // Create massive screen explosion effect
    this.createEmergencyExplosion();

    // Explode all screen zombies with a delay for visual effect
    screenZombies.forEach((zombie, index) => {
      this.time.delayedCall(index * 50 + 200, () => {
        if (zombie.active) {
          // Force kill zombie with explosion
          (zombie as any).health = 0;
          this.killZombie(zombie);
        }
      });
    });
  }

  private createEmergencyExplosion(): void {
    const explosionConfig = GameSettings.game.emergencyButton.explosionEffect;

    // Create full-screen explosion effect
    const centerX = GameSettings.canvas.width / 2;
    const centerY = GameSettings.canvas.height / 2;

    // Create multiple expanding explosion rings
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 100, () => {
        const explosion = this.add.graphics();
        explosion.setPosition(centerX, centerY);
        explosion.setDepth(500);

        // Create expanding red ring
        const maxRadius = explosionConfig.radius + i * 50;
        const colors = [0xff0000, 0xff4444, 0xff8888, 0xffaaaa];

        colors.forEach((color, index) => {
          const radius = (maxRadius / colors.length) * (colors.length - index);
          explosion.fillStyle(color, 0.6 - index * 0.1);
          explosion.fillCircle(0, 0, radius);
        });

        // Animate explosion
        this.tweens.add({
          targets: explosion,
          scaleX: 3.0,
          scaleY: 3.0,
          alpha: 0,
          duration: explosionConfig.duration,
          ease: "Power2",
          onComplete: () => {
            explosion.destroy();
          },
        });

        // Screen shake effect
        this.cameras.main.shake(200, 0.02);
      });
    }

    // Flash effect
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillRect(0, 0, GameSettings.canvas.width, GameSettings.canvas.height);
    flash.setDepth(1000);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  private updateScoreDisplay(): void {
    // Simply update the green numbers since UI is already set up properly
    if ((this as any).scoreNumberText) {
      (this as any).scoreNumberText.setText(this.score.toString());
    }

    if ((this as any).killsNumberText) {
      (this as any).killsNumberText.setText(this.zombiesKilled.toString());
    }
  }

  private setupControls(): void {
    // Setup keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys("W,S,A,D") as any;

    // Setup touch/pointer controls for mobile
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("pointermove", this.handlePointerMove, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Check if touching left or right side of screen for movement
    const screenCenter = GameSettings.canvas.width / 2;

    if (pointer.x < screenCenter) {
      this.isMovingLeft = true;
    } else {
      this.isMovingRight = true;
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    this.isMovingLeft = false;
    this.isMovingRight = false;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Could implement drag-to-move here if needed
  }

  private fireBullet(): void {
    const currentTime = this.time.now;
    const currentWeaponConfig = (GameSettings.game.weapons.types as any)[
      this.currentWeapon
    ];

    // Check if enough time has passed since last shot based on current weapon
    if (currentTime - this.lastFired < currentWeaponConfig.fireRate) {
      return;
    }

    // Fire projectiles based on weapon type
    this.fireProjectilesForWeapon(currentWeaponConfig);

    this.lastFired = currentTime;
  }

  private fireProjectilesForWeapon(weaponConfig: any): void {
    // Fire from all players simultaneously
    for (let i = 0; i < this.playerSprites.length; i++) {
      const player = this.playerSprites[i];
      if (player) {
        const playerX = player.x;
        const playerY = player.y + GameSettings.game.weapon.offsetY;

        // Determine projectile type based on weapon
        const projectileType =
          this.currentWeapon === "rocketLauncher" ? "rocket" : "normal";
        const projectileConfig =
          GameSettings.game.projectiles.types[projectileType];

        this.fireProjectilesFromPosition(
          weaponConfig,
          projectileConfig,
          playerX,
          playerY
        );
      }
    }
  }

  private fireProjectilesFromPosition(
    weaponConfig: any,
    projectileConfig: any,
    playerX: number,
    playerY: number
  ): void {
    // Calculate frame index for projectile sprite
    const frameIndex =
      projectileConfig.spriteRow *
        GameSettings.game.projectiles.spriteSheet.columns +
      projectileConfig.spriteCol;

    // Fire multiple projectiles for weapons like shotgun
    for (let i = 0; i < weaponConfig.projectileCount; i++) {
      // Create projectile
      const projectile = this.projectiles.create(
        playerX,
        playerY,
        "projectiles",
        frameIndex
      ) as Phaser.Physics.Arcade.Sprite;

      projectile.setScale(GameSettings.spriteScales.projectiles);
      projectile.setDepth(40);

      // Calculate angle for spread weapons (0 = right, 90 = down, 180 = left, 270 = up)
      let angle = 270; // Default upward angle (270 degrees)
      if (weaponConfig.projectileCount > 1) {
        // Calculate spread for multi-projectile weapons (like shotgun)
        const spreadStep =
          weaponConfig.spread / (weaponConfig.projectileCount - 1);
        angle = 270 - weaponConfig.spread / 2 + i * spreadStep;
      } else if (weaponConfig.spread > 0) {
        // Add random spread for single projectile weapons with spread (like machine gun)
        angle = 270 + (Math.random() - 0.5) * weaponConfig.spread;
      }

      // Convert angle to radians and calculate velocity
      const angleRad = Phaser.Math.DegToRad(angle);
      const velocityX = Math.cos(angleRad) * weaponConfig.projectileSpeed;
      const velocityY = Math.sin(angleRad) * weaponConfig.projectileSpeed;

      // Set velocity using the physics body
      if (projectile.body) {
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(velocityX, velocityY);
        body.setCollideWorldBounds(false);

        // Rotate projectile to match movement direction
        // Since sprites by default point to the right (0°), we need to adjust the rotation
        projectile.setRotation(angleRad + Math.PI / 2); // +90° to align with movement direction

        // Store weapon info for damage calculation
        (projectile as any).weaponDamage = weaponConfig.damage;
        (projectile as any).weaponType = this.currentWeapon;
        (projectile as any).createdAt = this.time.now;

        // Add piercing properties for sniper
        if (this.currentWeapon === "sniper" && weaponConfig.piercing) {
          (projectile as any).piercing = true;
          (projectile as any).hitCount = 0; // Track how many zombies hit
          console.log(`🎯 Sniper projectile created with piercing ability`);
        }

        // Add trail effect for rockets
        const projectileType =
          this.currentWeapon === "rocketLauncher" ? "rocket" : "normal";
        if (projectileType === "rocket" && projectileConfig.trailEffect) {
          const trailColor = (projectileConfig as any).trailColor || 0xff4400;
          this.createTrailEffect(projectile, trailColor);
        }
      }
    }
  }

  private createTrailEffect(
    projectile: Phaser.Physics.Arcade.Sprite,
    trailColor: number
  ): void {
    // Create a simple particle trail for rockets
    const particles = this.add.particles(
      projectile.x,
      projectile.y,
      "projectiles",
      {
        frame: 0, // Use a small particle frame
        scale: { start: 0.3, end: 0.1 },
        speed: { min: 20, max: 40 },
        lifespan: 200,
        quantity: 2,
        tint: trailColor,
        follow: projectile,
      }
    );

    // Clean up particles when projectile is destroyed
    (projectile as any).trailParticles = particles;
  }

  private setupCollisions(): void {
    // Setup overlap between bullets and zombies (no physical push) - legacy system
    this.physics.add.overlap(
      this.bullets,
      this.zombies,
      this.bulletHitZombie,
      undefined,
      this
    );

    // Setup overlap between projectiles and zombies (new weapon system)
    this.physics.add.overlap(
      this.projectiles,
      this.zombies,
      this.projectileHitZombie,
      undefined,
      this
    );

    // Setup collision between player and zombies
    // Setup overlap between player and zombies (NO collider to prevent knockback)
    this.physics.add.overlap(
      this.player,
      this.zombies,
      this.playerHitZombie,
      undefined,
      this
    );

    // Setup overlap between ONLY the main player and power portals
    // Additional players (multiplied players) cannot activate portals to avoid conflicts
    this.physics.add.overlap(
      this.player, // Only main player, not playerSprites array
      this.powerPortals,
      this.playerHitPortal,
      undefined,
      this
    );

    // Setup collision between players and side walls
    if (this.sideWalls.length > 0) {
      this.sideWalls.forEach((wall) => {
        // Main player collision
        this.physics.add.collider(this.player, wall);

        // Additional players collision (multiplayer)
        this.playerSprites.forEach((playerSprite) => {
          this.physics.add.collider(playerSprite, wall);
        });

        // Zombies collision with walls
        this.physics.add.collider(this.zombies, wall);
      });
    }
  }

  private bulletHitZombie(bullet: any, zombie: any): void {
    const zombieSprite = zombie as Phaser.GameObjects.Sprite;
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;

    // Check if zombie is already dead or inactive - if so, ignore the hit
    if (
      (zombieSprite as any).isDead ||
      !zombieSprite.active ||
      !zombieSprite.body
    ) {
      // Remove bullet properly
      this.bullets.remove(bulletSprite);
      bulletSprite.destroy();
      return;
    }

    // Destroy bullet properly
    this.bullets.remove(bulletSprite);
    bulletSprite.destroy();

    // Check if zombie2 is shielded
    const zombieType = (zombieSprite as any).zombieType;
    if (zombieType === "zombie2" && this.isZombie2Shielded(zombieSprite)) {
      // Check if current weapon is rocket launcher - it can break shields
      if (this.currentWeapon === "rocketLauncher") {
        this.breakZombie2Shield(zombieSprite);
        console.log(
          `�💥 Rocket launcher broke zombie2 shield! Now vulnerable!`
        );
        // Don't return - continue with damage since shield is broken
      } else {
        console.log(`�🛡️ Zombie2 tank blocked damage with poison shield!`);
        return; // No damage dealt by other weapons
      }
    }

    // Calculate damage with zombie4 resistances
    let damage = GameSettings.game.weapon.damage;
    if (zombieType === "zombie4") {
      const resistances = GameSettings.game.zombies.zombie4.resistances;
      const weaponResistance =
        resistances[this.currentWeapon as keyof typeof resistances] || 1.0;
      damage = Math.ceil(damage * weaponResistance);

      console.log(
        `👹 Zombie4 boss resistance applied! Weapon: ${this.currentWeapon}, Multiplier: ${weaponResistance}x, Damage: ${GameSettings.game.weapon.damage} -> ${damage}`
      );
    }

    // Damage zombie
    const currentHealth = (zombieSprite as any).health || 0;
    const newHealth = currentHealth - damage;
    (zombieSprite as any).health = newHealth;

    console.log(
      `💥 Zombie ${zombieType} hit! Damage: ${damage}, Health: ${currentHealth} -> ${newHealth}`
    );

    // Show/update health bar when zombie takes damage
    this.showZombieHealthBar(
      zombieSprite,
      newHealth,
      (zombieSprite as any).maxHealth ||
        GameSettings.game.zombies.zombie1.maxHealth
    );

    if (newHealth <= 0) {
      // Zombie is dead - mark as dead immediately
      (zombieSprite as any).isDead = true;
      this.killZombie(zombieSprite);

      // Update score and kills
      this.zombiesKilled++;
      this.score += 100; // 100 points per zombie
      this.updateScoreDisplay();
    } else {
      // Zombie is hit but not dead - slow it down
      (zombieSprite as any).isSlowed = true;
      (zombieSprite as any).currentSpeed =
        (zombieSprite as any).originalSpeed * 0.5; // 50% speed
      (zombieSprite as any).slowedTime = 0;

      // Maintain zombie's downward movement but slower
      const zombieBody = zombieSprite.body as Phaser.Physics.Arcade.Body;
      if (zombieBody) {
        zombieBody.setVelocityY((zombieSprite as any).currentSpeed);
        zombieBody.setVelocityX(0); // Ensure no horizontal movement
      }

      // Play hit animation based on zombie type
      const zombieType = (zombieSprite as any).zombieType || "zombie1";

      // Regular zombies use hit animation
      zombieSprite.play(`${zombieType}-hit`);
      // Return to run animation after hit
      zombieSprite.once("animationcomplete", () => {
        if (zombieSprite.active && !(zombieSprite as any).isDead) {
          zombieSprite.play(`${zombieType}-run`);
        }
      });
    }
  }

  private projectileHitZombie(projectile: any, zombie: any): void {
    const zombieSprite = zombie as Phaser.GameObjects.Sprite;
    const projectileSprite = projectile as Phaser.Physics.Arcade.Sprite;

    // Check if zombie is already dead - if so, ignore the hit
    if ((zombieSprite as any).isDead) {
      // Clean up trail particles if it's a rocket
      if ((projectileSprite as any).trailParticles) {
        (projectileSprite as any).trailParticles.destroy();
      }
      // Remove projectile properly (only if not piercing)
      if (!(projectileSprite as any).piercing) {
        this.projectiles.remove(projectileSprite);
        projectileSprite.destroy();
      }
      return;
    }

    const weaponDamage = (projectileSprite as any).weaponDamage || 1;
    const weaponType = (projectileSprite as any).weaponType || "pistol";
    const isPiercing = (projectileSprite as any).piercing || false;

    // Handle rocket explosion
    if (weaponType === "rocketLauncher") {
      this.handleRocketExplosion(projectileSprite, zombieSprite);
    } else {
      // Regular projectile hit
      this.damageZombie(zombieSprite, weaponDamage);
    }

    // Handle piercing logic for sniper
    if (isPiercing && weaponType === "sniper") {
      // Track how many zombies this projectile has hit
      const hitCount = ((projectileSprite as any).hitCount || 0) + 1;
      (projectileSprite as any).hitCount = hitCount;

      const maxPiercing =
        GameSettings.game.weapons.types.sniper.maxPiercing || 5;

      console.log(`🎯 Sniper pierced zombie ${hitCount}/${maxPiercing}`);

      // Only destroy projectile if it has hit max zombies
      if (hitCount >= maxPiercing) {
        // Clean up trail particles
        if ((projectileSprite as any).trailParticles) {
          (projectileSprite as any).trailParticles.destroy();
        }
        this.projectiles.remove(projectileSprite);
        projectileSprite.destroy();
      }
      // If not max hits, projectile continues
    } else {
      // Non-piercing projectiles are destroyed on hit
      // Clean up trail particles if it's a rocket
      if ((projectileSprite as any).trailParticles) {
        (projectileSprite as any).trailParticles.destroy();
      }

      // Destroy projectile properly
      this.projectiles.remove(projectileSprite);
      projectileSprite.destroy();
    }
  }

  private handleRocketExplosion(
    rocketSprite: Phaser.Physics.Arcade.Sprite,
    targetZombie: Phaser.GameObjects.Sprite
  ): void {
    const rocketConfig = GameSettings.game.weapons.types.rocketLauncher;
    const explosionRadius = rocketConfig.explosionRadius;
    const explosionDamage = rocketConfig.explosionDamage || rocketConfig.damage;

    // Trigger haptic feedback for rocket explosion
    this.triggerHapticFeedback();

    // Create explosion sprite animation at rocket position
    const explosion = this.add.sprite(
      rocketSprite.x,
      rocketSprite.y,
      "explosion"
    );
    explosion.setScale(GameSettings.spriteScales.explosions); // Scale up for better visibility
    explosion.play("explosion");
    explosion.on("animationcomplete", () => explosion.destroy());

    // Find all zombies within explosion radius
    this.zombies.children.entries.forEach((zombieObj) => {
      const zombieSprite = zombieObj as Phaser.GameObjects.Sprite;
      const distance = Phaser.Math.Distance.Between(
        rocketSprite.x,
        rocketSprite.y,
        zombieSprite.x,
        zombieSprite.y
      );

      if (distance <= explosionRadius && !(zombieSprite as any).isDead) {
        // Calculate damage based on distance (closer = more damage)
        const damageMultiplier = 1 - (distance / explosionRadius) * 0.3; // 70-100% damage
        const actualDamage = Math.ceil(explosionDamage * damageMultiplier);
        this.damageZombie(zombieSprite, actualDamage);
      }
    });
  }

  private damageZombie(
    zombieSprite: Phaser.GameObjects.Sprite,
    damage: number
  ): void {
    // Check if zombie2 is shielded
    const zombieType = (zombieSprite as any).zombieType;
    if (zombieType === "zombie2" && this.isZombie2Shielded(zombieSprite)) {
      // Check if damage comes from rocket launcher explosion - it can break shields
      if (this.currentWeapon === "rocketLauncher") {
        this.breakZombie2Shield(zombieSprite);
        console.log(
          `🚀💥 Rocket explosion broke zombie2 shield! Now vulnerable!`
        );
        // Don't return - continue with damage since shield is broken
      } else {
        console.log(
          `🛡️ Zombie2 tank blocked explosion damage with poison shield!`
        );
        return; // No damage dealt by other explosions
      }
    }

    // Apply zombie4 resistances to damage
    let finalDamage = damage;
    if (zombieType === "zombie4") {
      const resistances = GameSettings.game.zombies.zombie4.resistances;
      const weaponResistance =
        resistances[this.currentWeapon as keyof typeof resistances] || 1.0;
      finalDamage = Math.ceil(damage * weaponResistance);

      console.log(
        `👹 Zombie4 boss explosion resistance applied! Weapon: ${this.currentWeapon}, Multiplier: ${weaponResistance}x, Damage: ${damage} -> ${finalDamage}`
      );
    }

    // Damage zombie
    const currentHealth = (zombieSprite as any).health || 0;
    const newHealth = currentHealth - finalDamage;
    (zombieSprite as any).health = newHealth;

    console.log(
      `💥 Zombie ${zombieType} explosion damage! Damage: ${finalDamage}, Health: ${currentHealth} -> ${newHealth}`
    );

    // Show/update health bar when zombie takes damage
    this.showZombieHealthBar(
      zombieSprite,
      newHealth,
      (zombieSprite as any).maxHealth ||
        GameSettings.game.zombies.zombie1.maxHealth
    );

    if (newHealth <= 0) {
      // Zombie is dead - mark as dead immediately
      (zombieSprite as any).isDead = true;
      this.killZombie(zombieSprite);

      // Update score and kills
      this.zombiesKilled++;
      this.score += 100; // 100 points per zombie
      this.updateScoreDisplay();

      // Zombie is hit but not dead - slow it down
      (zombieSprite as any).isSlowed = true;
      (zombieSprite as any).currentSpeed =
        (zombieSprite as any).originalSpeed * 0.5; // 50% speed
      (zombieSprite as any).slowedTime = 0;

      // Maintain zombie's downward movement but slower
      const zombieBody = zombieSprite.body as Phaser.Physics.Arcade.Body;
      if (zombieBody) {
        zombieBody.setVelocityY((zombieSprite as any).currentSpeed);
        zombieBody.setVelocityX(0); // Ensure no horizontal movement
      }

      // Play hit animation based on zombie type
      const zombieType = (zombieSprite as any).zombieType || "zombie1";

      // Play the hit animation
      zombieSprite.play(`${zombieType}-hit`);
      // Return to run animation after hit
      zombieSprite.once("animationcomplete", () => {
        if (zombieSprite.active && !(zombieSprite as any).isDead) {
          zombieSprite.play(`${zombieType}-run`);
        }
      });
    }
  }

  private playerHitZombie(player: any, zombie: any): void {
    const zombieSprite = zombie as Phaser.GameObjects.Sprite;
    const zombieType = (zombieSprite as any).zombieType || "zombie1";

    // Trigger haptic feedback for player taking damage
    this.triggerHapticFeedback();

    // Special handling for zombie2 tank explosion
    if (zombieType === "zombie2") {
      // Check if zombie2 still has shield - explosive damage
      const hasShield = this.isZombie2Shielded(zombieSprite);
      const zombieConfig = GameSettings.game.zombies.zombie2;

      if (hasShield) {
        // Zombie2 with shield explodes with extra damage
        const explosionDamage = zombieConfig.shieldExplosionDamage;
        this.playerHealth -= explosionDamage;
        console.log(
          `💥🛡️ Zombie2 TANK EXPLODED with shield! Damage: ${explosionDamage}`
        );

        // Create visual explosion effect
        this.createExplosionEffect(
          zombieSprite.x,
          zombieSprite.y,
          zombieConfig.explosionRadius
        );
      } else {
        // Zombie2 without shield - normal explosion damage
        const explosionDamage = zombieConfig.explosionDamage;
        this.playerHealth -= explosionDamage;
        console.log(`💥 Zombie2 tank exploded! Damage: ${explosionDamage}`);

        // Create visual explosion effect
        this.createExplosionEffect(
          zombieSprite.x,
          zombieSprite.y,
          zombieConfig.explosionRadius
        );
      }
    } else {
      // Regular zombie damage (zombie1 and zombie3)
      this.playerHealth -= GameSettings.game.zombies.damage || 1;
    }

    // Update player health bar
    this.updatePlayerHealthBar();

    // Kill the zombie that hit the player
    this.killZombie(zombieSprite);

    // Check if player is dead - trigger game over
    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      this.updatePlayerHealthBar();
      this.handleGameOver();
    }
  }

  private killZombie(zombie: Phaser.GameObjects.Sprite): void {
    // Mark zombie as dead immediately to prevent further hits
    (zombie as any).isDead = true;

    // Trigger haptic feedback for zombie kill
    this.triggerHapticFeedback();

    // IMMEDIATELY remove from physics group to stop bullet collisions
    this.zombies.remove(zombie);

    // Disable physics body immediately
    const body = zombie.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setEnable(false); // Disable collision detection
      body.setVelocity(0, 0); // Stop movement
    }

    // Play death animation based on zombie type
    const zombieType = (zombie as any).zombieType || "zombie1";
    zombie.stop(); // Stop current animation

    // Hide health bar if it exists
    this.hideZombieHealthBar(zombie);

    // All zombies now explode when they die
    // Play death animation first
    zombie.play(`${zombieType}-death`);

    // Trigger explosion after a short delay (during death animation)
    const explosionDelay = zombieType === "zombie3" ? 200 : 100; // Shorter delay for zombie1/2
    this.time.delayedCall(explosionDelay, () => {
      this.explodeZombie(zombie);
    });

    // Destroy zombie after explosion and animation
    zombie.once("animationcomplete", () => {
      if (zombie.scene) {
        zombie.destroy();
      }
    });

    // Cleanup zombie2 shield system
    if ((zombie as any).zombieType === "zombie2") {
      this.cleanupZombie2Shield(zombie);
    }

    // Cleanup zombie4 aura system
    if ((zombie as any).zombieType === "zombie4") {
      this.cleanupZombie4Aura(zombie);
    }

    // Fallback: destroy after appropriate time
    const fallbackTime = zombieType === "zombie3" ? 3000 : 2000;
    this.time.delayedCall(fallbackTime, () => {
      if (zombie.scene && zombie.active) {
        zombie.destroy();
      }
    });
  }
  private showZombieHealthBar(
    zombie: Phaser.GameObjects.Sprite,
    currentHealth: number,
    maxHealth: number
  ): void {
    // Check if zombie already has a health bar
    let healthBar = (zombie as any).healthBar;
    let healthBarBg = (zombie as any).healthBarBg;

    if (!healthBar) {
      // Create health bar background
      healthBarBg = this.add.graphics();
      healthBarBg.fillStyle(GameSettings.game.health.zombie.backgroundColor);
      healthBarBg.fillRect(
        0,
        0,
        GameSettings.game.health.zombie.barWidth,
        GameSettings.game.health.zombie.barHeight
      );
      healthBarBg.setDepth(100);

      // Create health bar
      healthBar = this.add.graphics();
      healthBar.setDepth(101);

      // Store references on zombie
      (zombie as any).healthBar = healthBar;
      (zombie as any).healthBarBg = healthBarBg;
    }

    // Update health bar
    healthBar.clear();
    const healthPercentage = currentHealth / maxHealth;
    const healthWidth =
      GameSettings.game.health.zombie.barWidth * healthPercentage;

    healthBar.fillStyle(GameSettings.game.health.zombie.healthColor);
    healthBar.fillRect(
      0,
      0,
      healthWidth,
      GameSettings.game.health.zombie.barHeight
    );

    // Position health bars above zombie
    const barX = zombie.x - GameSettings.game.health.zombie.barWidth / 2;
    const barY = zombie.y + GameSettings.game.health.zombie.barOffsetY;

    healthBarBg.setPosition(barX, barY);
    healthBar.setPosition(barX, barY);

    // Make health bars visible
    healthBarBg.setVisible(true);
    healthBar.setVisible(true);

    // Auto-hide health bar after 3 seconds if zombie is at full health
    if (currentHealth === maxHealth) {
      this.time.delayedCall(3000, () => {
        this.hideZombieHealthBar(zombie);
      });
    }
  }

  private hideZombieHealthBar(zombie: Phaser.GameObjects.Sprite): void {
    const healthBar = (zombie as any).healthBar;
    const healthBarBg = (zombie as any).healthBarBg;

    if (healthBar) {
      healthBar.setVisible(false);
    }
    if (healthBarBg) {
      healthBarBg.setVisible(false);
    }
  }

  private updateZombieHealthBars(): void {
    // Update health bar positions for all zombies
    this.zombies.children.entries.forEach((zombie) => {
      const gameObject = zombie as Phaser.GameObjects.Sprite;
      const healthBar = (gameObject as any).healthBar;
      const healthBarBg = (gameObject as any).healthBarBg;

      if (healthBar && healthBarBg && healthBar.visible) {
        // Update position to follow zombie
        const barX =
          gameObject.x - GameSettings.game.health.zombie.barWidth / 2;
        const barY = gameObject.y + GameSettings.game.health.zombie.barOffsetY;

        healthBarBg.setPosition(barX, barY);
        healthBar.setPosition(barX, barY);
      }
    });
  }

  private updateZombieBehavior(): void {
    // Update behavior for all zombies
    this.zombies.children.entries.forEach((zombie) => {
      const gameObject = zombie as Phaser.GameObjects.Sprite;
      const zombieBody = gameObject.body as Phaser.Physics.Arcade.Body;

      if (!zombieBody || (gameObject as any).isDead) return;

      // Always move towards player
      const playerX = this.player.x;
      const playerY = this.player.y;
      const zombieX = gameObject.x;
      const zombieY = gameObject.y;

      // Calculate direction towards player
      const directionX = playerX - zombieX;
      const directionY = playerY - zombieY;
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      // Get zombie type and specific behavior
      const zombieType = (gameObject as any).zombieType || "zombie1";

      // Get speed based on zombie type
      let speed = (gameObject as any).currentSpeed;
      if (!speed) {
        if (zombieType === "zombie1") {
          speed = GameSettings.game.zombies.zombie1.speed;
        } else if (zombieType === "zombie2") {
          speed = GameSettings.game.zombies.zombie2.speed;
        } else if (zombieType === "zombie3") {
          speed = GameSettings.game.zombies.zombie3.speed;
        } else {
          speed = GameSettings.game.zombies.zombie1.speed; // fallback
        }
      }

      if (distance > 10) {
        // Avoid jittering when very close
        // Normalize direction and apply speed
        const normalizedX = directionX / distance;
        const normalizedY = directionY / distance;

        // Apply velocity towards player
        // Zombie3 moves faster and more aggressively
        if (zombieType === "zombie3") {
          zombieBody.setVelocity(
            normalizedX * speed * 0.9, // 90% speed horizontally (more aggressive)
            normalizedY * speed // Full speed vertically
          );
        } else {
          zombieBody.setVelocity(
            normalizedX * speed * 0.7, // 70% speed horizontally
            normalizedY * speed // Full speed vertically
          );
        }
      } else {
        // Stop when very close to player
        zombieBody.setVelocity(0, 0);
      }

      // Reset slow effect after some time
      if ((gameObject as any).isSlowed) {
        const slowedTime = (gameObject as any).slowedTime || 0;
        (gameObject as any).slowedTime = slowedTime + 16; // Assuming 60fps

        if (slowedTime > 1000) {
          // 1 second
          (gameObject as any).isSlowed = false;
          (gameObject as any).currentSpeed = (gameObject as any).originalSpeed;
          (gameObject as any).slowedTime = 0;
        }
      }
    });
  }

  private evaluateMathExpression(
    expression: string,
    currentPlayerCount: number
  ): number {
    // Evaluate simple math expressions with the current player count
    // Operations: addition (a+b), subtraction (a-b), multiplication (X2), division (/2)
    // Special: skull (💀) = instant death
    // Results are clamped between 1 and 10 players

    // Handle skull (instant death)
    if (expression === "💀") {
      console.log(`💀 SKULL HIT! Instant death!`);
      return -999; // Special value to indicate instant death
    }

    let result = currentPlayerCount;

    if (expression.includes("+")) {
      // Addition: sum the two numbers and add to current count
      const parts = expression.split("+");
      const sum = parseInt(parts[0]) + parseInt(parts[1]);
      result = currentPlayerCount + sum;
      console.log(
        `  Addition: ${currentPlayerCount} + (${parts[0]}+${parts[1]}) = ${currentPlayerCount} + ${sum} = ${result}`
      );
    } else if (expression.includes("-")) {
      // Subtraction: calculate the result and use it as the change amount
      const parts = expression.split("-");
      const difference = parseInt(parts[0]) - parseInt(parts[1]);
      result = currentPlayerCount + difference; // Add the difference (can be negative)
      console.log(
        `  Subtraction: ${currentPlayerCount} + (${parts[0]}-${parts[1]}) = ${currentPlayerCount} + ${difference} = ${result}`
      );
    } else if (expression.startsWith("X")) {
      // Multiplication: multiply current count by the number
      const multiplier = parseInt(expression.substring(1));
      result = currentPlayerCount * multiplier;
      console.log(
        `  Multiplication: ${currentPlayerCount} X ${multiplier} = ${result}`
      );
    } else if (expression.startsWith("/")) {
      // Division: divide current count by the number (round up)
      const divisor = parseInt(expression.substring(1));
      result = Math.ceil(currentPlayerCount / divisor);
      console.log(
        `  Division: ${currentPlayerCount} / ${divisor} = ${result} (rounded up)`
      );
    }

    // Clamp result between 1 and 10
    const finalResult = Math.max(1, Math.min(10, result));

    console.log(
      `✅ Final result: ${currentPlayerCount} → ${finalResult} (change: ${
        finalResult - currentPlayerCount
      })`
    );

    return finalResult;
  }

  private playerHitPortal(player: any, portal: any): void {
    // NOTE: Only the main player (this.player) can activate portals.
    // Additional players from multipliers cannot interact with portals to avoid conflicts.
    const playerSprite = player as Phaser.GameObjects.Sprite;
    const portalGraphics = portal as Phaser.GameObjects.Graphics;

    // Trigger haptic feedback for portal interaction
    this.triggerHapticFeedback();

    console.log(`🎯 PORTAL COLLISION DETECTED!`);
    console.log(
      `  Player position: (${playerSprite.x.toFixed(
        1
      )}, ${playerSprite.y.toFixed(1)})`
    );
    console.log(
      `  Portal position: (${portalGraphics.x.toFixed(
        1
      )}, ${portalGraphics.y.toFixed(1)})`
    );

    // Get portal data from properties
    const mathOperation = (portalGraphics as any).mathOperation;
    const portalLine = (portalGraphics as any).portalLine;
    const portalIndex = (portalGraphics as any).portalIndex;

    console.log(
      `  Portal operation: "${mathOperation?.expression || "UNKNOWN"}"`
    );
    console.log(`  Portal index: ${portalIndex}, Portal line: ${portalLine}`);

    // Check if this portal has already been activated
    if ((portalGraphics as any).activated) {
      console.log(`⚠️ Portal already activated, ignoring collision`);
      return;
    }

    if (!mathOperation) {
      console.error("❌ No math operation found for portal");
      return;
    }

    // Check if this portal line has already been used
    if (this.portalLineUsed && portalLine === this.currentPortalLine) {
      console.log(
        `⚠️ Portal line ${portalLine} already used, ignoring portal ${portalIndex}`
      );
      return;
    }

    // Mark this portal as activated and the line as used
    (portalGraphics as any).activated = true;
    this.portalLineUsed = true;

    // Increment portals activated counter
    this.portalsActivated++;

    console.log(
      `🌟 PORTAL ACTIVATED: ${mathOperation.expression}! (Line: ${portalLine}, Index: ${portalIndex})`
    );
    console.log(
      `👥 Current player count before effect: ${this.currentPlayerCount}`
    );

    // Evaluate the complex math expression with current player count
    const newPlayerCount = this.evaluateMathExpression(
      mathOperation.expression,
      this.currentPlayerCount
    );

    console.log(
      `🧮 Math evaluation: ${mathOperation.expression} with ${this.currentPlayerCount} players = ${newPlayerCount}`
    );

    // Check for instant death (skull) - trigger game over
    if (newPlayerCount === -999) {
      console.log(`💀 SKULL PORTAL HIT! Game Over!`);
      this.handleGameOver();
      return;
    }

    // Apply the new player count
    if (newPlayerCount > this.currentPlayerCount) {
      // Add players
      const playersToAdd = newPlayerCount - this.currentPlayerCount;
      this.addPlayers(playersToAdd);
      console.log(`➕ Added ${playersToAdd} players`);
    } else if (newPlayerCount < this.currentPlayerCount) {
      // Remove players
      const playersToRemove = this.currentPlayerCount - newPlayerCount;
      this.subtractPlayers(playersToRemove);
      console.log(`➖ Removed ${playersToRemove} players`);
    } else {
      console.log(`🔄 Player count unchanged (${newPlayerCount})`);
    }

    console.log(
      `👥 Current player count after effect: ${this.currentPlayerCount}`
    );

    // Visual feedback - change portal opacity to show it was activated
    const valueText = (portalGraphics as any).valueText;
    if (valueText) {
      valueText.setAlpha(0.5); // Make text semi-transparent
    }
    portalGraphics.setAlpha(0.5); // Make portal semi-transparent

    // Disable all other portals in this line
    this.disableOtherPortalsInLine(portalLine, portalIndex);

    console.log(
      `✅ Portal ${mathOperation.expression} activated and line ${portalLine} disabled`
    );
  }

  private disableOtherPortalsInLine(
    portalLine: number,
    activatedPortalIndex: number
  ): void {
    // Find and disable all other portals in the same line
    this.powerPortals.children.entries.forEach((portal: any) => {
      const portalGraphics = portal as Phaser.GameObjects.Graphics;
      const currentPortalLine = (portalGraphics as any).portalLine;
      const currentPortalIndex = (portalGraphics as any).portalIndex;

      // If it's the same line but different portal, disable it
      if (
        currentPortalLine === portalLine &&
        currentPortalIndex !== activatedPortalIndex
      ) {
        (portalGraphics as any).activated = true; // Mark as activated to prevent future activations

        // Visual feedback - make it very transparent
        const valueText = (portalGraphics as any).valueText;
        if (valueText) {
          valueText.setAlpha(0.3);
        }
        portalGraphics.setAlpha(0.3);

        console.log(
          `🚫 Disabled portal ${currentPortalIndex} in line ${portalLine}`
        );
      }
    });
  }

  private destroyPortalSet(triggerPortal: Phaser.GameObjects.Graphics): void {
    // Find all portals that are at the same Y position (same set)
    const triggerY = triggerPortal.y;
    const tolerance = 50; // Tolerance for Y position matching

    const portalsToDestroy: Phaser.GameObjects.Graphics[] = [];

    this.powerPortals.children.entries.forEach((portal: any) => {
      const portalGraphics = portal as Phaser.GameObjects.Graphics;
      if (Math.abs(portalGraphics.y - triggerY) < tolerance) {
        portalsToDestroy.push(portalGraphics);
      }
    });

    // Destroy all portals in the set
    portalsToDestroy.forEach((portal) => {
      // Destroy the text if it exists
      const valueText = (portal as any).valueText;
      if (valueText && valueText.active) {
        valueText.destroy();
      }

      // Remove from group and destroy
      this.powerPortals.remove(portal);
      portal.destroy();
    });
  }

  private multiplyPlayers(multiplier: number): void {
    const targetCount = Math.min(
      this.currentPlayerCount * multiplier,
      GameSettings.game.powerPortals.maxPlayers
    );
    const playersToAdd = targetCount - this.currentPlayerCount;

    for (let i = 0; i < playersToAdd; i++) {
      this.addSinglePlayer();
    }

    console.log(
      `🚀 Players multiplied by ${multiplier}! Now: ${this.currentPlayerCount} players`
    );
  }

  private addPlayers(addition: number): void {
    console.log(`🔍 ADD PLAYERS DEBUG START`);
    console.log(`  Requested addition: ${addition}`);
    console.log(`  Current count before: ${this.currentPlayerCount}`);
    console.log(`  Current sprites array length: ${this.playerSprites.length}`);

    const targetCount = Math.min(
      this.currentPlayerCount + addition,
      GameSettings.game.powerPortals.maxPlayers
    );
    const playersToAdd = targetCount - this.currentPlayerCount;

    console.log(`  Target count: ${targetCount}`);
    console.log(`  Players to actually add: ${playersToAdd}`);

    for (let i = 0; i < playersToAdd; i++) {
      this.addSinglePlayer();
    }

    console.log(`  Current count after: ${this.currentPlayerCount}`);
    console.log(
      `  Current sprites array length after: ${this.playerSprites.length}`
    );
    console.log(`🔍 ADD PLAYERS DEBUG END`);

    console.log(
      `➕ Added ${addition} players! Now: ${this.currentPlayerCount} players`
    );
  }

  private dividePlayers(divisor: number): void {
    const targetCount = Math.max(
      1,
      Math.floor(this.currentPlayerCount / divisor)
    );
    const playersToRemove = this.currentPlayerCount - targetCount;

    for (let i = 0; i < playersToRemove; i++) {
      this.removeSinglePlayer();
    }

    console.log(
      `➗ Players divided by ${divisor}! Now: ${this.currentPlayerCount} players`
    );
  }

  private subtractPlayers(subtraction: number): void {
    console.log(`🔍 SUBTRACT PLAYERS DEBUG START`);
    console.log(`  Requested subtraction: ${subtraction}`);
    console.log(`  Current count before: ${this.currentPlayerCount}`);
    console.log(`  Current sprites array length: ${this.playerSprites.length}`);

    const targetCount = Math.max(1, this.currentPlayerCount - subtraction);
    const playersToRemove = this.currentPlayerCount - targetCount;

    console.log(`  Target count: ${targetCount}`);
    console.log(`  Players to actually remove: ${playersToRemove}`);

    for (let i = 0; i < playersToRemove; i++) {
      this.removeSinglePlayer();
    }

    console.log(`  Current count after: ${this.currentPlayerCount}`);
    console.log(
      `  Current sprites array length after: ${this.playerSprites.length}`
    );
    console.log(`🔍 SUBTRACT PLAYERS DEBUG END`);

    console.log(
      `➖ Removed ${subtraction} players! Now: ${this.currentPlayerCount} players`
    );
  }

  private addSinglePlayer(): void {
    if (this.currentPlayerCount >= GameSettings.game.powerPortals.maxPlayers) {
      return;
    }

    const spacing = 30; // Spacing between players
    const baseX = this.player.x; // Use current main player position
    const baseY = this.player.y; // Base Y level

    // Create formation pattern prioritizing sides and up
    let offsetX = 0;
    let offsetY = 0;

    switch (this.currentPlayerCount) {
      case 1: // First additional player - to the right
        offsetX = spacing;
        offsetY = 0;
        break;
      case 2: // Second additional - to the left
        offsetX = -spacing;
        offsetY = 0;
        break;
      case 3: // Third - above center
        offsetX = 0;
        offsetY = -spacing;
        break;
      case 4: // Fourth - above right
        offsetX = spacing;
        offsetY = -spacing;
        break;
      case 5: // Fifth - above left
        offsetX = -spacing;
        offsetY = -spacing;
        break;
      case 6: // Sixth - far right
        offsetX = spacing * 2;
        offsetY = 0;
        break;
      case 7: // Seventh - far left
        offsetX = -spacing * 2;
        offsetY = 0;
        break;
      default: // Fallback for more players - spread in layers
        const layer = Math.floor((this.currentPlayerCount - 1) / 3);
        const posInLayer = (this.currentPlayerCount - 1) % 3;
        offsetY = -layer * spacing;
        offsetX = (posInLayer - 1) * spacing;
        break;
    }

    // Create new player sprite in formation
    const newPlayer = this.add.sprite(
      baseX + offsetX,
      baseY + offsetY,
      "player-idle",
      0
    );

    newPlayer.setScale(GameSettings.spriteScales.player);
    newPlayer.setDepth(50);
    newPlayer.play("player-idle");

    this.physics.add.existing(newPlayer);
    const body = newPlayer.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(false);
      body.setDrag(300);
    }

    this.playerSprites.push(newPlayer);

    // Create weapon for new player
    this.createWeaponForPlayer(newPlayer);

    this.currentPlayerCount++;
    console.log(
      `    🔸 addSinglePlayer: count incremented to ${this.currentPlayerCount}, sprites: ${this.playerSprites.length}`
    );
  }

  private removeSinglePlayer(): void {
    if (this.currentPlayerCount <= 1) return; // Always keep at least one player

    // Remove last player (not the main one)
    const playerToRemove = this.playerSprites.pop();
    const weaponToRemove = this.playerWeapons.pop();

    if (playerToRemove && playerToRemove !== this.player) {
      playerToRemove.destroy();
    }

    if (weaponToRemove && weaponToRemove !== this.playerWeapon) {
      weaponToRemove.destroy();
    }

    this.currentPlayerCount--;
    console.log(
      `    🔸 removeSinglePlayer: count decremented to ${this.currentPlayerCount}, sprites: ${this.playerSprites.length}`
    );
  }

  private createWeaponForPlayer(player: Phaser.GameObjects.Sprite): void {
    const currentWeaponConfig = (GameSettings.game.weapons.types as any)[
      this.currentWeapon
    ];
    const weaponSpriteConfig = GameSettings.game.weapons.spriteSheet;

    const frameIndex =
      currentWeaponConfig.spriteRow * weaponSpriteConfig.columns +
      currentWeaponConfig.spriteCol;

    const weapon = this.add.image(
      player.x + GameSettings.game.player.weapon.offsetX,
      player.y + GameSettings.game.player.weapon.offsetY,
      "weapons",
      frameIndex
    );

    weapon.setScale(GameSettings.spriteScales.weapons);
    weapon.setRotation(GameSettings.game.player.weapon.rotation);
    weapon.setDepth(49);

    this.playerWeapons.push(weapon);
  }

  private explodeZombie(zombie: Phaser.GameObjects.Sprite): void {
    const zombieType = (zombie as any).zombieType || "zombie1";
    let explosionDamage: number;
    let explosionRadius: number;

    // Get explosion properties based on zombie type
    if (zombieType === "zombie1") {
      explosionDamage = GameSettings.game.zombies.zombie1.explosionDamage;
      explosionRadius = GameSettings.game.zombies.zombie1.explosionRadius;
    } else if (zombieType === "zombie2") {
      explosionDamage = GameSettings.game.zombies.zombie2.explosionDamage;
      explosionRadius = GameSettings.game.zombies.zombie2.explosionRadius;
    } else if (zombieType === "zombie3") {
      explosionDamage = GameSettings.game.zombies.zombie3.explosionDamage;
      explosionRadius = GameSettings.game.zombies.zombie3.explosionRadius;
    } else if (zombieType === "zombie4") {
      explosionDamage = GameSettings.game.zombies.zombie4.explosionDamage;
      explosionRadius = GameSettings.game.zombies.zombie4.explosionRadius;
    } else {
      // Fallback
      explosionDamage = 1;
      explosionRadius = 30;
    }

    console.log(
      `💥 ${zombieType} exploding! Damage: ${explosionDamage}, Radius: ${explosionRadius}`
    );

    // Create visual explosion effect (larger for zombie3)
    const explosion = this.add.graphics();
    explosion.setPosition(zombie.x, zombie.y);
    explosion.setDepth(200);

    // Draw explosion circle with gradient effect
    const colors =
      zombieType === "zombie4"
        ? [0xff6600, 0xff8800, 0xffaa00, 0xffcc44, 0xffee88] // Giant orange explosion
        : zombieType === "zombie3"
        ? [0xff0000, 0xff4444, 0xff8888, 0xffaaaa] // Red explosion for zombie3
        : [0xff6666, 0xff9999]; // Smaller explosion for zombie1/2

    for (let i = 0; i < colors.length; i++) {
      const radius = (explosionRadius / colors.length) * (colors.length - i);
      explosion.fillStyle(colors[i], 0.7 - i * 0.15);
      explosion.fillCircle(0, 0, radius);
    }

    // Animate explosion
    this.tweens.add({
      targets: explosion,
      scaleX:
        zombieType === "zombie4" ? 2.0 : zombieType === "zombie3" ? 1.5 : 1.2,
      scaleY:
        zombieType === "zombie4" ? 2.0 : zombieType === "zombie3" ? 1.5 : 1.2,
      alpha: 0,
      duration:
        zombieType === "zombie4" ? 800 : zombieType === "zombie3" ? 500 : 300,
      ease: "Power2",
      onComplete: () => {
        explosion.destroy();
      },
    });

    // Check if player is within explosion radius
    const playerDistance = Phaser.Math.Distance.Between(
      zombie.x,
      zombie.y,
      this.player.x,
      this.player.y
    );

    if (playerDistance <= explosionRadius) {
      // Apply damage to player
      this.playerHealth -= explosionDamage;
      this.updatePlayerHealthBar();

      // Player hit effect (stronger for zombie3)
      this.player.setTint(zombieType === "zombie3" ? 0xff0000 : 0xff6666);
      this.time.delayedCall(zombieType === "zombie3" ? 300 : 150, () => {
        this.player.clearTint();
      });

      // Check if player died - trigger game over
      if (this.playerHealth <= 0) {
        this.playerHealth = 0;
        this.updatePlayerHealthBar();
        this.handleGameOver();
        return;
      }
    } else {
      console.log(
        `💥 Player outside explosion radius: ${playerDistance.toFixed(
          1
        )} > ${explosionRadius}`
      );
    }

    // Damage other zombies in radius (only for zombie3 for now to avoid chaos)
    if (zombieType === "zombie3") {
      this.zombies.children.entries.forEach((otherZombie) => {
        const otherZombieSprite = otherZombie as Phaser.GameObjects.Sprite;
        if (otherZombieSprite === zombie || (otherZombieSprite as any).isDead)
          return;

        const distance = Phaser.Math.Distance.Between(
          zombie.x,
          zombie.y,
          otherZombieSprite.x,
          otherZombieSprite.y
        );

        if (distance <= explosionRadius * 0.7) {
          // Smaller radius for zombie damage

          // Apply damage to other zombie
          const zombieHealth = (otherZombieSprite as any).health || 1;
          (otherZombieSprite as any).health = Math.max(0, zombieHealth - 2);

          // Play hit animation
          const otherZombieType =
            (otherZombieSprite as any).zombieType || "zombie1";
          otherZombieSprite.play(`${otherZombieType}-hit`);
          otherZombieSprite.once("animationcomplete", () => {
            if (
              otherZombieSprite.active &&
              !(otherZombieSprite as any).isDead
            ) {
              otherZombieSprite.play(`${otherZombieType}-run`);
            }
          });

          // Visual effect on damaged zombie
          otherZombieSprite.setTint(0xff4444);
          this.time.delayedCall(300, () => {
            if (otherZombieSprite.active) {
              otherZombieSprite.clearTint();
            }
          });

          // Kill zombie if health reaches 0
          if ((otherZombieSprite as any).health <= 0) {
            this.killZombie(otherZombieSprite);
          }
        }
      });
    }
  }

  private explodeZombie3(zombie: Phaser.GameObjects.Sprite): void {
    const explosionDamage = GameSettings.game.zombies.zombie3.explosionDamage;
    const explosionRadius = GameSettings.game.zombies.zombie3.explosionRadius;

    // Create visual explosion effect
    const explosion = this.add.graphics();
    explosion.setPosition(zombie.x, zombie.y);
    explosion.setDepth(200);

    // Draw explosion circle with gradient effect
    const colors = [0xff0000, 0xff4444, 0xff8888, 0xffaaaa];
    for (let i = 0; i < colors.length; i++) {
      const radius = (explosionRadius / colors.length) * (colors.length - i);
      explosion.fillStyle(colors[i], 0.7 - i * 0.15);
      explosion.fillCircle(0, 0, radius);
    }

    // Animate explosion
    this.tweens.add({
      targets: explosion,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        explosion.destroy();
      },
    });

    // Check if player is within explosion radius
    const playerDistance = Phaser.Math.Distance.Between(
      zombie.x,
      zombie.y,
      this.player.x,
      this.player.y
    );

    if (playerDistance <= explosionRadius) {
      // Apply damage to player
      this.playerHealth -= explosionDamage;
      this.updatePlayerHealthBar();

      // Player hit effect
      this.player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        this.player.clearTint();
      });

      // Check if player died - trigger game over
      if (this.playerHealth <= 0) {
        this.playerHealth = 0;
        this.updatePlayerHealthBar();
        this.handleGameOver();
        return;
      }
    }

    // Damage other zombies in radius (chain explosions would be cool but might be too OP)
    this.zombies.children.entries.forEach((otherZombie) => {
      const otherZombieSprite = otherZombie as Phaser.GameObjects.Sprite;
      if (otherZombieSprite === zombie || (otherZombieSprite as any).isDead)
        return;

      const distance = Phaser.Math.Distance.Between(
        zombie.x,
        zombie.y,
        otherZombieSprite.x,
        otherZombieSprite.y
      );

      if (distance <= explosionRadius * 0.7) {
        // Smaller radius for zombie damage
        console.log(
          `💥 Zombie caught in explosion! Distance: ${distance.toFixed(1)}`
        );

        // Apply damage to other zombie
        const zombieHealth = (otherZombieSprite as any).health || 1;
        (otherZombieSprite as any).health = Math.max(0, zombieHealth - 2);

        // Play hit animation
        const otherZombieType =
          (otherZombieSprite as any).zombieType || "zombie1";
        otherZombieSprite.play(`${otherZombieType}-hit`);
        otherZombieSprite.once("animationcomplete", () => {
          if (otherZombieSprite.active && !(otherZombieSprite as any).isDead) {
            otherZombieSprite.play(`${otherZombieType}-run`);
          }
        });

        // Visual effect on damaged zombie
        otherZombieSprite.setTint(0xff4444);
        this.time.delayedCall(300, () => {
          if (otherZombieSprite.active) {
            otherZombieSprite.clearTint();
          }
        });

        // Kill zombie if health reaches 0
        if ((otherZombieSprite as any).health <= 0) {
          this.killZombie(otherZombieSprite);
        }
      }
    });
  }

  // Zombie2 Tank Shield System
  private initializeZombie2Shield(zombie: Phaser.GameObjects.Sprite): void {
    const config = GameSettings.game.zombies.zombie2.shield;

    // Initialize permanent shield state
    this.zombie2ShieldStates.set(zombie, true);
    this.zombie2ShieldTimers.set(zombie, this.time.now);

    // Create shield visual effect
    const shieldGraphics = this.add.graphics();
    shieldGraphics.setDepth(zombie.depth + 1);
    this.zombie2ShieldGraphics.set(zombie, shieldGraphics);

    // Update shield visual immediately
    this.updateZombie2ShieldVisual(zombie);

    console.log(
      `🛡️ Zombie2 PERMANENT shield initialized - Only rocket launcher can break it!`
    );
  }

  private updateZombie2ShieldVisual(zombie: Phaser.GameObjects.Sprite): void {
    const shieldGraphics = this.zombie2ShieldGraphics.get(zombie);
    const isShielded = this.zombie2ShieldStates.get(zombie);
    const config = GameSettings.game.zombies.zombie2.shield;

    if (!shieldGraphics || !zombie.active) return;

    shieldGraphics.clear();
    shieldGraphics.setPosition(zombie.x, zombie.y);

    if (isShielded) {
      // Draw poison aura/shield effect
      const radius = (zombie.width * zombie.scaleX) / 2 + 8;
      shieldGraphics.fillStyle(config.color, config.alpha);
      shieldGraphics.fillCircle(0, 0, radius);

      // Add pulsing border effect
      shieldGraphics.lineStyle(2, config.color, 0.8);
      shieldGraphics.strokeCircle(0, 0, radius);
    }
  }

  private updateZombie2ShieldSystem(): void {
    // Simple update for permanent shields - just maintain visuals
    this.zombie2ShieldStates.forEach((isShielded, zombie) => {
      if (!zombie.active || (zombie as any).isDead) {
        this.cleanupZombie2Shield(zombie);
        return;
      }

      // Update visual position as zombie moves
      this.updateZombie2ShieldVisual(zombie);
    });
  }

  private isZombie2Shielded(zombie: Phaser.GameObjects.Sprite): boolean {
    return this.zombie2ShieldStates.get(zombie) || false;
  }

  private cleanupZombie2Shield(zombie: Phaser.GameObjects.Sprite): void {
    // Remove shield graphics
    const shieldGraphics = this.zombie2ShieldGraphics.get(zombie);
    if (shieldGraphics) {
      shieldGraphics.destroy();
    }

    // Clean up maps
    this.zombie2ShieldStates.delete(zombie);
    this.zombie2ShieldTimers.delete(zombie);
    this.zombie2ShieldGraphics.delete(zombie);
  }

  private breakZombie2Shield(zombie: Phaser.GameObjects.Sprite): void {
    // Remove shield state
    this.zombie2ShieldStates.set(zombie, false);

    // Clear shield visual
    const shieldGraphics = this.zombie2ShieldGraphics.get(zombie);
    if (shieldGraphics) {
      shieldGraphics.clear();
    }

    console.log(`💥🛡️ Zombie2 shield DESTROYED by rocket launcher!`);
  }

  // Zombie4 Super Aura System
  private createZombie4Aura(zombie: Phaser.GameObjects.Sprite): void {
    const config = GameSettings.game.zombies.zombie4.aura;

    // Create aura visual effect
    const auraGraphics = this.add.graphics();
    auraGraphics.setDepth(zombie.depth - 1); // Behind zombie but visible
    this.zombie4AuraGraphics.set(zombie, auraGraphics);

    // Update aura visual immediately
    this.updateZombie4AuraVisual(zombie);

    console.log(`✨ Zombie4 SUPER AURA initialized - Ultimate boss power!`);
  }

  private updateZombie4AuraVisual(zombie: Phaser.GameObjects.Sprite): void {
    const auraGraphics = this.zombie4AuraGraphics.get(zombie);
    const config = GameSettings.game.zombies.zombie4.aura;

    if (!auraGraphics || !zombie.active || !config.enabled) return;

    auraGraphics.clear();
    auraGraphics.setPosition(zombie.x, zombie.y);

    // Create pulsing aura effect
    const time = this.time.now * 0.005; // Slow pulsing
    const pulseIntensity = 0.3 + 0.2 * Math.sin(time); // Pulse between 0.3 and 0.5
    const baseRadius = (zombie.width * zombie.scaleX) / 2;

    // Outer glow (larger, more transparent)
    const outerRadius = baseRadius + 25 + 10 * Math.sin(time * 1.5);
    auraGraphics.fillStyle(config.color, pulseIntensity * 0.3);
    auraGraphics.fillCircle(0, 0, outerRadius);

    // Inner glow (smaller, more intense)
    const innerRadius = baseRadius + 15 + 5 * Math.sin(time * 2);
    auraGraphics.fillStyle(config.color, pulseIntensity * 0.6);
    auraGraphics.fillCircle(0, 0, innerRadius);

    // Pulsing border ring
    auraGraphics.lineStyle(3, config.color, pulseIntensity * config.intensity);
    auraGraphics.strokeCircle(0, 0, outerRadius);
  }

  private updateZombie4AuraSystem(): void {
    // Update all zombie4 auras
    this.zombie4AuraGraphics.forEach((auraGraphics, zombie) => {
      if (!zombie.active || (zombie as any).isDead) {
        this.cleanupZombie4Aura(zombie);
        return;
      }

      // Update visual position and effects as zombie moves
      this.updateZombie4AuraVisual(zombie);
    });
  }

  private cleanupZombie4Aura(zombie: Phaser.GameObjects.Sprite): void {
    // Remove aura graphics
    const auraGraphics = this.zombie4AuraGraphics.get(zombie);
    if (auraGraphics) {
      auraGraphics.destroy();
    }

    // Clean up map
    this.zombie4AuraGraphics.delete(zombie);
  }

  private createExplosionEffect(x: number, y: number, radius: number): void {
    // Create visual explosion effect for zombie2 tank
    const explosion = this.add.graphics();
    explosion.setPosition(x, y);
    explosion.setDepth(200);

    // Green explosion colors for tank (poison theme)
    const colors = [0x00ff00, 0x44ff44, 0x88ff88, 0xaaffaa];

    for (let i = 0; i < colors.length; i++) {
      const circleRadius = (radius / colors.length) * (colors.length - i);
      explosion.fillStyle(colors[i], 0.7 - i * 0.15);
      explosion.fillCircle(0, 0, circleRadius);
    }

    // Animate explosion
    this.tweens.add({
      targets: explosion,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        explosion.destroy();
      },
    });
  }

  // Music System
  private setupMusic(): void {
    // Check if music is already playing from MenuScene
    const existingMusic = this.sound.getAllPlaying();
    if (existingMusic.length > 0) {
      debugLog("🎵 Music already playing from MenuScene, taking over...");
      // Take over existing music tracks
      const musicConfig = GameSettings.audio.music;
      musicConfig.tracks.forEach((track) => {
        const existingSound = this.sound.get(track.key);
        if (existingSound) {
          this.musicTracks.push(existingSound);
          if (existingSound.isPlaying) {
            this.currentMusicTrack = existingSound;
            // Find current track index
            this.currentMusicIndex = musicConfig.tracks.findIndex(
              (t) => t.key === track.key
            );
            if (this.currentMusicIndex === -1) this.currentMusicIndex = 0;
          }
        }
      });

      // Set up event listener for current track if found
      if (this.currentMusicTrack) {
        this.currentMusicTrack.once("complete", () => {
          this.currentMusicIndex =
            (this.currentMusicIndex + 1) % this.musicTracks.length;
          this.playNextTrack();
        });
      }
      return;
    }

    // No existing music, set up fresh
    const musicConfig = GameSettings.audio.music;

    // Create sound objects for both tracks
    musicConfig.tracks.forEach((track) => {
      const sound = this.sound.add(track.key, {
        volume: 0, // Start with volume 0 for fade-in
        loop: false, // We'll handle manual looping for alternation
      });
      this.musicTracks.push(sound);
    });

    // Randomize starting track index to alternate songs each game load
    this.currentMusicIndex = Math.floor(
      Math.random() * this.musicTracks.length
    );

    // Start playing the randomly selected track
    this.playNextTrack();

    debugLog(
      `🎵 Music system initialized with ${
        this.musicTracks.length
      } tracks, starting with track ${this.currentMusicIndex + 1}`
    );
  }

  private playNextTrack(): void {
    // Stop current track if playing
    if (this.currentMusicTrack && this.currentMusicTrack.isPlaying) {
      this.currentMusicTrack.stop();
    }

    // Get the next track
    this.currentMusicTrack = this.musicTracks[this.currentMusicIndex];

    if (this.currentMusicTrack) {
      // Set up event listener for when track ends
      this.currentMusicTrack.once("complete", () => {
        // Move to next track
        this.currentMusicIndex =
          (this.currentMusicIndex + 1) % this.musicTracks.length;
        this.playNextTrack();
      });

      // Play the track with fade-in
      this.currentMusicTrack.play();

      // Fade in the volume smoothly over 2 seconds
      this.tweens.add({
        targets: this.currentMusicTrack,
        volume: GameSettings.audio.music.volume,
        duration: 2000, // 2 seconds fade-in
        ease: "Power2.easeOut",
      });

      debugLog(`🎵 Now playing: Track ${this.currentMusicIndex + 1}`);
    }
  }

  private stopMusic(): void {
    if (this.currentMusicTrack && this.currentMusicTrack.isPlaying) {
      this.currentMusicTrack.stop();
    }
  }

  // ========== FARCADE SDK INTEGRATION ==========

  private notifyGameReady(): void {
    try {
      if (window.FarcadeSDK && window.FarcadeSDK.singlePlayer) {
        window.FarcadeSDK.singlePlayer.actions.ready();
        console.log("🎮 Game ready notification sent to Farcade SDK");
      }
    } catch (error) {
      console.warn("Failed to notify SDK of game ready:", error);
    }
  }

  private notifyGameOver(score: number): void {
    try {
      if (window.FarcadeSDK && window.FarcadeSDK.singlePlayer) {
        window.FarcadeSDK.singlePlayer.actions.gameOver({ score });
        console.log(
          `🏁 Game over notification sent to Farcade SDK with score: ${score}`
        );
      }
    } catch (error) {
      console.warn("Failed to notify SDK of game over:", error);
    }
  }

  private triggerHapticFeedback(): void {
    try {
      if (window.FarcadeSDK && window.FarcadeSDK.singlePlayer) {
        window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
      }
    } catch (error) {
      console.warn("Failed to trigger haptic feedback:", error);
    }
  }

  private setupSDKEventListeners(): void {
    try {
      if (window.FarcadeSDK) {
        // Handle play again requests
        window.FarcadeSDK.on("play_again", () => {
          console.log("🔄 Play again requested from SDK");
          this.resetGame();
        });

        // Handle mute/unmute requests
        window.FarcadeSDK.on("toggle_mute", (data: any) => {
          console.log(
            `🔊 Toggle mute requested: ${data.isMuted ? "muted" : "unmuted"}`
          );
          this.setGameMuted(data.isMuted);
        });

        console.log("🔗 SDK event listeners set up");
      }
    } catch (error) {
      console.warn("Failed to set up SDK event listeners:", error);
    }
  }

  private resetGame(): void {
    console.log("🔄 Starting complete game reset...");

    // ========== TIMERS AND SYSTEMS CLEANUP ==========
    // Stop all existing timers
    if (this.zombieSpawnTimer) {
      this.zombieSpawnTimer.destroy();
    }
    if (this.portalSpawnTimer) {
      this.portalSpawnTimer.destroy();
    }

    // Resume physics if paused
    this.physics.resume();

    // ========== GAME STATE RESET ==========
    // Reset all game state to initial values
    this.playerHealth = GameSettings.game.health.player.maxHealth;
    this.score = 0;
    this.zombiesKilled = 0;
    this.difficultyLevel = 1;
    this.gameStartTime = this.time.now;
    this.currentSpawnRate = GameSettings.game.zombies.spawnRate;
    this.currentMaxZombies = GameSettings.game.zombies.maxOnScreen;
    this.lastHordeTime = 0;
    this.portalsActivated = 0;
    this.currentPortalLine = 0;
    this.portalLineUsed = false;
    this.lastZombie4Spawn = 0;
    this.zombie4SpawnCount = 0;
    this.emergencyButtonUsed = false;

    // Reset weapon to default
    this.currentWeapon = "machineGun";

    // ========== MULTIPLE PLAYERS CLEANUP ==========
    console.log(
      `🔄 Resetting players: current count ${this.currentPlayerCount}, sprites: ${this.playerSprites.length}`
    );

    // Destroy all additional players (keep only the main player)
    for (let i = this.playerSprites.length - 1; i > 0; i--) {
      const playerToRemove = this.playerSprites[i];
      if (playerToRemove && playerToRemove !== this.player) {
        playerToRemove.destroy();
      }
    }

    // Destroy all additional weapons (keep only the main weapon)
    for (let i = this.playerWeapons.length - 1; i > 0; i--) {
      const weaponToRemove = this.playerWeapons[i];
      if (weaponToRemove && weaponToRemove !== this.playerWeapon) {
        weaponToRemove.destroy();
      }
    }

    // Reset arrays to contain only main player and weapon
    this.playerSprites = [this.player];
    this.playerWeapons = [this.playerWeapon];
    this.currentPlayerCount = 1;

    // ========== MAIN PLAYER RESET ==========
    // Reset main player position and state to initial values
    this.player.setPosition(
      GameSettings.game.player.startX,
      GameSettings.game.player.startY
    );
    this.player.setTint(0xffffff);
    this.player.play("player-idle");
    this.player.setScale(GameSettings.spriteScales.player);
    this.currentPlayerState = "idle";

    // Reset player physics body
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody) {
      playerBody.setVelocity(0, 0);
      playerBody.setCollideWorldBounds(false);
      playerBody.setDrag(300);
    }

    // ========== WEAPON RESET ==========
    // Update main player weapon to default weapon and position
    const defaultWeaponConfig = GameSettings.game.weapons.types.machineGun;
    const weaponSpriteConfig = GameSettings.game.weapons.spriteSheet;
    const frameIndex =
      defaultWeaponConfig.spriteRow * weaponSpriteConfig.columns +
      defaultWeaponConfig.spriteCol;

    this.playerWeapon.setFrame(frameIndex);
    this.playerWeapon.setPosition(
      this.player.x + GameSettings.game.player.weapon.offsetX,
      this.player.y + GameSettings.game.player.weapon.offsetY
    );
    this.playerWeapon.setScale(GameSettings.spriteScales.weapons);
    this.playerWeapon.setRotation(GameSettings.game.player.weapon.rotation);

    // Update weapon UI to show default weapon as selected
    this.updateWeaponUI();

    console.log(
      `🔄 Players reset: count ${this.currentPlayerCount}, sprites: ${this.playerSprites.length}`
    );

    // ========== GAME OBJECTS CLEANUP ==========
    // Clear all zombies and their associated data
    this.zombies.clear(true, true);
    this.zombieDataMap.clear();

    // Clean up all zombie health bars that might be floating
    this.children.list.forEach((child) => {
      // Remove any orphaned health bar graphics
      if (child instanceof Phaser.GameObjects.Graphics) {
        const graphics = child as Phaser.GameObjects.Graphics;
        // Check if it's a health bar by looking at its depth (health bars use depth 100-101)
        if (graphics.depth >= 100 && graphics.depth <= 101) {
          graphics.destroy();
        }
      }
    });

    // Clear zombie2 shield system
    this.zombie2ShieldStates.clear();
    this.zombie2ShieldTimers.clear();
    this.zombie2ShieldGraphics.forEach((graphics) => graphics.destroy());
    this.zombie2ShieldGraphics.clear();

    // Clear zombie4 aura system
    this.zombie4AuraGraphics.forEach((graphics) => graphics.destroy());
    this.zombie4AuraGraphics.clear();

    // Clear all bullets and projectiles
    this.bullets.clear(true, true);
    this.projectiles.clear(true, true);

    // Clear all portals and their text elements
    this.powerPortals.clear(true, true);

    // Clean up any orphaned portal text elements
    this.children.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text) {
        const text = child as Phaser.GameObjects.Text;
        // Remove portal-related text (check by depth or other properties)
        if (text.depth >= 200 && text.depth <= 220) {
          text.destroy();
        }
      }
    });

    // ========== UI RESET ==========
    // Reset UI to initial state
    this.updateScoreDisplay();
    this.updatePlayerHealthBar();

    // Reset emergency button if it exists
    if (this.emergencyButton) {
      this.emergencyButton.setTint(0xffffff);
      this.emergencyButton.setAlpha(1);
    }

    // ========== MUSIC RANDOMIZATION ==========
    // Randomize music for "Play again" to keep it fresh
    if (this.musicTracks.length > 0) {
      const newRandomIndex = Math.floor(
        Math.random() * this.musicTracks.length
      );
      // Only change if we have more than one track and it's different from current
      if (
        this.musicTracks.length > 1 &&
        newRandomIndex !== this.currentMusicIndex
      ) {
        this.currentMusicIndex = newRandomIndex;
        console.log(
          `🎵 Randomized music for restart: switching to track ${
            this.currentMusicIndex + 1
          }`
        );

        // Stop current track and start the new random one
        if (this.currentMusicTrack && this.currentMusicTrack.isPlaying) {
          this.currentMusicTrack.stop();
        }
        this.playNextTrack();
      }
    }

    // ========== RESTART GAME SYSTEMS ==========
    // Restart spawn timers with initial settings
    this.zombieSpawnTimer = this.time.addEvent({
      delay: this.currentSpawnRate,
      callback: this.spawnZombie,
      callbackScope: this,
      loop: true,
    });

    this.portalSpawnTimer = this.time.addEvent({
      delay: GameSettings.game.powerPortals.spawnRate,
      callback: this.spawnPortalSet,
      callbackScope: this,
      loop: true,
    });

    console.log("🔄 Game reset completed - back to initial state");
  }

  private setGameMuted(isMuted: boolean): void {
    try {
      // Set volume for all music tracks
      this.musicTracks.forEach((track) => {
        if (track) {
          (track as any).volume = isMuted ? 0 : GameSettings.audio.music.volume;
        }
      });

      // Set volume for current music track
      if (this.currentMusicTrack) {
        (this.currentMusicTrack as any).volume = isMuted
          ? 0
          : GameSettings.audio.music.volume;
      }

      console.log(`🔊 Game audio ${isMuted ? "muted" : "unmuted"}`);
    } catch (error) {
      console.warn("Failed to set game muted state:", error);
    }
  }

  private updateWeaponUI(): void {
    // Hide all weapon outlines first
    this.weaponOutlines.forEach((outline) => {
      outline.setVisible(false);
    });

    // Show outline for the current weapon
    const currentOutline = this.weaponOutlines.get(this.currentWeapon);
    if (currentOutline) {
      const uiConfig = GameSettings.game.weapons.ui;
      currentOutline.clear();
      currentOutline.lineStyle(3, uiConfig.selectedOutlineColor);

      // Find the weapon icon to get its position
      const weaponIcon = this.weaponIcons.children.entries.find(
        (icon: any) => icon.weaponKey === this.currentWeapon
      ) as Phaser.GameObjects.Image;

      if (weaponIcon) {
        // Use rounded corners for the selection border
        const cornerRadius = 4;
        currentOutline.strokeRoundedRect(
          weaponIcon.x - (weaponIcon.width * uiConfig.scale) / 2,
          weaponIcon.y - (weaponIcon.height * uiConfig.scale) / 2,
          weaponIcon.width * uiConfig.scale,
          weaponIcon.height * uiConfig.scale,
          cornerRadius
        );
      }

      currentOutline.setVisible(true);
    }
  }

  private handleGameOver(): void {
    console.log(`🏁 Game Over! Final Score: ${this.score}`);

    // Stop zombie spawning
    if (this.zombieSpawnTimer) {
      this.zombieSpawnTimer.destroy();
    }

    // Stop portal spawning
    if (this.portalSpawnTimer) {
      this.portalSpawnTimer.destroy();
    }

    // Stop all game systems
    this.physics.pause();

    // Play player death animation
    this.player.play("player-death");

    // Stop player movement
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody) {
      playerBody.setVelocity(0, 0);
    }

    // Notify SDK of game over
    this.notifyGameOver(this.score);
  }

  private setupResponsiveResize(): void {
    // Handle window resize for better responsiveness on taller screens
    this.scale.on('resize', (gameSize: any, baseSize: any, displaySize: any, resolution: any) => {
      debugLog("🔄 Window resized:", { gameSize, baseSize, displaySize, resolution });
      
      // Recalculate UI positions for new screen size
      this.updateUIPositionsForResize(gameSize.width, gameSize.height);
    });

    // Also listen to orientation changes on mobile
    if (typeof window !== 'undefined') {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          debugLog("📱 Orientation changed, adjusting layout");
          const newWidth = this.scale.gameSize.width;
          const newHeight = this.scale.gameSize.height;
          this.updateUIPositionsForResize(newWidth, newHeight);
        }, 100);
      });
    }

    debugLog("📏 Responsive resize system initialized");
  }

  private updateUIPositionsForResize(width: number, height: number): void {
    // Update header background
    if (this.headerBackground) {
      this.headerBackground.clear();
      this.headerBackground.fillStyle(0x000000, 0.9);
      this.headerBackground.fillRect(0, 0, width, 80);
    }

    // Update score and kills text positions
    const newThirdWidth = width / 3;
    const newTwoThirdsWidth = width * 2 / 3;

    if (this.scoreText) {
      this.scoreText.setPosition(newThirdWidth, 40);
    }
    if ((this as any).scoreNumberText) {
      (this as any).scoreNumberText.setPosition(this.scoreText.x + this.scoreText.width / 2 + 5, this.scoreText.y);
    }
    if (this.killsText) {
      this.killsText.setPosition(newTwoThirdsWidth, 40);
    }
    if ((this as any).killsNumberText) {
      (this as any).killsNumberText.setPosition(this.killsText.x + this.killsText.width / 2 + 5, this.killsText.y);
    }

    // Update emergency button position (keep it in bottom right relative to new size)
    if (this.emergencyButton) {
      const buttonConfig = GameSettings.game.emergencyButton;
      this.emergencyButton.setPosition(width - 50, height - 85); // Adjust from bottom-right
    }

    // Update weapon selector positions (keep them on the left side, relative to new height)
    if (this.weaponIcons && this.weaponIcons.children) {
      const weaponConfig = GameSettings.game.weapons.ui;
      const weaponCount = Object.keys(GameSettings.game.weapons.types).length;
      const weaponIconSize = 32 * weaponConfig.scale;
      const totalWeaponHeight = (weaponCount - 1) * weaponConfig.spacing + weaponIconSize;
      const startY = height - totalWeaponHeight - 50;

      this.weaponIcons.children.entries.forEach((icon: any, index: number) => {
        if (icon && icon.setPosition) {
          const newY = startY + index * weaponConfig.spacing;
          icon.setPosition(50, newY);
        }
      });

      // Update weapon outlines and backgrounds positions
      if (this.weaponOutlines) {
        this.weaponOutlines.forEach((outline: any, weaponKey: string) => {
          const weaponIndex = Object.keys(GameSettings.game.weapons.types).indexOf(weaponKey);
          if (weaponIndex !== -1 && outline.clear) {
            const newY = startY + weaponIndex * weaponConfig.spacing;
            outline.clear();
            if (weaponKey === this.currentWeapon) {
              outline.lineStyle(3, weaponConfig.selectedOutlineColor);
              outline.strokeRoundedRect(50 - weaponIconSize/2, newY - weaponIconSize/2, weaponIconSize, weaponIconSize, 4);
              outline.setVisible(true);
            }
          }
        });
      }

      if (this.weaponBackgrounds) {
        this.weaponBackgrounds.forEach((background: any, weaponKey: string) => {
          const weaponIndex = Object.keys(GameSettings.game.weapons.types).indexOf(weaponKey);
          if (weaponIndex !== -1 && background.clear) {
            const newY = startY + weaponIndex * weaponConfig.spacing;
            const padding = weaponConfig.padding * 1.5;
            background.clear();
            background.fillStyle(weaponConfig.backgroundColor, weaponConfig.backgroundAlpha);
            background.fillRoundedRect(50 - weaponIconSize/2 - padding/2, newY - weaponIconSize/2 - padding/2, weaponIconSize + padding, weaponIconSize + padding, 12);
          }
        });
      }
    }

    debugLog("🎯 UI positions updated for new size:", { width, height });
  }

  shutdown() {
    // Stop music
    this.stopMusic();

    // Cleanup when scene is destroyed
  }
}

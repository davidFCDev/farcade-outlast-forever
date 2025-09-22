import GameSettings from "../config/GameSettings";

export class PreloadScene extends Phaser.Scene {
  private loaderSprite!: Phaser.GameObjects.Sprite;
  private brandText!: Phaser.GameObjects.Container;
  private currentFrame: number = 0;
  private config = GameSettings.loader;

  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    // Load Google Font first
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Load the loader sprite (18 frames animation)
    this.load.spritesheet("loader-sprite", this.config.sprite.url, {
      frameWidth: this.config.sprite.frameWidth,
      frameHeight: this.config.sprite.frameHeight,
    });

        // ========== PRELOAD ALL GAME ASSETS HERE ==========
    // Load the tilemap from external URL (will be configured)
    this.load.tilemapTiledJSON(
      GameSettings.tilemap.key,
      GameSettings.tilemap.jsonUrl || GameSettings.tilemap.jsonPath
    );
    // Create a data URI for the embedded tilemap JSON
    const tilemapDataURI =
      "data:application/json;base64," + btoa(JSON.stringify(ZOMBIE_MAP_DATA));

    // Load the tilemap from data URI
    this.load.tilemapTiledJSON(GameSettings.tilemap.key, tilemapDataURI);

    // Load the tileset image
    this.load.image(
      GameSettings.tilemap.tilesetKey,
      GameSettings.tilemap.tilesetPath
    );

    // Load all game assets
    this.loadPlayerSprites();
    this.loadZombieSprites();
    this.loadWeaponSprites();
    this.loadProjectileSprites();
    this.loadExplosionSprites();
    this.loadEmergencyButton();
    this.loadMusic();

    // Remove progress bar and loading text - load directly
    this.load.on("complete", () => {
      this.loadingComplete();
    });
  }

  create(): void {
    // Set black background
    this.cameras.main.setBackgroundColor(this.config.colors.background);

    // Load Pixelify font and wait for it to load
    if ((window as any).WebFont) {
      (window as any).WebFont.load({
        google: {
          families: ["Pixelify Sans:400,700"],
        },
        active: () => {
          // Font loaded, create content
          this.createGameContent();
        },
        inactive: () => {
          // Fallback if font fails to load
          this.createGameContent();
        },
      });
    } else {
      // No WebFont available, proceed with fallback
      this.createGameContent();
    }
  }

  private createGameContent(): void {
    // Create loader sprite animation
    this.createLoaderAnimation();

    // Create brand text (initially hidden)
    this.createBrandText();

    // Start the loader animation
    this.startLoaderAnimation();
  }

  private createLoaderAnimation(): void {
    // Create the loader sprite
    const centerX = GameSettings.canvas.width / 2;
    const centerY = GameSettings.canvas.height / 2 - 100;

    this.loaderSprite = this.add.sprite(centerX, centerY, "loader-sprite", 0);
    this.loaderSprite.setOrigin(0.5);
    // Scale the sprite to match the original HTML size
    this.loaderSprite.setScale(this.config.sprite.scale);

    // Create animation frames
    const frames = [];
    for (let i = 0; i < this.config.animation.frames; i++) {
      frames.push({ key: "loader-sprite", frame: i });
    }

    // Create animation
    this.anims.create({
      key: "loader-animation",
      frames: frames,
      frameRate: this.config.animation.frameRate,
      repeat: 0,
    });
  }

  private createBrandText(): void {
    // Create container for brand text
    const centerX = GameSettings.canvas.width / 2;
    const brandY = GameSettings.canvas.height / 2 + 220;

    this.brandText = this.add.container(centerX, brandY);

    // Main brand text (HELLBOUND)
    const mainText = this.add.text(0, 0, "HELLBOUND", {
      fontFamily: '"Pixelify Sans", monospace, Arial',
      fontSize: "42px", // Aumentado significativamente para mayor visibilidad
      color: this.config.colors.brandPrimary,
      fontStyle: "bold",
    });
    mainText.setOrigin(0.5);
    mainText.setStroke("#000000", 4);
    mainText.setLetterSpacing(3); // Espaciado entre letras como en HTML

    // Underline effect (ENCIMA de STUDIOS, con margen correcto)
    const underline = this.add.graphics();
    underline.fillStyle(
      parseInt(this.config.colors.brandAccent.replace("#", "0x"))
    );
    underline.fillRoundedRect(-80, 35, 160, 6, 3); // Más espacio desde HELLBOUND
    underline.lineStyle(3, 0x000000);
    underline.strokeRoundedRect(-80, 35, 160, 6, 3);

    // Sub brand text (STUDIOS) - más separado de la línea
    const subText = this.add.text(0, 65, "STUDIOS", {
      fontFamily: '"Pixelify Sans", monospace, Arial',
      fontSize: "24px", // Aumentado proporcionalmente
      color: this.config.colors.brandAccent,
      fontStyle: "bold",
    });
    subText.setOrigin(0.5);
    subText.setStroke("#000000", 3);
    subText.setLetterSpacing(4); // Espaciado entre letras como en HTML

    // Trademark - ajustado para el nuevo tamaño
    const tmText = this.add.text(140, -10, "™", {
      fontFamily: '"Pixelify Sans", monospace, Arial',
      fontSize: "12px", // Ligeramente más grande para proporción
      color: this.config.colors.brandPrimary,
    });
    tmText.setOrigin(0.5);
    tmText.setStroke("#000000", 2);

    // Add all to container
    this.brandText.add([mainText, underline, subText, tmText]);

    // Initially invisible
    this.brandText.setAlpha(0);
    this.brandText.setScale(0.98);
    this.brandText.y += 8;
  }

  private startLoaderAnimation(): void {
    // Play the sprite animation
    this.loaderSprite.play("loader-animation");

    // When animation completes, show brand text
    this.loaderSprite.on("animationcomplete", () => {
      this.showBrandText();
    });
  }

  private showBrandText(): void {
    const brandY = GameSettings.canvas.height / 2 + 220;

    // Animate brand text appearance
    this.tweens.add({
      targets: this.brandText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: brandY,
      duration: this.config.brandText.fadeInDuration,
      ease: "Back.easeOut",
      onComplete: () => {
        // Wait then hide and transition
        this.time.delayedCall(this.config.brandText.displayDuration, () => {
          this.hideBrandText();
        });
      },
    });
  }

  private hideBrandText(): void {
    // Fade out brand text
    this.tweens.add({
      targets: this.brandText,
      alpha: 0,
      duration: this.config.brandText.fadeOutDuration,
      ease: "Power2.easeOut",
      onComplete: () => {
        // Transition to menu scene
        this.time.delayedCall(300, () => {
          this.scene.start("MenuScene");
        });
      },
    });
  }

  private loadingComplete(): void {
    // Assets loaded, start game content creation
  }

  // ========== GAME ASSET LOADING METHODS ==========
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

    if (GameSettings.debug) {
      console.log(
        `🎵 Loading ${audioConfig.music.tracks.length} music tracks and sound effects`
      );
    }
  }
}

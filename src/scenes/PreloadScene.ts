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

    // Note: We don't load the loader sprite through Phaser anymore
    // Instead we'll load it manually as an Image in the canvas animation (like test.html)

    // ========== PRELOAD ALL GAME ASSETS HERE ==========
    // Try to load tilemap with fallback strategy
    this.loadTilemapWithFallback();

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
    // Set black background immediately for mobile compatibility
    this.cameras.main.setBackgroundColor(this.config.colors.background);

    // Show loading indicator immediately to avoid gray screen
    this.showImmediateLoadingIndicator();

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
    // Use the same approach as test.html - create a manual canvas-based loader
    this.createCanvasLoader();

    // Start the manual loader animation
    this.startCanvasLoaderAnimation();
  }

  private createCanvasLoader(): void {
    // Clean up temporary loading elements if they exist
    if ((this as any).tempLoadingText) {
      (this as any).tempLoadingText.destroy();
    }
    if ((this as any).tempLoaderCircle) {
      (this as any).tempLoaderCircle.destroy();
    }

    // Create a DOM canvas element for manual sprite animation (like test.html)
    const centerX = GameSettings.canvas.width / 2;
    const centerY = GameSettings.canvas.height / 2 - 100;

    // Get the Phaser game canvas element
    const gameCanvas = this.sys.game.canvas;
    const gameContainer = gameCanvas.parentElement;

    // Create overlay div
    const overlay = document.createElement("div");
    overlay.id = "loader-overlay";
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000000;
      z-index: 9999;
      pointer-events: all;
    `;

    // Create loader content container
    const loaderContent = document.createElement("div");
    loaderContent.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      width: 100%;
    `;

    // Create canvas for manual sprite animation
    const canvas = document.createElement("canvas");
    canvas.id = "loader-canvas";
    canvas.width = this.config.sprite.frameWidth;
    canvas.height = this.config.sprite.frameHeight;

    // Use a more reasonable scale for mobile (similar to test.html)
    const mobileScale = 0.8; // Much smaller than the original 1.5
    canvas.style.cssText = `
      width: ${this.config.sprite.frameWidth * mobileScale}px;
      height: ${this.config.sprite.frameHeight * mobileScale}px;
      image-rendering: pixelated;
      transform-origin: center;
      background: transparent;
      display: block;
    `;

    // Create studio text element (like test.html)
    const studioText = document.createElement("div");
    studioText.id = "studio-text";
    studioText.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: "Pixelify Sans", "Press Start 2P", system-ui, monospace;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 3px 3px 0 #000;
      gap: 6px;
      opacity: 0;
      transform: translateY(8px) scale(0.98);
      transition: opacity 700ms ease, transform 500ms cubic-bezier(0.2, 0.6, 0.2, 1);
      min-height: 80px;
      width: 100%;
    `;

    // Main brand text
    const brandMain = document.createElement("div");
    brandMain.style.cssText = `
      font-size: 24px;
      letter-spacing: 3px;
      line-height: 1;
      color: #ffffff;
      position: relative;
      text-shadow: 2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000,
        2px 2px #000, -2px 2px #000, 2px -2px #000, -2px -2px #000,
        3px 3px 0 #000;
      margin-bottom: 8px;
    `;
    brandMain.textContent = "HELLBOUND";

    // Green line (more robust approach for mobile compatibility)
    const greenLine = document.createElement("div");
    greenLine.style.cssText = `
      width: 160px;
      height: 12px;
      background: linear-gradient(to bottom, #b7ff00 0%, #a0e600 50%, #b7ff00 100%);
      border: 3px solid #000000;
      margin: 8px auto;
      display: block;
      position: relative;
      box-sizing: border-box;
    `;

    // Add inner shadow effect with pseudo-element approach using DOM
    const innerShadow = document.createElement("div");
    innerShadow.style.cssText = `
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      pointer-events: none;
    `;
    greenLine.appendChild(innerShadow);

    // Sub brand text
    const brandSub = document.createElement("div");
    brandSub.style.cssText = `
      font-size: 14px;
      letter-spacing: 4px;
      color: #b7ff00;
      text-shadow: 3px 3px 0 #000, 0 0 10px rgba(183, 255, 0, 0.3);
      line-height: 1;
    `;
    brandSub.textContent = "STUDIOS";

    // Trademark
    const brandTm = document.createElement("span");
    brandTm.style.cssText = `
      position: absolute;
      top: -6px;
      right: -16px;
      font-size: 9px;
      color: #ffffff;
      text-shadow: 2px 2px 0 #000;
      opacity: 0.9;
    `;
    brandTm.textContent = "™";

    // Assemble studio text
    brandMain.appendChild(brandTm);
    studioText.appendChild(brandMain);
    studioText.appendChild(greenLine);
    studioText.appendChild(brandSub); // Assemble DOM structure
    loaderContent.appendChild(canvas);
    loaderContent.appendChild(studioText);
    overlay.appendChild(loaderContent);

    // Add to game container
    if (gameContainer) {
      gameContainer.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    // Store references
    (this as any).loaderOverlay = overlay;
    (this as any).loaderCanvas = canvas;
    (this as any).studioText = studioText;

    console.log("✅ Canvas loader created successfully (test.html approach)");
  }

  private showImmediateLoadingIndicator(): void {
    // Show a simple loading text immediately to avoid gray screen on mobile
    const centerX = GameSettings.canvas.width / 2;
    const centerY = GameSettings.canvas.height / 2;

    // Create temporary loading text
    const loadingText = this.add.text(centerX, centerY, "Loading...", {
      fontFamily: "Arial, monospace",
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    loadingText.setOrigin(0.5);
    loadingText.setAlpha(0.8);

    // Create simple rotating circle as loader
    const loaderCircle = this.add.graphics();
    loaderCircle.lineStyle(4, 0xffffff, 0.8);
    loaderCircle.strokeCircle(0, 0, 30);
    loaderCircle.setPosition(centerX, centerY - 80);

    // Animate the circle rotation
    this.tweens.add({
      targets: loaderCircle,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: "Linear",
    });

    // Store references to clean up later
    (this as any).tempLoadingText = loadingText;
    (this as any).tempLoaderCircle = loaderCircle;
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

  private startCanvasLoaderAnimation(): void {
    const overlay = (this as any).loaderOverlay;
    const canvas = (this as any).loaderCanvas;

    if (!overlay || !canvas) {
      console.error(
        "❌ Canvas loader elements not found, using fallback timing"
      );
      // Fallback timing
      this.time.delayedCall(this.config.animation.duration, () => {
        this.showStudioText();
      });
      return;
    }

    // Use the exact same approach as test.html
    const SPRITE_URL = this.config.sprite.url;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("❌ Could not get 2D context, using fallback timing");
      this.time.delayedCall(this.config.animation.duration, () => {
        this.showStudioText();
      });
      return;
    }

    // Disable image smoothing for pixel art
    if (ctx.imageSmoothingEnabled !== undefined) {
      ctx.imageSmoothingEnabled = false;
    }

    // Constants from test.html approach
    const FRAME_W = this.config.sprite.frameWidth;
    const FRAME_H = this.config.sprite.frameHeight;
    const FRAME_COUNT = this.config.animation.frames;
    const DURATION_MS = this.config.animation.duration;
    const FRAME_MS = Math.floor(DURATION_MS / FRAME_COUNT);

    let frame = 0;

    // Pre-load the sprite image (like test.html)
    const img = new Image();
    img.onload = () => {
      console.log("✅ Loader sprite image loaded, starting animation");

      const draw = () => {
        ctx.clearRect(0, 0, FRAME_W, FRAME_H);
        ctx.drawImage(
          img,
          frame * FRAME_W,
          0,
          FRAME_W,
          FRAME_H,
          0,
          0,
          FRAME_W,
          FRAME_H
        );
      };

      // Draw initial frame
      draw();

      // Start animation
      const interval = setInterval(() => {
        if (frame < FRAME_COUNT - 1) {
          frame += 1;
          draw();
        } else {
          clearInterval(interval);
          console.log("🎬 Loader animation completed");
          // Show studio text (like test.html)
          this.showStudioText();
        }
      }, FRAME_MS);

      // Store interval for cleanup
      (this as any).loaderInterval = interval;
    };

    img.onerror = () => {
      console.error(
        "❌ Failed to load loader sprite image, using fallback timing"
      );
      // Fallback timing if image fails to load
      this.time.delayedCall(this.config.animation.duration, () => {
        this.showStudioText();
      });
    };

    // Start loading the image
    img.src = SPRITE_URL;
    console.log("🖼️ Loading sprite from:", SPRITE_URL);
  }

  private showStudioText(): void {
    const studioText = (this as any).studioText;

    if (!studioText) {
      console.warn("⚠️ Studio text element not found, proceeding to menu");
      this.transitionToMenu();
      return;
    }

    // Show studio text with CSS transition (like test.html)
    studioText.style.opacity = "1";
    studioText.style.transform = "translateY(0) scale(1)";

    console.log("📝 Studio text shown");

    // Hide after delay and transition to menu (like test.html timing)
    setTimeout(() => {
      studioText.style.opacity = "0";
      studioText.style.transform = "translateY(8px) scale(0.98)";

      setTimeout(() => {
        this.transitionToMenu();
      }, 600); // Wait for fade out transition
    }, 1200); // Show for 1.2s like test.html
  }

  private transitionToMenu(): void {
    // Clean up DOM loader overlay
    const overlay = (this as any).loaderOverlay;
    const interval = (this as any).loaderInterval;

    if (interval) {
      clearInterval(interval);
      (this as any).loaderInterval = null;
    }

    if (overlay && overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
      (this as any).loaderOverlay = null;
      (this as any).loaderCanvas = null;
      (this as any).studioText = null;
    }

    console.log("🎮 Transitioning to MenuScene");
    this.scene.start("MenuScene");
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
    // Clean up DOM loader overlay
    const overlay = (this as any).loaderOverlay;
    const interval = (this as any).loaderInterval;
    const studioText = (this as any).studioText;

    if (interval) {
      clearInterval(interval);
      (this as any).loaderInterval = null;
    }

    // Hide studio text with transition (DOM-based)
    if (studioText) {
      studioText.style.opacity = "0";
      studioText.style.transform = "translateY(8px) scale(0.98)";
    }

    // Clean up after transition
    setTimeout(() => {
      // Clean up DOM overlay
      if (overlay && overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
        (this as any).loaderOverlay = null;
        (this as any).loaderCanvas = null;
        (this as any).studioText = null;
      }

      // Transition to menu scene
      this.time.delayedCall(300, () => {
        console.log("🎮 Transitioning to MenuScene");
        this.scene.start("MenuScene");
      });
    }, 600);
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

  private loadTilemapWithFallback(): void {
    console.log("🗺️ Loading tilemap from URL:", GameSettings.tilemap.jsonUrl);

    // First try: Load from external URL
    this.load.tilemapTiledJSON(
      GameSettings.tilemap.key,
      GameSettings.tilemap.jsonUrl
    );

    // Success handler
    this.load.on(
      "filecomplete-tilemapJSON-" + GameSettings.tilemap.key,
      (key: string) => {
        console.log("✅ Tilemap loaded successfully from URL:", key);
      }
    );

    // Error handler with fallback
    this.load.on("loaderror", (file: any) => {
      if (
        file.type === "tilemapJSON" &&
        file.key === GameSettings.tilemap.key
      ) {
        console.error("❌ Failed to load tilemap from URL:", file.src);
        console.log("🔄 Trying fallback to local file...");

        // Try fallback to local file
        this.load.tilemapTiledJSON(
          GameSettings.tilemap.key + "_fallback",
          GameSettings.tilemap.jsonPath
        );
      }
    });
  }
}

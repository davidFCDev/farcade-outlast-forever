import GameSettings from "../config/GameSettings";

export class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;
  private instructionsText!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Image;
  private pulseAnimation!: Phaser.Tweens.Tween;

  // Music system
  private currentMusicTrack: Phaser.Sound.BaseSound | null = null;
  private currentMusicIndex: number = 0;
  private musicTracks: Phaser.Sound.BaseSound[] = [];

  constructor() {
    super({ key: "MenuScene" });
  }

  preload(): void {
    // Load the background image
    this.load.image(
      "menu-background",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/background-idWr7RLl5mHprGNfMxnI6ok1A3lcDa.png?wScm"
    );
  }

  create(): void {
    // Set up background
    this.createBackground();

    // Initialize and start music
    this.setupMusic();

    // Create start button
    this.createStartButton();

    // Create instructions
    this.createInstructions();

    // Set up input handlers
    this.setupInput();
  }

  private createBackground(): void {
    // Add background image and scale to fit canvas
    this.background = this.add.image(
      GameSettings.canvas.width / 2,
      GameSettings.canvas.height / 2,
      "menu-background"
    );

    // Scale to fit the canvas perfectly (2:3 ratio)
    this.background.setDisplaySize(
      GameSettings.canvas.width,
      GameSettings.canvas.height
    );
  }

  private createStartButton(): void {
    // Start button in the center
    this.startButton = this.add.text(
      GameSettings.canvas.width / 2,
      GameSettings.canvas.height / 2,
      "START",
      {
        fontFamily: '"Pixelify Sans", monospace, Arial',
        fontSize: "50px", // Aumentado de 40px a 50px para mayor presencia
        color: "#b7ff00", // Green color matching player health bar
        fontStyle: "bold",
      }
    );
    this.startButton.setOrigin(0.5);
    this.startButton.setStroke("#000000", 4);

    // Make it interactive
    this.startButton.setInteractive({ useHandCursor: true });

    // Add pulsing animation
    this.createPulseAnimation();

    // Button hover effects
    this.startButton.on("pointerover", () => {
      this.startButton.setScale(1.1);
      this.startButton.setColor("#ffffff");
    });

    this.startButton.on("pointerout", () => {
      this.startButton.setScale(1.0);
      this.startButton.setColor("#b7ff00");
    });

    // Button click handler
    this.startButton.on("pointerdown", () => {
      this.startGame();
    });
  }

  private createPulseAnimation(): void {
    // Create a subtle pulsing effect
    this.pulseAnimation = this.tweens.add({
      targets: this.startButton,
      alpha: { from: 1, to: 0.6 },
      duration: 1000,
      ease: "Power2.easeInOut",
      yoyo: true,
      repeat: -1, // Infinite loop
    });
  }

  private createInstructions(): void {
    // Instructions text at the bottom
    const instructionsY = GameSettings.canvas.height * 0.8; // 80% from top

    this.instructionsText = this.add.text(
      GameSettings.canvas.width / 2,
      instructionsY,
      "Survive as long as you can\nMove around and choose your weapon wisely",
      {
        fontFamily: '"Pixelify Sans", monospace, Arial',
        fontSize: "22px", // Aumentado de 18px a 22px
        color: "#ffffff",
        align: "center",
        lineSpacing: 8,
      }
    );
    this.instructionsText.setOrigin(0.5);
    this.instructionsText.setStroke("#000000", 3);
    this.instructionsText.setAlpha(0.9);
  }

  private setupInput(): void {
    // Allow starting with keyboard (Enter or Space)
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.startGame();
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.startGame();
    });

    // Touch/click anywhere to start (fallback)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Only if not clicking the start button (it has its own handler)
      if (!this.startButton.getBounds().contains(pointer.x, pointer.y)) {
        this.startGame();
      }
    });
  }

  private startGame(): void {
    // Stop the pulse animation
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
    }

    // Don't stop music - let GameScene handle music transition
    // Transition to game scene immediately
    this.scene.start("GameScene");
  }

  // Music System
  private setupMusic(): void {
    const musicConfig = GameSettings.audio.music;

    // Create sound objects for both tracks
    musicConfig.tracks.forEach((track) => {
      const sound = this.sound.add(track.key, {
        volume: 0, // Start with volume 0 for fade-in
        loop: false, // We'll handle manual looping for alternation
      });
      this.musicTracks.push(sound);
    });

    // Start playing the first track
    this.playNextTrack();

    if (GameSettings.debug) {
      console.log(
        `🎵 Music system initialized in MenuScene with ${this.musicTracks.length} tracks`
      );
    }
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

      if (GameSettings.debug) {
        console.log(
          `🎵 Now playing in MenuScene: Track ${this.currentMusicIndex + 1}`
        );
      }
    }
  }

  private stopMusic(): void {
    if (this.currentMusicTrack && this.currentMusicTrack.isPlaying) {
      this.currentMusicTrack.stop();
    }
  }

  shutdown() {
    // Music continues to GameScene, don't stop it here
    // The GameScene will take over music management
  }
}

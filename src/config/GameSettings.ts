/**
 * Game Settings for Infinity Zombie Shooter  // Tilemap configuration
  tilemap: {
    width: 12, // tiles in map width
    height: 18, // tiles in map height
    tileWidth: 32, // pixel width of each tile
    tileHeight: 32, // pixel height of each tile
    mapPixelWidth: 384, // 12 * 32
    mapPixelHeight: 576, // 18 * 32
    scaleX: 720 / 384, // Scale to fit screen width (1.875)
    scaleY: 1080 / 576, // Scale to fit screen height (1.875)
    key: "zombie-map",
    // Fallback for local development
    jsonPath: "assets/ZombieMap.json",
    // External URL for production (GitHub Raw)
    jsonUrl:
      "https://raw.githubusercontent.com/davidFCDev/farcade-outlast-forever/refs/heads/main/ZombieMap_optimized.json",
    tilesetKey: "wasteland-tiles",
    tilesetPath: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Wasteland_Tileset_32x32-TTJWbe3kfEBgjxvJ9IkiOuDZhSGLJ6.png?wtEY",
  },figuration for all tunable game parameters
 */

export const GameSettings = {
  debug: false, // Desactivado para mejor rendimiento

  // Global sprite scaling for better visibility
  spriteScales: {
    player: 2.0, // Increased from 1.5 to 2.0
    zombies: 1.75, // Increased from 1.0 to 1.75
    weapons: 2.0, // Match player scale for consistency
    projectiles: 1.5, // Slightly smaller than characters
    explosions: 3.0, // Increased from 2.0 to 3.0 for impact
    effects: 2.0, // General effects scale
  },

  canvas: {
    width: 720,
    height: 1080,
  },

  // Audio configuration
  audio: {
    music: {
      volume: 0.3, // Soft volume (30%)
      tracks: [
        {
          key: "music1",
          path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/music1-e9kIUbkAtOd9lsUp3SwBz9bPdUheCM.mp3?1fiZ",
        },
        {
          key: "music2",
          path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/music2-Ask6hHLYa9tfdxAaOX1nCcGUUvT0no.mp3?kiIg",
        },
      ],
      loop: true, // Each track loops individually
      crossfade: false, // Simple alternation without crossfade
    },
    effects: {
      volume: 0.6, // Sound effects volume (60%)
      explosionButton: {
        key: "explosion-sound",
        path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/explosion-xww5El6YYUT20Zh7mWlg0ya5wNF2iG.mp3?6DYq",
        volume: 0.8, // Slightly louder for impact
      },
    },
  },

  // Tilemap configuration
  tilemap: {
    width: 12, // tiles in map width
    height: 18, // tiles in map height
    tileWidth: 32, // pixel width of each tile
    tileHeight: 32, // pixel height of each tile
    mapPixelWidth: 384, // 12 * 32
    mapPixelHeight: 576, // 18 * 32
    scaleX: 720 / 384, // Scale to fit screen width (1.875)
    scaleY: 1080 / 576, // Scale to fit screen height (1.875)
    key: "zombie-map",
    // Fallback for local development
    jsonPath: "assets/ZombieMap.json",
    // External URL for production (GitHub Raw)
    jsonUrl:
      "https://raw.githubusercontent.com/davidFCDev/farcade-outlast-forever/refs/heads/main/ZombieMap_optimized.json",
    tilesetKey: "wasteland-tiles",
    tilesetPath:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Wasteland_Tileset_32x32-TTJWbe3kfEBgjxvJ9IkiOuDZhSGLJ6.png?wtEY",
  },

  // Game-specific settings for the zombie shooter
  game: {
    // Player settings
    player: {
      // Sprite frame dimensions (calculated from spritesheet)
      frameWidth: 32, // 192px / 6 frames = 32px per frame (idle)
      frameHeight: 32,

      // Game dimensions
      speed: 350, // Increased from 300 to 350 for faster lateral movement
      startX: 360, // Center of screen width
      startY: 1000, // More towards bottom of screen
      minX: 50, // Left boundary
      maxX: 670, // Right boundary (720 - 50)

      // Sprite paths and configurations
      sprites: {
        idle: {
          path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Player_idle-VV9rt0MksX2L7eka3coyl6kTfaHGTN.png?Jw99",
          frameWidth: 32, // 192px / 6 frames
          frameHeight: 32,
          frames: 6,
          frameRate: 8, // Animation speed
        },
        run: {
          path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Player_run-asoc0JmnuedNgyU4Wtym2cYNTOtE8z.png?iLH0",
          frameWidth: 32, // 256px / 8 frames
          frameHeight: 32,
          frames: 8,
          frameRate: 12, // Faster animation for running
        },
        death: {
          path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Player_Death-BRHZltKHanKB2GLxlVFxXI66p1WXjQ.png?F1Tl",
          frameWidth: 32, // 256px / 8 frames
          frameHeight: 32,
          frames: 8,
          frameRate: 6, // Slower animation for death
        },
        hit: {
          path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Player_Hit-SZQ5rhyqUyzNKO3vc8xatBOmT4vJxg.png?APij",
          frameWidth: 32, // 96px / 3 frames
          frameHeight: 32,
          frames: 3,
          frameRate: 10, // Quick hit animation
        },
      },

      // Player weapon visual configuration
      weapon: {
        offsetX: 0, // Horizontal offset from player center
        offsetY: -25, // Vertical offset from player center (above player)
        scale: 1.2, // Scale for weapon sprite
        rotation: -Math.PI / 2, // Point upward (-90 degrees in radians)
      },
    },

    // Zombie settings
    zombies: {
      // Global zombie settings
      frameWidth: 32,
      frameHeight: 32,
      spawnRate: 600, // Much faster spawn rate (reduced from 1200ms)
      maxOnScreen: 15, // More zombies on screen (increased from 8)
      damage: 1, // Damage zombies deal to player

      // Progressive difficulty system
      progressiveDifficulty: {
        enabled: true,
        timeToIncreaseMs: 8000, // Faster progression - every 8 seconds (reduced from 12000)
        spawnRateDecreasePerLevel: 50, // Faster decrease - 50ms each level (reduced from 80)
        minSpawnRate: 200, // Lower minimum for more chaos (reduced from 300)
        maxOnScreenIncreasePerLevel: 3, // More aggressive increase (increased from 2)
        maxZombiesOnScreen: 35, // More zombies maximum (increased from 25)
        hordeMode: {
          enabled: true,
          triggerAfterLevel: 2, // Earlier hordes - level 2 (reduced from 3)
          hordeSize: 8, // Larger hordes - 8 zombies (increased from 5)
          hordeInterval: 10000, // More frequent - 10 seconds (reduced from 15000)
          hordeChance: 0.5, // Increased to 50% chance (increased from 0.35)
        },
      },

      // Zombie Type 1 (Original)
      zombie1: {
        speed: 80,
        maxHealth: 8, // Reduced from 10 to 8 for better balance
        spawnWeight: 60, // 60% spawn rate (increased from 50%)
        explosionDamage: 1, // Small explosion damage
        explosionRadius: 30, // Small explosion radius
        sprites: {
          idle: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie_Idle-aY4d3MVJsAT2Oljz7REk9OHobS40KI.png?luKV",
            frameWidth: 32, // 192px / 6 frames
            frameHeight: 32,
            frames: 6,
            frameRate: 6, // Slow idle animation
          },
          run: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie_run-1JBne1BI3kuVpqzZEpeLsxOwSdqfxh.png?0EmX",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 8, // Moderate run animation
          },
          death: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie_Death%201-6LjIuSFpESDYZGezyBaPTluuuRLFZN.png?m5tn",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 8, // Death animation
          },
          hit: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie_Hit-kNpS4ZXSh5deTen88POxwGPTxWF0hS.png?7uz0",
            frameWidth: 32, // 96px / 3 frames
            frameHeight: 32,
            frames: 3,
            frameRate: 12, // Quick hit animation
          },
        },
      },

      // Zombie Type 2 (Tank - Faster, much stronger and bigger)
      zombie2: {
        speed: 90, // Faster than zombie1 - dangerous tank
        maxHealth: 45, // Reducido salud (era 60, ahora 45)
        spawnWeight: 6, // Reduced spawn rate from 8% to 6% (even rarer)
        scale: 1.3, // Bigger size (30% larger)
        explosionDamage: 4, // Medium explosion damage (more than zombie1, less than zombie3)
        explosionRadius: 50, // Medium explosion radius
        shieldExplosionDamage: 6, // Extra damage if explodes with shield intact
        shield: {
          permanent: true, // Shield is permanent until destroyed by rocket launcher
          color: 0x00ff00, // Green poison aura color
          alpha: 0.15, // More transparent shield (reduced from 0.3)
        },
        sprites: {
          idle: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%202_idle-5qg8V2zB1pXFUVcSECnZoPykACgbmY.png?cnUl",
            frameWidth: 32, // 192px / 6 frames
            frameHeight: 32,
            frames: 6,
            frameRate: 5, // Even slower idle animation
          },
          run: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%202_run-lFm3dj2JE3RNQLl1WNCcfgo7VbHvp2.png?tk5t",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 6, // Slower run animation
          },
          death: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%202_death-PFCJ8U9e636kVjPE8JZaeGFwOH5ZUL.png?ne8m",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 6, // Slower death animation
          },
          hit: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%202_hit-Zch8lrWbvel5VfJ6exUDuh6Ho7ZdrN.png?Kmbx",
            frameWidth: 32, // 96px / 3 frames
            frameHeight: 32,
            frames: 3,
            frameRate: 10, // Hit animation
          },
        },
      },
      zombie3: {
        speed: 170, // Further reduced speed for better balance (was 200, originally 240)
        maxHealth: 28, // Increased health slightly (was 25)
        spawnWeight: 10, // 10% spawn rate (reduced from 15% to reduce frequency)
        explosionDamage: 8, // Much higher explosion damage (was 4)
        explosionRadius: 100, // Area damage radius in pixels
        scale: 2, // Double the size
        sprites: {
          run: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%203_run-aywgdsDmiM2Z4zsOKLvNtxc64KPYv4.png?re0W",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 12, // Fast run animation
          },
          hit: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%203_Hit-JWMH9AM391ErRF0Xhb9yexrNRSNYVX.png?rOQf",
            frameWidth: 32, // 96px / 3 frames
            frameHeight: 32,
            frames: 3,
            frameRate: 15, // Fast hit animation
          },
          death: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie%203_death-YOfA9e8lMML5H3ezDgsnr0gcQKGFSf.png?sw1z",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 10, // Explosion death animation
          },
        },
      },

      // Zombie Type 4 (Boss - Giant slow zombie that appears every 100 kills)
      zombie4: {
        speed: 30, // Very slow movement - giant and heavy
        maxHealth: 400, // Strong but more balanced health pool (reduced from 750)
        spawnWeight: 0, // Special spawn - only appears every 100 kills
        scale: 3, // Huge size - 3x bigger than normal
        explosionDamage: 25, // Massive explosion damage (much more than zombie3's 8)
        explosionRadius: 150, // Large explosion radius
        aura: {
          enabled: true, // Enable special aura effect
          color: 0xff6600, // Orange/red glow
          intensity: 1.5, // Glow intensity
        },
        specialSpawn: {
          killInterval: 100, // Appears every 100 kills
        },
        resistances: {
          // Takes reduced damage from most weapons except sniper
          machineGun: 0.3, // 30% damage (70% resistance)
          pistol: 0.25, // 25% damage (75% resistance)
          shotgun: 0.4, // 40% damage (60% resistance)
          rocketLauncher: 0.6, // 60% damage (40% resistance)
          sniper: 1.0, // 100% damage - no resistance (best weapon)
        },
        sprites: {
          run: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie4_run-PP55FRVTduyMiMXISJiF55TUAARcSp.png?6yCE",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 4, // Very slow animation for giant zombie
          },
          hit: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombie4_hit-t7ViwcujervvifFljJn0mSJqw4NxQK.png?REu1",
            frameWidth: 32, // 96px / 3 frames
            frameHeight: 32,
            frames: 3,
            frameRate: 6, // Slow hit animation
          },
          death: {
            path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Zombi4_death-MIM5f244P9JPDlzOF24l9ldtjvbsUh.png?nASA",
            frameWidth: 32, // 256px / 8 frames
            frameHeight: 32,
            frames: 8,
            frameRate: 8, // Death animation
          },
        },
      },
    },

    // Health/UI settings
    health: {
      // Player health
      player: {
        maxHealth: 100,
        barWidth: 60,
        barHeight: 24, // Increased by 50% (from 16 to 24)
        barOffsetY: -40, // Above player sprite
        backgroundColor: 0x333333,
        borderColor: 0xffffff, // White border (changed from black)
        borderWidth: 2, // Border width
        borderRadius: 8, // Rounded corners
        healthColor: 0x00ff00, // Green
        damageColor: 0xff0000, // Red
        textColor: 0x000000, // Black text
        textSize: 18, // Larger text size
      },

      // Zombie health
      zombie: {
        barWidth: 50,
        barHeight: 6,
        barOffsetY: -35, // Above zombie sprite
        backgroundColor: 0x333333,
        healthColor: 0xff4444, // Red-ish
        damageColor: 0x880000, // Dark red
      },
    },

    // UI/Header settings
    ui: {
      header: {
        backgroundColor: 0x000000, // Darker background
        backgroundAlpha: 0.9, // Slightly transparent
        height: 80,
        padding: 20, // Increased padding
        textColor: 0x00ff00, // Green color for numbers (same as health)
        labelColor: 0xffffff, // White for labels
        fontSize: 22, // Increased font size from 16 to 22 for better readability
        spacing: 120, // Increased space between kills and score for better layout
        killsX: 30, // Fixed position for kills on the left
        scoreX: 320, // Fixed position for score on the right
      },
    },

    // Weapon system
    weapons: {
      // Weapon sprites configuration
      spriteSheet: {
        path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Weapons-eWa20GLLXe4BEIIXY1vm59TebLsO0p.png?Z7Z9",
        frameWidth: 32,
        frameHeight: 32,
        rows: 2,
        columns: 6,
      },

      // Available weapons
      types: {
        machineGun: {
          name: "Metralleta",
          spriteRow: 1, // Segunda fila
          spriteCol: 1, // Segunda columna
          damage: 1, // Menor daño
          fireRate: 100, // Muy rápida (muchos disparos)
          projectileCount: 1,
          spread: 8, // Pequeño spread para disparos automáticos
          projectileSpeed: 650,
          isDefault: true, // Arma por defecto
        },
        sniper: {
          name: "Francotirador",
          spriteRow: 0, // Primera fila
          spriteCol: 0, // Primera columna
          damage: 16, // Doble daño (era 8, ahora 16)
          fireRate: 1400, // Reducido velocidad (era 1000, ahora 1200)
          projectileCount: 1,
          spread: 0, // Sin spread (precisión)
          projectileSpeed: 750, // Reducido velocidad del proyectil (era 900, ahora 750)
          isDefault: false,
          piercing: true, // NUEVA: Puede atravesar zombies
          maxPiercing: 3, // NUEVA: Máximo 5 zombies por disparo
        },
        rocketLauncher: {
          name: "Lanzacohetes",
          spriteRow: 1, // Segunda fila
          spriteCol: 2, // Tercera columna
          damage: 4, // Daño medio
          fireRate: 800, // Velocidad normal
          projectileCount: 1,
          spread: 0,
          projectileSpeed: 400, // Cohete más lento
          explosionRadius: 100, // Daño en área
          explosionDamage: 3, // Daño de explosión reducido ligeramente (era 4)
          isDefault: false,
        },
      },

      // UI configuration - Bottom-left corner in column
      ui: {
        positionX: "left", // Left side of screen
        positionY: "bottom", // Bottom of screen
        spacing: 85, // Increased spacing to separate weapons properly
        scale: 2.2, // Even larger scale for better visibility
        selectedOutlineColor: 0x00ff00, // Green outline for selected weapon
        hoverOutlineColor: 0xffffff, // White outline for hover
        backgroundColor: 0x000000, // Dark background
        backgroundAlpha: 0.8, // Semi-transparent
        padding: 12, // Increased padding for larger icons
      },
    },

    // Projectile system
    projectiles: {
      // Projectile sprites configuration
      spriteSheet: {
        path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/Proyectiles-VllNtvttyPBt6k5K8J0vpGRtm8cbLQ.png?FMUF",
        frameWidth: 16,
        frameHeight: 16,
        rows: 7,
        columns: 5,
      },

      // Projectile types
      types: {
        normal: {
          name: "Normal Bullet",
          spriteRow: 5, // Sexta fila (0-indexed)
          spriteCol: 4, // Quinta columna (0-indexed) - cambiado de 3 a 4
          scale: 1.0,
          trailEffect: false,
        },
        rocket: {
          name: "Rocket",
          spriteRow: 5, // Sexta fila
          spriteCol: 0, // Primera columna
          scale: 1.2,
          trailEffect: true, // Fire trail effect
          trailColor: 0xff4400, // Orange-red trail
        },
      },
    },

    // Explosion effect configuration
    explosion: {
      spriteSheet: {
        path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/explosion-LIMIbLh5nYApvS8fzubuAkMXdEDnAT.png?G8xW",
        totalWidth: 336, // Total sprite sheet width
        totalHeight: 48, // Total sprite sheet height
        frameWidth: 48, // 336px / 7 frames = 48px per frame
        frameHeight: 48, // Single row, full height
        frames: 7, // 7 frames in the animation
      },
      animation: {
        frameRate: 20, // Fast explosion animation
        repeat: 0, // Play once
        scale: 1.5, // Scale up for better visibility
      },
    },

    // Legacy bullet settings (for compatibility)
    bullets: {
      width: 8,
      height: 16,
      speed: 600,
      damage: 1,
      color: 0xffff00, // Yellow color for bullets
      fireRate: 350, // milliseconds between shots (slower than before)
    },

    // Legacy weapon settings (for compatibility)
    weapon: {
      offsetX: 0, // Offset from player center
      offsetY: -30, // Offset from player center (above player)
      damage: 1, // Damage weapons deal to zombies
    },

    // Power Portals System
    powerPortals: {
      // Spawning configuration
      spawnRate: 8000, // milliseconds between portal sets (reduced from 12000)
      speed: 500, // Increased from 300 to 500 for faster falling speed

      // Portal dimensions and layout
      portalCount: 3, // Always 3 portals side by side
      portalHeight: 45, // Height of each portal (reduced from 80 to 45)
      portalWidth: 1.0, // Width multiplier for each portal (1.0 = portals touching each other)
      totalWidth: 0, // Will be calculated based on game area (excluding wall margins)
      wallMargin: 64, // Same as side walls (2 tiles * 32px)

      // Portal types configuration - 2 negative, 1 positive always
      types: [
        // Positive effects (1 will be chosen)
        { value: "x3", multiplier: 3, rarity: 0.3, type: "good" },
        { value: "x2", multiplier: 2, rarity: 0.4, type: "good" },
        { value: "+2", addition: 2, rarity: 0.15, type: "good" },
        { value: "+3", addition: 3, rarity: 0.15, type: "good" },

        // Negative effects (2 will be chosen)
        { value: "/2", division: 2, rarity: 0.25, type: "bad" },
        { value: "/3", division: 3, rarity: 0.15, type: "bad" },
        { value: "-1", subtraction: 1, rarity: 0.25, type: "bad" },
        { value: "-2", subtraction: 2, rarity: 0.35, type: "bad" },
      ],

      // Visual settings - colors will be dynamic based on game progression
      baseColors: {
        good: 0x00ff44, // Bright green for positive effects
        bad: 0xff3344, // Red for negative effects
      },
      backgroundAlpha: 0.3, // Much more transparent
      borderColor: 0xffffff, // White border
      borderWidth: 2, // Border width
      textColor: "#000000", // Black text for better visibility
      textSize: "28px", // Larger text
      textStyle: "bold",

      // Game progression settings
      confusionMode: {
        enabled: true,
        triggersAfter: 5, // Start random colors after 5 portals hit (reduced from 10)
      },

      // Player positioning when multiplied
      playerSpacing: 40,
      maxPlayers: 10, // Maximum number of players as requested
    },

    // Emergency Red Button configuration
    emergencyButton: {
      sprite: {
        path: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/ee72a5ff-8484-4376-9f4e-310388e7213f/red-buttom-6yej0EyASEbTTXakmQKXxoeDmweSdS.png?w7jo",
        frameWidth: 25,
        frameHeight: 25,
        frames: 2, // Frame 0: unpressed, Frame 1: pressed
      },
      position: {
        x: 670, // Right side of screen
        y: 995, // Same height as weapon selector
      },
      scale: 2.5, // Make it visible and clickable
      usesPerGame: 1, // Only once per game
      explosionEffect: {
        radius: 150, // Large explosion radius
        damage: 999, // Instant kill damage
        duration: 1000, // Animation duration
        color: 0xff0000, // Red explosion
      },
    },
  },

  // Loader configuration
  loader: {
    // Animation timing
    animation: {
      duration: 2800, // Total animation duration in ms
      frames: 18, // Number of frames in sprite sheet
      frameRate: 18 / 2.8, // Calculated frame rate
    },
    // Brand text display
    brandText: {
      fadeInDuration: 700, // Fade in animation duration
      displayDuration: 1200, // How long to show brand text
      fadeOutDuration: 600, // Fade out animation duration
    },
    // Sprite configuration
    sprite: {
      url: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/zS0QCi0PfUjO/chuckytes2t-a9Hz89icXVQVgOkchS0ssNllYtJfiu.png?RB0F",
      frameWidth: 241,
      frameHeight: 345,
      scale: 1.5, // Scale to match original HTML size
    },
    // Colors
    colors: {
      background: 0x000000,
      brandPrimary: "#ffffff",
      brandAccent: "#b7ff00",
      progressBar: 0xb7ff00,
      progressBarBg: 0x000000,
    },
  },
};

export default GameSettings;

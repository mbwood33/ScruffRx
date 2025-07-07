// src/main.ts
/**
 * @file main.ts
 * @description This is the main entry point for the ScruffRx game.
 * It initializes the Phaser game instance and registers all game scenes.
 */

import Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';

/**
 * @constant {Phaser.Types.Core.GameConfig} config
 * @description Configuration object for the Phaser game.
 * Defines the game's dimensions, rendering type, parent container,
 * background color, pixel art setting, and the list of scenes.
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // Automatically choose between WebGL and Canvas
    width: GameConfig.GAME_WIDTH, // Game width in pixels from GameConfig
    height: GameConfig.GAME_HEIGHT, // Game height in pixels from GameConfig
    parent: 'game-container', // ID of the HTML element where the canvas will be injected
    backgroundColor: GameConfig.COLORS.BACKGROUND, // Background color for the game canvas
    pixelArt: true, // Enable pixel art rendering for crisp sprites without anti-aliasing
    scene: [
        PreloadScene, // First scene to load assets
        MainMenuScene, // Main menu for game options
        GameScene // The primary gameplay scene
    ],
    // Physics configuration (optional, but good for future expansion)
    physics: {
        default: 'arcade', // Use Arcade Physics for simple, fast 2D physics
        arcade: {
            gravity: { x: 0, y: 0 }, // No global gravity by default, will be handled manually
            debug: false // Set to true to see physics bodies and debug information
        }
    },
    scale: {
        mode: Phaser.Scale.FIT, // Scale the game to fit the parent container while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game canvas horizontally and vertically
    }
};

/**
 * @constant {Phaser.Game} game
 * @description The main Phaser game instance.
 * This object manages the game lifecycle, scenes, rendering, and input.
 */
const game = new Phaser.Game(config);
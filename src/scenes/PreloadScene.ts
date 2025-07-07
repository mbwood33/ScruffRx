// src/scenes/PreloadScene.ts
/**
 * @file PreloadScene.ts
 * @description This scene is responsible for loading all game assets
 * (images, spritesheets, audio, etc.) before the game starts.
 */

import Phaser from 'phaser';

/**
 * @class PreloadScene
 * @extends Phaser.Scene
 * @description Handles the preloading of all game assets.
 * Displays a loading bar or progress indicator to the user.
 */
export class PreloadScene extends Phaser.Scene {
    /**
     * @constructor
     * @description Creates an instance of PreloadScene.
     * Sets the scene key for identification.
     */
    constructor() {
        super('PreloadScene');
    }

    /**
     * @method preload
     * @description Phaser's built-in method for loading assets.
     * This method is called once before the scene's create method.
     * All asset loading calls should be placed here.
     */
    preload(): void {
        // --- Loading Bar Setup ---
        // Get the game's width and height to position the loading bar
        const { width, height } = this.scale;

        // Add a background for the loading bar
        const loadingBarBg = this.add.graphics();
        loadingBarBg.fillStyle(0x222222, 0.8); // Dark gray background
        loadingBarBg.fillRect(width * 0.1, height * 0.5 - 15, width * 0.8, 30); // Position and size

        // Add the loading bar itself
        const loadingBar = this.add.graphics();
        loadingBar.fillStyle(0xff00aa, 1); // Hot pink color for the loading bar

        // Add a loading text
        const loadingText = this.add.text(width * 0.5, height * 0.5 - 50, 'Loading...', {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add a percentage text
        const percentText = this.add.text(width * 0.5, height * 0.5 + 50, '0%', {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Update the loading bar and percentage text based on loading progress
        this.load.on('progress', (value: number) => {
            loadingBar.clear();
            loadingBar.fillStyle(0xff00aa, 1);
            loadingBar.fillRect(width * 0.1, height * 0.5 - 15, width * 0.8 * value, 30);
            percentText.setText(`${Math.round(value * 100)}%`);
        });

        // Remove loading bar and text when loading is complete
        this.load.on('complete', () => {
            loadingBarBg.destroy();
            loadingBar.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // --- Asset Loading ---
        // Load the main sprite sheet for capsules and pathogens
        // 'sprite_sheet' is the key to refer to this image later
        // The path is relative to the `index.html` file.
        this.load.spritesheet('sprite_sheet', 'images/sprites/png/sprite_sheet.png', {
            frameWidth: 32, // Width of each individual sprite frame
            frameHeight: 32 // Height of each individual sprite frame
        });

        // Load the button spritesheet for UI elements
        this.load.spritesheet('buttons', 'images/sprites/png/buttons.png', {
            frameWidth: 32, // Width of each individual button sprite
            frameHeight: 32 // Height of each individual button sprite
        });

        // TODO: Load audio files (music, sound effects) here when available
        // Example: this.load.audio('bg_music', 'audio/bg_music.mp3');
        // Example: this.load.audio('clear_sound', 'audio/clear.wav');

        console.log('PreloadScene: Assets loading started...');
    }

    /**
     * @method create
     * @description Phaser's built-in method for creating game objects.
     * This method is called once after all assets have been loaded.
     * Used to set up initial game state and transition to the next scene.
     */
    create(): void {
        console.log('PreloadScene: Assets loaded. Transitioning to MainMenuScene.');
        // Once all assets are loaded, start the MainMenuScene
        this.scene.start('MainMenuScene');
    }
}
// src/entities/Pathogen.ts
/**
 * @file Pathogen.ts
 * @description Defines the Pathogen game object for ScruffRx.
 * Pathogens are static enemies on the grid that need to be cleared by matching.
 * They have a wiggling animation.
 */

import Phaser from 'phaser';
import { GameConfig, ColorType } from '../config/GameConfig';

/**
 * @class Pathogen
 * @extends Phaser.GameObjects.Sprite
 * @description Represents a pathogen that needs to be cleared from the field.
 * Pathogens have a color and a wiggling animation.
 */
export class Pathogen extends Phaser.GameObjects.Sprite {
    /**
     * @property {ColorType} colorIndex
     * @description The color index of this pathogen (0: Pink, 1: Blue, 2: Yellow).
     * @readonly
     */
    public readonly colorIndex: ColorType;

    /**
     * @property {number} gridCol
     * @description The current column position of this pathogen on the game grid.
     */
    public gridCol: number;

    /**
     * @property {number} gridRow
     * @description The current row position of this pathogen on the game grid.
     */
    public gridRow: number;

    /**
     * @constructor
     * @description Creates a new pathogen at the specified grid position.
     * @param {Phaser.Scene} scene - The Phaser scene this object belongs to.
     * @param {number} x - The initial x-coordinate in screen space.
     * @param {number} y - The initial y-coordinate in screen space.
     * @param {ColorType} colorIndex - Color of the pathogen (0=pink, 1=blue, 2=yellow).
     * @param {number} gridCol - Column position in the grid (0 to `FIELD_WIDTH` - 1).
     * @param {number} gridRow - Row position in the grid (0 to `FIELD_HEIGHT` - 1).
     */
    constructor(scene: Phaser.Scene, x: number, y: number, colorIndex: ColorType, gridCol: number, gridRow: number) {
        // Call the super constructor for Phaser.GameObjects.Sprite
        // 'sprite_sheet' is the key for the loaded spritesheet asset
        super(scene, x, y, 'sprite_sheet');

        this.colorIndex = colorIndex;
        this.gridCol = gridCol;
        this.gridRow = gridRow;

        // Set the origin to the center of the sprite for easier positioning
        this.setOrigin(0.5);

        // Add this sprite to the scene
        scene.add.existing(this);

        // Set depth to ensure pathogens are below falling capsules but above background
        this.setDepth(0);

        // Create and play the wiggling animation
        this.createAnimation();
    }

    /**
     * @method createAnimation
     * @description Creates and plays the wiggling animation for the pathogen.
     * The animation uses 4 frames specific to each pathogen color, creating a loop.
     * A random starting frame is chosen to make the wiggling appear more natural.
     *
     * @private
     */
    private createAnimation(): void {
        /*
         * Sprite Sheet Layout for Pathogens (Rows 4-6 for colors):
         *
         * Row 4 (Pink Pathogen):
         * 16: Pink pathogen frame 0
         * 17: Pink pathogen frame 1
         * 18: Pink pathogen frame 2
         * 19: Pink pathogen frame 3
         * Row 5 (Blue Pathogen):
         * 20: Blue pathogen frame 0
         * 21: Blue pathogen frame 1
         * 22: Blue pathogen frame 2
         * 23: Blue pathogen frame 3
         * Row 6 (Yellow Pathogen):
         * 24: Yellow pathogen frame 0
         * 25: Yellow pathogen frame 1
         * 26: Yellow pathogen frame 2
         * 27: Yellow pathogen frame 3
         */

        const animKey = `pathogen_animation_${this.colorIndex}`; // Unique key for each color's animation
        const startFrame = 16 + (this.colorIndex * 4); // Starting frame for this color

        // Check if the animation already exists to prevent re-creation
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers('sprite_sheet', {
                    start: startFrame,
                    end: startFrame + 3 // 4 frames total (0-3)
                }),
                frameRate: 8, // Adjust frame rate for desired wiggle speed
                repeat: -1, // Loop indefinitely
                yoyo: true // Play forwards then backwards for a smooth wiggle
            });
        }

        // Set a random starting frame before playing the animation
        this.setFrame(startFrame + Phaser.Math.Between(0, 3));

        // Play the animation
        this.play(animKey);

        // Set a slightly random animation offset so they don't all wiggle in sync
        this.anims.timeScale = (1 + (Math.random() * 0.2 - 0.1)); // Directly set timeScale
    }

    /**
     * @method getColorName
     * @description Returns the human-readable name of the pathogen's color.
     * @returns {string} The color name (e.g., 'Hot Pink', 'Sky Blue', 'Pear').
     */
    public getColorName(): string {
        switch (this.colorIndex) {
            case GameConfig.COLOR_INDEX.PINK: return 'Hot Pink';
            case GameConfig.COLOR_INDEX.BLUE: return 'Sky Blue';
            case GameConfig.COLOR_INDEX.YELLOW: return 'Pear';
            default: return 'Unknown';
        }
    }

    /**
     * @method getColorHex
     * @description Returns the hexadecimal color value for this pathogen.
     * @returns {string} The hex color string (e.g., '#FF00AA').
     */
    public getColorHex(): string {
        return GameConfig.COLOR_VALUES[this.colorIndex];
    }
}
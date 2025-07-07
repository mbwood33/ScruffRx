// src/config/GameConfig.ts
/**
 * @file GameConfig.ts
 * @description Central configuration for ScruffRx game constants and settings.
 * This class holds static readonly properties for game dimensions,
 * grid properties, colors, speeds, scoring, and level progression.
 */

/**
 * @class GameConfig
 * @description Central configuration for ScruffRx game constants and settings.
 * Provides a single source of truth for various game parameters.
 */
export class GameConfig {
    // Game dimensions - based on classic Dr. Mario proportions
    // The playing field is taller than it is wide, like a medicine bottle
    /**
     * @property {number} GAME_WIDTH
     * @description The width of the game canvas in pixels.
     * @readonly
     */
    public static readonly GAME_WIDTH = 480;

    /**
     * @property {number} GAME_HEIGHT
     * @description The height of the game canvas in pixels.
     * @readonly
     */
    public static readonly GAME_HEIGHT = 640;

    // Playing field dimensions in tiles
    // Classic Dr. Mario uses an 8x16 grid (width x height)
    /**
     * @property {number} FIELD_WIDTH
     * @description The number of columns in the game grid.
     * @readonly
     */
    public static readonly FIELD_WIDTH = 8;

    /**
     * @property {number} FIELD_HEIGHT
     * @description The number of rows in the game grid.
     * @readonly
     */
    public static readonly FIELD_HEIGHT = 16;

    /**
     * @property {number} TILE_SIZE
     * @description The size of each tile/block in pixels (width and height).
     * This determines how big each pathogen and capsule piece appears.
     * @readonly
     */
    public static readonly TILE_SIZE = 32;

    /**
     * @property {number} BOTTLE_NECK_ROW
     * @description The 0-indexed row number that signifies the "bottle neck".
     * If capsules reach this height, it's typically a game over condition.
     * @readonly
     */
    public static readonly BOTTLE_NECK_ROW = 3;

    // Pathogen and capsule colors - using the specified color palette
    /**
     * @property {object} COLORS
     * @description Defines the hexadecimal color values used in the game.
     * @readonly
     */
    public static readonly COLORS = {
        HOT_PINK: '#FF00AA',
        SKY_BLUE: '#24E0FF',
        PEAR: '#E2E603',
        BACKGROUND: '#1a1a2e', // Main background color of the game
        BORDER: '#FF00AA' // Color for game field borders
    } as const; // 'as const' makes the properties readonly

    /**
     * @property {object} COLOR_INDEX
     * @description Maps color names to numerical indices for easier array access and logic.
     * @readonly
     */
    public static readonly COLOR_INDEX = {
        PINK: 0,
        BLUE: 1,
        YELLOW: 2
    } as const;

    /**
     * @property {string[]} COLOR_VALUES
     * @description An array of color hexadecimal values, ordered by their `COLOR_INDEX`.
     * Useful for iterating through colors or accessing by index.
     * @readonly
     */
    public static readonly COLOR_VALUES = [
        GameConfig.COLORS.HOT_PINK,
        GameConfig.COLORS.SKY_BLUE,
        GameConfig.COLORS.PEAR
    ];

    /**
     * @property {object} SPEEDS
     * @description Defines the fall speeds for capsules in milliseconds.
     * These determine how fast capsules fall automatically.
     * @readonly
     */
    public static readonly SPEEDS = {
        LOW: 1000, // 1 second between drops
        MEDIUM: 500, // 0.5 seconds between drops
        HIGH: 250 // 0.25 seconds between drops
    } as const;

    /**
     * @property {object} SCORING
     * @description Defines the scoring system values.
     * @readonly
     */
    public static readonly SCORING = {
        SINGLE_PATHOGEN: 100, // Points for clearing one pathogen
        COMBO_MULTIPLIER: 2, // Multiplier for clearing multiple groups at once
        SPEED_BONUS: {
            LOW: 1, // No bonus for low speed
            MEDIUM: 1.5, // 50% bonus for medium speed
            HIGH: 2 // 100% bonus for high speed
        }
    } as const;

    /**
     * @property {number} MIN_LEVEL
     * @description The minimum selectable game level.
     * @readonly
     */
    public static readonly MIN_LEVEL = 0;

    /**
     * @property {number} MAX_LEVEL
     * @description The maximum selectable game level.
     * @readonly
     */
    public static readonly MAX_LEVEL = 20;

    /**
     * @method PATHOGENS_PER_LEVEL
     * @description Calculates the number of pathogens to generate for a given level.
     * @param {number} level - The current game level (0-indexed).
     * @returns {number} The calculated number of pathogens for the level.
     */
    public static PATHOGENS_PER_LEVEL = (level: number): number => {
        return 4 + (level * 2); // Formula: 4 + (Level * 2) pathogens
    }

    /**
     * @property {number} INPUT_REPEAT_DELAY
     * @description Initial delay in milliseconds before a held key starts repeating its action.
     * @readonly
     */
    public static readonly INPUT_REPEAT_DELAY = 200;

    /**
     * @property {number} INPUT_REPEAT_RATE
     * @description Rate in milliseconds at which a held key repeats its action after the initial delay.
     * @readonly
     */
    public static readonly INPUT_REPEAT_RATE = 50;

    /**
     * @property {number} CLEAR_ANIMATION_DURATION
     * @description Duration of the clear animation (shrink/fade) in milliseconds.
     * @readonly
     */
    public static readonly CLEAR_ANIMATION_DURATION = 400;

    /**
     * @property {number} DROP_ANIMATION_DURATION
     * @description Duration of the piece drop animation in milliseconds.
     * @readonly
     */
    public static readonly DROP_ANIMATION_DURATION = 300;
}

/**
 * @typedef {'horizontal' | 'vertical'} CapsuleOrientation
 * @description Type definition for the orientation of a capsule.
 */
export type CapsuleOrientation = 'horizontal' | 'vertical';

/**
 * @typedef {0 | 1 | 2} ColorType
 * @description Type definition for the color index of game pieces (0: Pink, 1: Blue, 2: Yellow).
 */
export type ColorType = 0 | 1 | 2;

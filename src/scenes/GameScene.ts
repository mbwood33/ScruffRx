// src/scenes/GameScene.ts
/**
 * @file GameScene.ts
 * @description The main gameplay scene for ScruffRx. This scene manages
 * the game loop, user input, capsule movement, pathogen generation,
 * and interaction with the GameGrid and MatchSystem.
 */

import Phaser from 'phaser';
import { GameConfig, CapsuleOrientation, ColorType } from '../config/GameConfig';
import { GameGrid, GridCell } from '../game/GameGrid';
import { MatchSystem } from '../game/MatchSystem';
import { Pathogen } from '../entities/Pathogen';
import { Capsule, CapsuleHalf } from '../entities/Capsule';

/**
 * @interface GameSceneData
 * @description Interface for data passed to the GameScene upon activation.
 * @property {number} level - The selected game level.
 * @property {'LOW' | 'MEDIUM' | 'HIGH'} speed - The selected game speed.
 */
interface GameSceneData {
    level: number;
    speed: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * @class GameScene
 * @extends Phaser.Scene
 * @description The core gameplay scene where the Dr. Mario-like game is played.
 * Manages game state, physics, input, and interactions between game entities.
 */
export class GameScene extends Phaser.Scene {
    /**
     * @property {number} level
     * @description The current game level.
     * @private
     */
    private level: number = 0;

    /**
     * @property {'LOW' | 'MEDIUM' | 'HIGH'} speed
     * @description The current game speed setting.
     * @private
     */
    private speed: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    /**
     * @property {number} score
     * @description The player's current score.
     * @private
     */
    private score: number = 0;

    /**
     * @property {number} fieldX
     * @description The X-coordinate (center) of the game playing field in screen space.
     * @private
     */
    private fieldX: number = 0;

    /**
     * @property {number} fieldY
     * @description The Y-coordinate (center) of the game playing field in screen space.
     * @private
     */
    private fieldY: number = 0;

    /**
     * @property {GameGrid} gameGrid
     * @description The instance of `GameGrid` managing the logical state of the playing field.
     */
    public gameGrid!: GameGrid; // Public for MatchSystem access

    /**
     * @property {MatchSystem} matchSystem
     * @description The instance of `MatchSystem` handling match detection and clearing.
     * @private
     */
    private matchSystem!: MatchSystem;

    /**
     * @property {Capsule | null} currentCapsule
     * @description The currently falling capsule controlled by the player.
     * @private
     */
    private currentCapsule: Capsule | null = null;

    /**
     * @property {Phaser.Input.Keyboard.Key[]} inputKeys
     * @description Array of Phaser Keyboard Key objects for handling input.
     * @private
     */
    private inputKeys!: {
        left: Phaser.Input.Keyboard.Key,
        right: Phaser.Input.Keyboard.Key,
        down: Phaser.Input.Keyboard.Key,
        up: Phaser.Input.Keyboard.Key,
        space: Phaser.Input.Keyboard.Key
    };

    /**
     * @property {Map<string, number>} keyHeldTime
     * @description A map to track how long each relevant key has been held down (in milliseconds).
     * Used for input repeat logic.
     * @private
     */
    private keyHeldTime: Map<string, number> = new Map();

    /**
     * @property {Map<string, number>} keyRepeatTime
     * @description A map to track the time since the last repeat action for a held key (in milliseconds).
     * Used for input repeat logic.
     * @private
     */
    private keyRepeatTime: Map<string, number> = new Map();

    /**
     * @property {number} fallTimer
     * @description Accumulates delta time to trigger automatic capsule falling.
     * @private
     */
    private fallTimer: number = 0;

    /**
     * @property {number} fallSpeed
     * @description The current interval (in milliseconds) for automatic capsule drops.
     * Determined by the selected game speed.
     * @private
     */
    private fallSpeed: number = GameConfig.SPEEDS.LOW;

    /**
     * @property {boolean} isGameOver
     * @description Flag indicating if the game is currently in a game over state.
     * @private
     */
    private isGameOver: boolean = false;

    /**
     * @property {Phaser.GameObjects.Text} scoreText
     * @description Phaser Text object displaying the current score.
     * @private
     */
    private scoreText!: Phaser.GameObjects.Text;

    /**
     * @property {Phaser.GameObjects.Text} levelTextDisplay
     * @description Phaser Text object displaying the current level.
     * @private
     */
    private levelTextDisplay!: Phaser.GameObjects.Text;

    /**
     * @property {Phaser.GameObjects.Text} speedTextDisplay
     * @description Phaser Text object displaying the current speed.
     * @private
     */
    private speedTextDisplay!: Phaser.GameObjects.Text;

    /**
     * @property {Phaser.GameObjects.Text} pathogensRemainingText
     * @description Phaser Text object displaying the number of pathogens remaining.
     * @private
     */
    private pathogensRemainingText!: Phaser.GameObjects.Text;

    /**
     * @constructor
     * @description Creates an instance of GameScene.
     * Sets the scene key for identification.
     */
    constructor() {
        super('GameScene');
    }

    /**
     * @method create
     * @description Phaser's built-in method for creating game objects.
     * This method is called once when the scene is first initialized.
     * Sets up the game environment, grid, input, and UI.
     * @param {GameSceneData} data - Data passed from the previous scene (e.g., MainMenuScene).
     */
    create(data: GameSceneData): void {
        console.log('GameScene: Creating...');

        // Initialize game state from passed data
        this.level = data.level || 0;
        this.speed = data.speed || 'LOW';
        this.score = 0;
        this.isGameOver = false;
        this.currentCapsule = null;
        this.fallTimer = 0;
        this.fallSpeed = GameConfig.SPEEDS[this.speed];

        // Calculate playing field position (centered)
        // The field's top-left corner
        this.fieldX = (this.scale.width - (GameConfig.FIELD_WIDTH * GameConfig.TILE_SIZE)) / 2;
        this.fieldY = (this.scale.height - (GameConfig.FIELD_HEIGHT * GameConfig.TILE_SIZE)) / 2;

        // Initialize the game grid and match system
        this.gameGrid = new GameGrid();
        // Pass 'this' (the GameScene instance) correctly to MatchSystem constructor
        this.matchSystem = new MatchSystem(this.gameGrid, this);

        // Set background color
        this.cameras.main.setBackgroundColor(GameConfig.COLORS.BACKGROUND);

        // Create visual elements
        this.createPlayingField();
        this.createBottleNeckIndicator();
        this.createUI(); // Score, Level, Speed displays

        // Setup input handlers
        this.setupInput();

        // Listen for score updates from the MatchSystem
        this.events.on('scoreUpdate', this.updateScore, this);

        // Start the game flow
        this.startGameRound();

        console.log(`GameScene: Initialized for Level: ${this.level}, Speed: ${this.speed}`);
    }

    /**
     * @method update
     * @description Phaser's built-in update loop method.
     * This method is called once per frame.
     * Handles continuous game logic like automatic falling and input repetition.
     * @param {number} time - The current time.
     * @param {number} delta - The time elapsed since the last frame in milliseconds.
     */
    update(time: number, delta: number): void {
        // Access isGameOver directly as it's a property of this class
        if (this.isGameOver || this.matchSystem.isProcessingMatches()) {
            return; // Pause game logic if game over or matches are being processed
        }

        // Handle continuous input for held keys
        this.handleHeldKeys(delta);

        // Handle automatic capsule falling
        this.handleAutomaticFalling(delta);
    }

    /**
     * @method startGameRound
     * @description Resets the game state for a new round/level.
     * Clears the grid, generates new pathogens, and spawns the first capsule.
     * @private
     */
    private startGameRound(): void {
        this.clearField(); // Remove all existing pieces from grid and scene
        this.generatePathogens(); // Populate the field with new pathogens
        this.spawnNewCapsule(); // Start with a new falling capsule
        this.updatePathogenCountDisplay(); // Update UI
    }

    /**
     * @method createPlayingField
     * @description Draws the visual representation of the game playing field (the bottle).
     * This includes the background rectangle and a border.
     * @private
     */
    private createPlayingField(): void {
        const fieldWidth = GameConfig.FIELD_WIDTH * GameConfig.TILE_SIZE;
        const fieldHeight = GameConfig.FIELD_HEIGHT * GameConfig.TILE_SIZE;

        // Draw the main playing field background rectangle
        this.add.rectangle(
            this.fieldX + fieldWidth / 2, // Centered X
            this.fieldY + fieldHeight / 2, // Centered Y
            fieldWidth,
            fieldHeight,
            0x141428 // Slightly lighter dark background for the field
        ).setOrigin(0.5).setDepth(-1); // Set depth to ensure it's behind game pieces

        // Draw the border around the playing field
        const borderThickness = 3;
        const borderColor = Phaser.Display.Color.HexStringToColor(GameConfig.COLORS.BORDER).color;

        // Top border
        this.add.rectangle(
            this.fieldX + fieldWidth / 2,
            this.fieldY - borderThickness / 2,
            fieldWidth + borderThickness * 2,
            borderThickness,
            borderColor
        ).setOrigin(0.5).setDepth(-1);

        // Bottom border
        this.add.rectangle(
            this.fieldX + fieldWidth / 2,
            this.fieldY + fieldHeight + borderThickness / 2,
            fieldWidth + borderThickness * 2,
            borderThickness,
            borderColor
        ).setOrigin(0.5).setDepth(-1);

        // Left border
        this.add.rectangle(
            this.fieldX - borderThickness / 2,
            this.fieldY + fieldHeight / 2,
            borderThickness,
            fieldHeight + borderThickness * 2,
            borderColor
        ).setOrigin(0.5).setDepth(-1);

        // Right border
        this.add.rectangle(
            this.fieldX + fieldWidth + borderThickness / 2,
            this.fieldY + fieldHeight / 2,
            borderThickness,
            fieldHeight + borderThickness * 2,
            borderColor
        ).setOrigin(0.5).setDepth(-1);

        // Optional: Add grid lines for debugging
        // this.createGridLines();
    }

    /**
     * @method createGridLines
     * @description (Optional) Draws subtle grid lines on the playing field for debugging purposes.
     * @private
     */
    private createGridLines(): void {
        const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0x444444, alpha: 0.5 } });
        graphics.setDepth(-0.5); // Between background and pieces

        const fieldWidth = GameConfig.FIELD_WIDTH * GameConfig.TILE_SIZE;
        const fieldHeight = GameConfig.FIELD_HEIGHT * GameConfig.TILE_SIZE;

        // Vertical lines
        for (let col = 0; col <= GameConfig.FIELD_WIDTH; col++) {
            const x = this.fieldX + (col * GameConfig.TILE_SIZE);
            graphics.lineBetween(x, this.fieldY, x, this.fieldY + fieldHeight);
        }

        // Horizontal lines
        for (let row = 0; row <= GameConfig.FIELD_HEIGHT; row++) {
            const y = this.fieldY + (row * GameConfig.TILE_SIZE);
            graphics.lineBetween(this.fieldX, y, this.fieldX + fieldWidth, y);
        }
    }

    /**
     * @method createBottleNeckIndicator
     * @description Draws a visual indicator for the "bottle neck" row,
     * which signifies the game over line.
     * @private
     */
    private createBottleNeckIndicator(): void {
        const neckY = this.fieldY + (GameConfig.BOTTLE_NECK_ROW * GameConfig.TILE_SIZE);
        const fieldWidth = GameConfig.FIELD_WIDTH * GameConfig.TILE_SIZE;

        const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xFF00AA, alpha: 0.7 } });
        graphics.setDepth(5); // Ensure it's visible above pieces

        // Create a dashed line effect
        const dashLength = 10;
        const gapLength = 5;
        for (let x = 0; x < fieldWidth; x += (dashLength + gapLength)) {
            graphics.lineBetween(this.fieldX + x, neckY, this.fieldX + x + dashLength, neckY);
        }
    }

    /**
     * @method createUI
     * @description Creates and positions the game's user interface elements,
     * including score, level, speed, and pathogens remaining displays.
     * @private
     */
    private createUI(): void {
        const { width } = this.scale;
        const uiX = width - 100; // Position UI elements on the right side

        // Score display
        this.scoreText = this.add.text(uiX, 30, `Score: ${this.score}`, {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // Level display
        this.levelTextDisplay = this.add.text(uiX, 60, `Level: ${this.level}`, {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: GameConfig.COLORS.SKY_BLUE
        }).setOrigin(0.5);

        // Speed display
        this.speedTextDisplay = this.add.text(uiX, 90, `Speed: ${this.speed}`, {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: GameConfig.COLORS.PEAR
        }).setOrigin(0.5);

        // Pathogens Remaining display
        this.pathogensRemainingText = this.add.text(uiX, 120, `Pathogens: 0`, {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: GameConfig.COLORS.HOT_PINK
        }).setOrigin(0.5);
    }

    /**
     * @method updateScore
     * @description Updates the player's score and refreshes the score display.
     * This method is typically called by the `MatchSystem` after clearing pieces.
     * @param {number} clearedCount - The number of pieces cleared in the last match.
     * @private
     */
    private updateScore(clearedCount: number): void {
        // Basic scoring: 100 points per cleared piece
        this.score += clearedCount * GameConfig.SCORING.SINGLE_PATHOGEN;
        // TODO: Implement combo multiplier and speed bonus
        this.scoreText.setText(`Score: ${this.score}`);
    }

    /**
     * @method updatePathogenCountDisplay
     * @description Updates the UI text showing the current number of pathogens remaining on the field.
     * @private
     */
    private updatePathogenCountDisplay(): void {
        const count = this.gameGrid.countPathogens();
        this.pathogensRemainingText.setText(`Pathogens: ${count}`);
    }

    /**
     * @method clearField
     * @description Removes all existing game pieces (pathogens and capsule halves)
     * from the Phaser scene and clears the `GameGrid`.
     * @private
     */
    private clearField(): void {
        // Destroy all existing pathogens
        this.gameGrid.getPathogens().forEach(pathogen => {
            if (pathogen && pathogen.active) {
                pathogen.destroy();
            }
        });

        // Destroy all existing capsule halves (that might be static)
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
                const cell = this.gameGrid.get(col, row);
                if (cell instanceof CapsuleHalf) {
                    if (cell && cell.active) {
                        cell.destroy();
                    }
                }
            }
        }

        // Clear the logical grid
        this.gameGrid.clear();
        console.log('GameScene: Field cleared of all pieces.');
    }

    /**
     * @method generatePathogens
     * @description Populates the game grid with a random number of pathogens
     * based on the current level, ensuring they do not overlap.
     * Pathogens are placed in the lower 2/3 of the field.
     * @private
     */
    private generatePathogens(): void {
        const pathogenCount = GameConfig.PATHOGENS_PER_LEVEL(this.level);
        let placed = 0;
        let attempts = 0;
        const maxAttempts = 1000; // Safety break to prevent infinite loops

        console.log(`GameScene: Generating ${pathogenCount} pathogens for level ${this.level}.`);

        while (placed < pathogenCount && attempts < maxAttempts) {
            attempts++;

            // Random position in the lower part of the field (rows 6-15)
            // This prevents pathogens from spawning too high and immediately causing game over.
            const col = Phaser.Math.Between(0, GameConfig.FIELD_WIDTH - 1);
            const row = Phaser.Math.Between(6, GameConfig.FIELD_HEIGHT - 1);

            // Check if the target position is already occupied
            if (this.gameGrid.isOccupied(col, row)) {
                continue; // Try a new position
            }

            // Random color for the pathogen
            const colorIndex = Phaser.Math.Between(0, GameConfig.COLOR_VALUES.length - 1) as ColorType;

            // Convert grid coordinates to screen coordinates for the pathogen's visual position
            const { x, y } = this.gridToScreen(col, row);

            // Create the pathogen instance
            const pathogen = new Pathogen(this, x, y, colorIndex, col, row);

            // Add the pathogen to the game grid
            this.gameGrid.set(col, row, pathogen);
            placed++;
        }
        console.log(`GameScene: Placed ${placed} pathogens.`);
    }

    /**
     * @method spawnNewCapsule
     * @description Spawns a new `Capsule` at the top-center of the playing field.
     * Performs a game over check if the spawn position is blocked.
     * @private
     */
    private spawnNewCapsule(): void {
        // Access isGameOver directly as it's a property of this class
        if (this.isGameOver) {
            return; // Do not spawn if game is already over
        }

        // Random colors for the two halves of the capsule
        const color1 = Phaser.Math.Between(0, GameConfig.COLOR_VALUES.length - 1) as ColorType;
        const color2 = Phaser.Math.Between(0, GameConfig.COLOR_VALUES.length - 1) as ColorType;

        // Starting position for the capsule (top-center of the grid)
        const startCol = Math.floor(GameConfig.FIELD_WIDTH / 2) - 1; // Adjust for 2-tile width
        const startRow = 0;

        // Convert grid coordinates to screen coordinates for the capsule's visual position
        const { x, y } = this.gridToScreen(startCol, startRow);

        // Create the new capsule instance
        this.currentCapsule = new Capsule(this, x, y, color1, color2, 'horizontal');

        // Set the capsule's initial grid position
        this.currentCapsule.setGridPosition(startCol, startRow);

        // Check for immediate game over if the spawn position is blocked
        // This means the capsule spawns directly on top of existing pieces.
        if (this.gameGrid.isOccupied(this.currentCapsule.half1.gridCol, this.currentCapsule.half1.gridRow) ||
            this.gameGrid.isOccupied(this.currentCapsule.half2.gridCol, this.currentCapsule.half2.gridRow)) {
            console.log('GameScene: Game Over - Spawn position blocked!');
            this.handleGameOver();
            return;
        }

        console.log(`GameScene: Spawned new capsule at (${startCol}, ${startRow}) with colors ${color1}, ${color2}.`);
    }

    /**
     * @method setupInput
     * @description Configures keyboard input listeners for player controls.
     * Maps arrow keys and spacebar to game actions.
     * @private
     */
    private setupInput(): void {
        this.inputKeys = {
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), // Use ! for non-null assertion
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };

        // Listen for key down events (for single press actions like rotate)
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));

        // Listen for key up events (to clear held key timers)
        this.input.keyboard!.on('keyup', (event: KeyboardEvent) => this.handleKeyUp(event));
    }

    /**
     * @method handleKeyDown
     * @description Handles single key press events for immediate actions (e.g., rotation).
     * Also initializes `keyHeldTime` for keys that support continuous input.
     * @param {KeyboardEvent} event - The keyboard event.
     * @private
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Access isGameOver directly as it's a property of this class
        if (this.isGameOver || this.matchSystem.isProcessingMatches()) {
            return; // Ignore input if game over or processing matches
        }

        // Only process if the key is not already being held down (prevents multiple triggers on initial press)
        if (!this.keyHeldTime.has(event.code)) {
            switch (event.code) {
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowDown':
                    // For movement keys, record initial press time for repeat logic
                    this.keyHeldTime.set(event.code, 0);
                    this.keyRepeatTime.set(event.code, 0);
                    // Trigger initial move using the new tryMove methods
                    if (event.code === 'ArrowLeft') this.tryMoveCapsuleLeft();
                    if (event.code === 'ArrowRight') this.tryMoveCapsuleRight();
                    if (event.code === 'ArrowDown') this.tryMoveCapsuleDown(true); // Soft drop
                    break;
                case 'ArrowUp':
                case 'Space':
                    this.rotateCapsule(); // Rotate on single press
                    break;
            }
        }
    }

    /**
     * @method handleKeyUp
     * @description Clears the `keyHeldTime` and `keyRepeatTime` for a released key.
     * @param {KeyboardEvent} event - The keyboard event.
     * @private
     */
    private handleKeyUp(event: KeyboardEvent): void {
        this.keyHeldTime.delete(event.code);
        this.keyRepeatTime.delete(event.code);
    }

    /**
     * @method handleHeldKeys
     * @description Manages continuous movement for keys held down (e.g., left, right, down).
     * Implements an initial delay and then a repeat rate.
     * @param {number} delta - The time elapsed since the last frame in milliseconds.
     * @private
     *
     * @algorithm
     * 1. Iterate through all keys currently in `keyHeldTime`.
     * 2. For each key, update its `heldTime` by adding `delta`.
     * 3. If `heldTime` exceeds `INPUT_REPEAT_DELAY`:
     * a. Update `repeatTime` by adding `delta`.
     * b. If `repeatTime` exceeds `INPUT_REPEAT_RATE`:
     * i. Reset `repeatTime` to 0.
     * ii. Perform the corresponding action (move left/right/down).
     */
    private handleHeldKeys(delta: number): void {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || !this.currentCapsule.isFalling || this.isGameOver || this.matchSystem.isProcessingMatches()) {
            return;
        }

        // Iterate over a copy of keys to avoid issues if map is modified during iteration
        const keysToProcess = Array.from(this.keyHeldTime.keys());

        for (const key of keysToProcess) {
            let heldTime = this.keyHeldTime.get(key) || 0;
            heldTime += delta;
            this.keyHeldTime.set(key, heldTime);

            if (heldTime >= GameConfig.INPUT_REPEAT_DELAY) {
                let repeatTime = this.keyRepeatTime.get(key) || 0;
                repeatTime += delta;
                this.keyRepeatTime.set(key, repeatTime);

                if (repeatTime >= GameConfig.INPUT_REPEAT_RATE) {
                    this.keyRepeatTime.set(key, 0); // Reset repeat timer

                    switch (key) {
                        case 'ArrowLeft':
                            this.tryMoveCapsuleLeft();
                            break;
                        case 'ArrowRight':
                            this.tryMoveCapsuleRight();
                            break;
                        case 'ArrowDown':
                            this.tryMoveCapsuleDown(true); // Soft drop
                            break;
                    }
                }
            }
        }
    }

    /**
     * @method handleAutomaticFalling
     * @description Manages the automatic downward movement of the current capsule
     * based on the `fallSpeed`.
     * @param {number} delta - The time elapsed since the last frame in milliseconds.
     * @private
     *
     * @algorithm
     * 1. Accumulate `delta` into `fallTimer`.
     * 2. If `fallTimer` exceeds `fallSpeed`:
     * a. Reset `fallTimer` to 0.
     * b. Attempt to move the capsule down by one row using `tryMoveCapsuleDown()`.
     */
    private handleAutomaticFalling(delta: number): void {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || !this.currentCapsule.isFalling || this.isGameOver || this.matchSystem.isProcessingMatches()) {
            return;
        }

        this.fallTimer += delta;

        if (this.fallTimer >= this.fallSpeed) {
            this.fallTimer = 0; // Reset timer
            this.tryMoveCapsuleDown(); // Attempt to move down
        }
    }

    /**
     * @method tryMoveCapsuleLeft
     * @description Attempts to move the `currentCapsule` one column to the left.
     * If successful, updates its visual position.
     * @private
     */
    private tryMoveCapsuleLeft(): void {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || this.isGameOver) return;

        // Use the renamed method
        if (this.currentCapsule.tryMoveLeft(this.gameGrid.isOccupied.bind(this.gameGrid))) {
            this.updateCapsuleVisualPosition();
        }
    }

    /**
     * @method tryMoveCapsuleRight
     * @description Attempts to move the `currentCapsule` one column to the right.
     * If successful, updates its visual position.
     * @private
     */
    private tryMoveCapsuleRight(): void {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || this.isGameOver) return;

        // Use the renamed method
        if (this.currentCapsule.tryMoveRight(this.gameGrid.isOccupied.bind(this.gameGrid))) {
            this.updateCapsuleVisualPosition();
        }
    }

    /**
     * @method tryMoveCapsuleDown
     * @description Attempts to move the `currentCapsule` one row down.
     * If successful, updates its visual position. If it cannot move down,
     * it means the capsule has landed, and `landCapsule()` is called.
     * @param {boolean} [isSoftDrop=false] - True if this move is triggered by player input (soft drop).
     * @private
     */
    private tryMoveCapsuleDown(isSoftDrop: boolean = false): void {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || this.isGameOver) return;

        // Create a custom isOccupiedCheck that ignores the current capsule's own halves
        const customIsOccupiedCheck = (col: number, row: number): boolean => {
            const cellContent = this.gameGrid.get(col, row);
            // If the cell is occupied, check if it's one of the current capsule's halves
            if (cellContent instanceof CapsuleHalf) {
                if (cellContent === this.currentCapsule?.half1 || cellContent === this.currentCapsule?.half2) {
                    return false; // It's one of our own halves, so it's not a collision
                }
            }
            // Otherwise, use the standard gameGrid.isOccupied check
            return this.gameGrid.isOccupied(col, row);
        };

        if (this.currentCapsule.tryMoveDown(customIsOccupiedCheck)) {
            this.updateCapsuleVisualPosition();
            if (isSoftDrop) {
                this.fallTimer = 0; // Reset timer for soft drops to prevent double drops
            }
        } else {
            // Capsule has landed
            this.landCapsule();
        }
    }

    /**
     * @method rotateCapsule
     * @description Attempts to rotate the `currentCapsule` 90 degrees clockwise.
     * If successful, updates its visual position.
     * @private
     */
    private rotateCapsule(): void {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || this.isGameOver) return;

        // Create a custom isOccupiedCheck that ignores the current capsule's own halves
        const customIsOccupiedCheck = (col: number, row: number): boolean => {
            const cellContent = this.gameGrid.get(col, row);
            // If the cell is occupied, check if it's one of the current capsule's halves
            if (cellContent instanceof CapsuleHalf) {
                if (cellContent === this.currentCapsule?.half1 || cellContent === this.currentCapsule?.half2) {
                    return false; // It's one of our own halves, so it's not a collision
                }
            }
            // Otherwise, use the standard gameGrid.isOccupied check
            return this.gameGrid.isOccupied(col, row);
        };

        if (this.currentCapsule.rotate(customIsOccupiedCheck)) {
            this.updateCapsuleVisualPosition();
        }
    }

    /**
     * @method updateCapsuleVisualPosition
     * @description Synchronizes the visual position of the `currentCapsule`
     * (the container) with the grid position of its "base" half.
     * This is called after any movement or rotation.
     * @private
     */
    private updateCapsuleVisualPosition(): void {
        if (!this.currentCapsule) return;

        // The container's (x,y) should be the center of its "base" half's grid cell.
        const baseHalf = this.currentCapsule.half1IsFirst ? this.currentCapsule.half1 : this.currentCapsule.half2;
        const screenPos = this.gridToScreen(baseHalf.gridCol, baseHalf.gridRow);
        this.currentCapsule.setPosition(screenPos.x, screenPos.y);
    }

    /**
     * @method landCapsule
     * @description Handles the logic when a `currentCapsule` lands and can no longer fall.
     * It adds the capsule's halves to the `GameGrid` as static pieces,
     * triggers match processing, and then checks for win/game over conditions.
     * @private
     * @async
     */
    private async landCapsule(): Promise<void> {
        // Access isGameOver directly as it's a property of this class
        if (!this.currentCapsule || this.isGameOver) return;

        console.log('GameScene: Capsule landed!');

        // Ensure the capsule's visual position is updated to its final resting place
        this.updateCapsuleVisualPosition();

        // Get references to the halves
        const landedHalf1 = this.currentCapsule.half1;
        const landedHalf2 = this.currentCapsule.half2;

        // Mark the capsule as not falling (it's about to be separated)
        this.currentCapsule.isFalling = false;

        // Add the halves to the game grid as static pieces.
        this.gameGrid.set(landedHalf1.gridCol, landedHalf1.gridRow, landedHalf1);
        this.gameGrid.set(landedHalf2.gridCol, landedHalf2.gridRow, landedHalf2);

        // Immediately separate the capsule into two independent halves.
        // This ensures they are treated as individual pieces for gravity and future matches.
        this.currentCapsule.separateHalves();

        // Clear reference to the falling capsule, as it has now broken into individual halves.
        this.currentCapsule = null; 

        console.log('GameScene: Capsule halves added to grid. Starting match processing...');

        // Process any matches created by the landing capsule
        await this.matchSystem.processMatches();

        console.log('GameScene: Match processing complete.');

        // After match processing and gravity, check game conditions
        if (this.checkWinCondition()) {
            this.handleLevelComplete();
        } else if (this.checkGameOverCondition()) {
            this.handleGameOver();
        } else {
            // If game is not over and not won, spawn a new capsule
            this.spawnNewCapsule();
        }
    }

    /**
     * @method checkWinCondition
     * @description Checks if the player has won the current level by clearing all pathogens.
     * @returns {boolean} True if all pathogens are cleared, false otherwise.
     * @private
     */
    private checkWinCondition(): boolean {
        const pathogenCount = this.gameGrid.countPathogens();
        this.updatePathogenCountDisplay(); // Keep UI updated
        console.log(`GameScene: Remaining pathogens: ${pathogenCount}.`);
        return pathogenCount === 0;
    }

    /**
     * @method checkGameOverCondition
     * @description Checks if the game should end due to pieces reaching the bottle neck.
     * @returns {boolean} True if game over conditions are met, false otherwise.
     * @private
     */
    private checkGameOverCondition(): boolean {
        // Game over if any piece occupies the bottle neck area
        const gameOver = !this.gameGrid.isBottleNeckClear();
        if (gameOver) {
            console.log('GameScene: Game Over condition met - bottle neck occupied!');
        }
        return gameOver;
    }

    /**
     * @method handleLevelComplete
     * @description Manages the state when the player successfully clears a level.
     * @private
     */
    private handleLevelComplete(): void {
        console.log('GameScene: Level Complete! All pathogens cleared!');
        // Access isGameOver directly as it's a property of this class
        this.isGameOver = true; // Set game over flag to stop input/falling

        // TODO: Implement actual level complete screen/logic (e.g., transition to next level, show score summary)
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'LEVEL COMPLETE!', {
            fontFamily: 'Inter',
            fontSize: '48px',
            color: GameConfig.COLORS.PEAR,
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(100);

        // Return to main menu after a delay
        this.time.delayedCall(3000, () => {
            this.scene.start('MainMenuScene');
        }, [], this);
    }

    /**
     * @method handleGameOver
     * @description Manages the state when the game ends (game over).
     * Stops game logic, displays a message, and transitions back to the main menu.
     * @private
     */
    private handleGameOver(): void {
        // Access isGameOver directly as it's a property of this class
        this.isGameOver = true; // Set game over flag to stop input/falling

        // Stop the current capsule from falling and destroy it
        if (this.currentCapsule) {
            this.currentCapsule.isFalling = false;
            // The capsule container should not be destroyed here, as its halves might still be in the grid.
            // MatchSystem.separateCapsule will handle destroying the container if both halves are cleared.
            // If only one half was cleared, the remaining half is detached and the container destroyed by separateCapsule.
            // If it's game over due to spawn block, the currentCapsule object is still valid and needs to be destroyed.
            // If it's game over due to bottle neck, the currentCapsule would have landed already and been set to null.
            // So, only destroy if it's still a falling capsule.
            if (this.currentCapsule.active) { // Check if it's still active before destroying
                this.currentCapsule.destroy();
            }
            this.currentCapsule = null;
        }

        // Clear input state to prevent further actions
        this.keyHeldTime.clear();
        this.keyRepeatTime.clear();

        console.log('GameScene: Game Over!');

        // Display "Game Over" text
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER!', {
            fontFamily: 'Inter',
            fontSize: '64px',
            color: GameConfig.COLORS.HOT_PINK,
            fontStyle: 'bold',
            shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 8, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(100); // Ensure it's on top

        // Return to main menu after a delay
        this.time.delayedCall(3000, () => {
            this.scene.start('MainMenuScene');
        }, [], this);
    }

    /**
     * @method gridToScreen
     * @description Converts grid coordinates (column and row) to screen coordinates (x, y)
     * for positioning Phaser game objects.
     * @param {number} col - The column index in the game grid.
     * @param {number} row - The row index in the game grid.
     * @returns {Phaser.Math.Vector2} A Phaser Vector2 object representing the center screen coordinates of the tile.
     */
    public gridToScreen(col: number, row: number): Phaser.Math.Vector2 {
        // Calculate the center position of a tile at the given grid coordinates
        const x = this.fieldX + (col * GameConfig.TILE_SIZE) + (GameConfig.TILE_SIZE / 2);
        const y = this.fieldY + (row * GameConfig.TILE_SIZE) + (GameConfig.TILE_SIZE / 2);
        return new Phaser.Math.Vector2(x, y);
    }

    /**
     * @method screenToGrid
     * @description Converts screen coordinates (x, y) to grid coordinates (column and row).
     * @param {number} x - The x-coordinate in screen space.
     * @param {number} y - The y-coordinate in screen space.
     * @returns {{col: number, row: number} | null} An object with `col` and `row` properties,
     * or `null` if the screen coordinates are outside the game grid.
     */
    public screenToGrid(x: number, y: number): { col: number, row: number } | null {
        // Calculate the grid cell based on screen position relative to the field's top-left
        const col = Math.floor((x - this.fieldX) / GameConfig.TILE_SIZE);
        const row = Math.floor((y - this.fieldY) / GameConfig.TILE_SIZE);

        // Check if the calculated grid coordinates are within bounds
        if (col >= 0 && col < GameConfig.FIELD_WIDTH && row >= 0 && row < GameConfig.FIELD_HEIGHT) {
            return { col, row };
        }
        return null; // Outside the grid
    }
}

// Augment Phaser.Scene to include gameGrid property for easier access in entities
declare module 'phaser' {
    namespace Scenes {
        interface Scene {
            gameGrid: GameGrid;
            gridToScreen(col: number, row: number): Phaser.Math.Vector2;
            screenToGrid(x: number, y: number): { col: number, row: number } | null;
        }
    }
}
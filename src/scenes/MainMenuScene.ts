// src/scenes/MainMenuScene.ts
/**
 * @file MainMenuScene.ts
 * @description This scene represents the main menu of the game,
 * allowing players to select level and speed before starting the game.
 */

import Phaser from 'phaser';
import { GameConfig, ColorType } from '../config/GameConfig';

/**
 * @class MainMenuScene
 * @extends Phaser.Scene
 * @description Manages the main menu UI, including level and speed selection,
 * and the start game button.
 */
export class MainMenuScene extends Phaser.Scene {
    /**
     * @property {number} selectedLevel
     * @description The currently selected game level.
     * @private
     */
    private selectedLevel: number = 0;

    /**
     * @property {'LOW' | 'MEDIUM' | 'HIGH'} selectedSpeed
     * @description The currently selected game speed.
     * @private
     */
    private selectedSpeed: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    /**
     * @property {Phaser.GameObjects.Text} levelText
     * @description Reference to the Phaser Text object displaying the current level.
     * @private
     */
    private levelText!: Phaser.GameObjects.Text;

    /**
     * @property {Phaser.GameObjects.Text} speedText
     * @description Reference to the Phaser Text object displaying the current speed.
     * @private
     */
    private speedText!: Phaser.GameObjects.Text;

    /**
     * @constructor
     * @description Creates an instance of MainMenuScene.
     * Sets the scene key for identification.
     */
    constructor() {
        super('MainMenuScene');
    }

    /**
     * @method create
     * @description Phaser's built-in method for creating game objects.
     * This method is called once after the scene is initialized.
     * Used to set up all UI elements for the main menu.
     */
    create(): void {
        console.log('MainMenuScene: Creating UI elements.');

        // Set background color from GameConfig
        this.cameras.main.setBackgroundColor(GameConfig.COLORS.BACKGROUND);

        // Create the game title
        this.createTitle();

        // Create level and speed selectors
        this.createLevelSelector();
        this.createSpeedSelector();

        // Create the start game button
        this.createStartButton();

        // Create game instructions
        this.createInstructions();
    }

    /**
     * @method createTitle
     * @description Creates and positions the main game title and subtitle.
     * @private
     */
    private createTitle(): void {
        const { width, height } = this.scale;

        // Main title text
        this.add.text(width * 0.5, height * 0.1, 'SCRUFFRX', {
            fontFamily: 'Inter',
            fontSize: '48px',
            color: GameConfig.COLORS.HOT_PINK,
            fontStyle: 'bold',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 4,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Subtitle text
        this.add.text(width * 0.5, height * 0.18, 'A Dr. Mario Clone', {
            fontFamily: 'Inter',
            fontSize: '20px',
            color: GameConfig.COLORS.SKY_BLUE,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
    }

    /**
     * @method createLevelSelector
     * @description Creates the UI elements for selecting the game level,
     * including a label, the current level display, and arrow buttons.
     * @private
     */
    private createLevelSelector(): void {
        const { width, height } = this.scale;
        const yPos = height * 0.4; // Vertical position for the level selector

        // Level label
        this.add.text(width * 0.5 - 60, yPos, 'LEVEL:', {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5, 0.5);

        // Level value (will be updated)
        this.levelText = this.add.text(width * 0.5 + 10, yPos, this.selectedLevel.toString(), {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: GameConfig.COLORS.PEAR,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Left arrow button for level
        this.createArrowButton(width * 0.5 - 120, yPos, 'left', () => this.changeLevel(-1));
        // Right arrow button for level
        this.createArrowButton(width * 0.5 + 120, yPos, 'right', () => this.changeLevel(1));
    }

    /**
     * @method createSpeedSelector
     * @description Creates the UI elements for selecting the game speed,
     * including a label, the current speed display, and arrow buttons.
     * @private
     */
    private createSpeedSelector(): void {
        const { width, height } = this.scale;
        const yPos = height * 0.5; // Vertical position for the speed selector

        // Speed label
        this.add.text(width * 0.5 - 60, yPos, 'SPEED:', {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5, 0.5);

        // Speed value
        this.speedText = this.add.text(width * 0.5 + 20, yPos, this.selectedSpeed, {
            fontFamily: 'Inter',
            fontSize: '24px',
            color: GameConfig.COLORS.PEAR,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        // Left arrow button for speed
        this.createArrowButton(width * 0.5 - 120, yPos, 'left', () => this.changeSpeed(-1));
        // Right arrow button for speed
        this.createArrowButton(width * 0.5 + 120, yPos, 'right', () => this.changeSpeed(1));
    }

    /**
     * @method createArrowButton
     * @description Creates a clickable arrow button using a sprite from the 'buttons' spritesheet.
     * @param {number} x - The x-coordinate of the button.
     * @param {number} y - The y-coordinate of the button.
     * @param {'left' | 'right'} type - The type of arrow button ('left' or 'right').
     * @param {() => void} onClick - The callback function to execute when the button is clicked.
     * @private
     */
    private createArrowButton(x: number, y: number, type: 'left' | 'right', onClick: () => void): void {
        // Frame 0 for left arrow, Frame 1 for right arrow
        const frame = type === 'left' ? 0 : 1;
        const button = this.add.sprite(x, y, 'buttons', frame)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true }) // Show hand cursor on hover
            .on('pointerdown', () => {
                // Scale down on press for visual feedback
                button.setScale(0.9);
            })
            .on('pointerup', () => {
                // Scale back up and trigger action on release
                button.setScale(1);
                onClick();
                // this.sound.add('button_click', { volume: 0.5 }).play(); // Play a sound (if loaded)
            })
            .on('pointerout', () => {
                // Scale back up if pointer leaves while pressed
                button.setScale(1);
            });

        // Add some visual flair
        this.tweens.add({
            targets: button,
            scale: { from: 1, to: 1.10 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: Math.random() * 200 // Slight delay for subtle variation
        });
    }

    /**
     * @method createStartButton
     * @description Creates the "START GAME" button using three sprite frames
     * to form a larger, more visually appealing button.
     * @private
     */
    private createStartButton(): void {
        const { width, height } = this.scale;
        const yPos = height * 0.65; // Vertical position for the start button
        const buttonSpacing = GameConfig.TILE_SIZE; // Spacing between button parts

        // Define the parts of the start button and their corresponding sprite frames
        const buttonParts = [
            { type: 'start-left', frame: 2 },   // Frame 2 for left part of START button
            { type: 'start-middle', frame: 3 }, // Frame 3 for middle part of START button
            { type: 'start-right', frame: 4 }   // Frame 4 for right part of START button
        ];

        // Create each part of the button
        buttonParts.forEach((part, index) => {
            const xPos = width * 0.5 - buttonSpacing + (index * buttonSpacing);
            const button = this.add.sprite(xPos, yPos, 'buttons', part.frame)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    // Scale down on press for visual feedback
                    button.setScale(0.9);
                })
                .on('pointerup', () => {
                    // Scale back up and trigger action on release
                    button.setScale(1);
                    this.startGame();
                    // this.sound.add('button_click', { volume: 0.5 }).play(); // Play a sound (if loaded)
                })
                .on('pointerout', () => {
                    // Scale back up if pointer leaves while pressed
                    button.setScale(1);
                });

            // Add a subtle hover effect
            button.on('pointerover', () => {
                this.tweens.add({
                    targets: button,
                    scale: 1.1,
                    duration: 100,
                    ease: 'Sine.easeOut'
                });
            });
            button.on('pointerout', () => {
                this.tweens.add({
                    targets: button,
                    scale: 1,
                    duration: 100,
                    ease: 'Sine.easeOut'
                });
            });
        });
    }

    /**
     * @method createInstructions
     * @description Creates and positions the game instruction text.
     * @private
     */
    private createInstructions(): void {
        const { width, height } = this.scale;
        const instructions = [
            'Clear all pathogens to win!',
            'Match 4 or more colors in a row/column',
            '← → to move, ↑ to rotate, ↓ for fast drop'
        ];

        instructions.forEach((text, index) => {
            this.add.text(width * 0.5, height * 0.8 + (index * 25), text, {
                fontFamily: 'Inter',
                fontSize: '16px',
                color: '#CCCCCC', // Light gray for instructions
                align: 'center'
            }).setOrigin(0.5);
        });
    }

    /**
     * @method changeLevel
     * @description Adjusts the selected game level, clamping it between
     * `MIN_LEVEL` and `MAX_LEVEL` defined in `GameConfig`.
     * Updates the displayed level text.
     * @param {number} delta - The amount to change the level by (e.g., -1 for down, 1 for up).
     * @private
     */
    private changeLevel(delta: number): void {
        this.selectedLevel = Phaser.Math.Clamp(
            this.selectedLevel + delta,
            GameConfig.MIN_LEVEL,
            GameConfig.MAX_LEVEL
        );
        this.levelText.setText(this.selectedLevel.toString());
    }

    /**
     * @method changeSpeed
     * @description Cycles through the available game speeds ('LOW', 'MEDIUM', 'HIGH').
     * Updates the displayed speed text.
     * @param {number} delta - The direction to change speed (-1 for previous, 1 for next).
     * @private
     */
    private changeSpeed(delta: number): void {
        const speeds: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['LOW', 'MEDIUM', 'HIGH'];
        const currentIndex = speeds.indexOf(this.selectedSpeed);
        let newIndex = currentIndex + delta;

        // Wrap around the array
        if (newIndex < 0) {
            newIndex = speeds.length - 1;
        } else if (newIndex >= speeds.length) {
            newIndex = 0;
        }

        this.selectedSpeed = speeds[newIndex];
        this.speedText.setText(this.selectedSpeed);
    }

    /**
     * @method startGame
     * @description Initiates the transition to the `GameScene`,
     * passing the selected level and speed as data.
     * @private
     */
    private startGame(): void {
        console.log(`MainMenuScene: Starting game with Level: ${this.selectedLevel}, Speed: ${this.selectedSpeed}`);
        this.scene.start('GameScene', {
            level: this.selectedLevel,
            speed: this.selectedSpeed
        });
    }
}
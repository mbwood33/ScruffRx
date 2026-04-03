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

    private selectedMusicIndex: number = 0;
    private musicOptions: string[] = ['SYNTHOTONIN', 'MAO', 'OFF'];
    private musicText!: Phaser.GameObjects.Text;
    private titleMusic!: Phaser.Sound.BaseSound;
    private isStarting: boolean = false;
    private hasPreviewedMusic: boolean = false;

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

        // Reset the start lock in case we came back from a Game Over
        this.isStarting = false;
        this.hasPreviewedMusic = false;

        // Stop any music playing from a previous Game Over
        this.sound.stopAll();
        this.sound.removeAll();

        // Set background color from GameConfig
        this.cameras.main.setBackgroundColor(GameConfig.COLORS.BACKGROUND);

        // Create the game title
        this.createTitle();

        // Create level and speed selectors
        this.createLevelSelector();
        this.createSpeedSelector();

        // Create music selector
        this.createMusicSelector();

        // Create the start game button
        this.createStartButton();

        // Create game instructions
        this.createInstructions();

        // Handle the browser autoplay lock safely
        this.sound.off('unlocked');

        if (this.sound.locked) {
            this.sound.once('unlocked', () => {
                this.startTitleMusic();
            });
        } else {
            this.startTitleMusic();
        }
    }

    private startTitleMusic(): void {
        if (this.titleMusic && this.titleMusic.isPlaying) {
            console.log('MainMenuScene: Title music is already playing.');
            return;
        }

        // Only play if they haven't already clicked the music preview arrows
        if (!this.hasPreviewedMusic && !this.isStarting) {
            this.titleMusic = this.sound.add('LoveXR');
            this.titleMusic.play({ loop: false });
            console.log('MainMenuScene: Title music started.');
            console.debug(`MainMenuScene: titleMusic.isPlaying = ${this.titleMusic.isPlaying}`);
        }
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
     * @method createMusicSelector
     * @description Creates the UI elements for selecting the background music.
     * @private
     */
    private createMusicSelector(): void {
        const { width, height } = this.scale;
        const yPos = height * 0.6;  // Positioned below speed

        this.add.text(width * 0.5 - 60, yPos, 'MUSIC:', {
            fontFamily: 'Inter', fontSize: '24px', color: '#FFFFFF'
        }).setOrigin(0.5, 0.5);

        // CRITICAL: Ensure this is 'this.musicText =' and NOT 'const musicText ='
        this.musicText = this.add.text(width * 0.5 + 40, yPos, this.musicOptions[this.selectedMusicIndex], {
            fontFamily: 'Inter', fontSize: '20px', color: GameConfig.COLORS.PEAR, fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        this.createArrowButton(width * 0.5 - 120, yPos, 'left', () => this.changeMusic(-1));
        this.createArrowButton(width * 0.5 + 160, yPos, 'right', () => this.changeMusic(1));
    }

    /**
     * @method changeMusic
     * @description Cycles through music options and previews the track
     * @private
     */
    private changeMusic(delta: number): void {
        this.hasPreviewedMusic = true;
        console.debug(`changeMusic(${delta}): hasPreviewdMusic = ${this.hasPreviewedMusic}`);

        this.selectedMusicIndex += delta;
        console.debug(`changeMusic(${delta}): selectedMusicIndex = ${this.selectedMusicIndex}`);
        if (this.selectedMusicIndex < 0) this.selectedMusicIndex = this.musicOptions.length - 1;
        if (this.selectedMusicIndex >= this.musicOptions.length) this.selectedMusicIndex = 0;

        const selection = this.musicOptions[this.selectedMusicIndex];
        console.debug(`changeMusic(${delta}): selection = ${selection}`);
        
        if (this.musicText) {
            this.musicText.setText(selection);
            console.debug(`changeMusic(${delta}): musicText.text = ${this.musicText.text}`);
        }

        // Stop all currently playing sounds (this will force any playing track to emit 'complete')
        this.sound.stopAll();
        console.debug(`changeMusic(${delta}): sound.stopAll()`);

        // Preview the new selection
        if (selection === 'SYNTHOTONIN') {
            this.sound.play('Synthotonin', { loop: true });
            console.debug(`changeMusic(${delta}): sound.play('Synthotonin', { loop: true })`);
        } else if (selection === 'MAO') {
            const startNode = this.sound.add('MAO_start');
            const loopNode = this.sound.add('MAO_loop', { loop: true });
            
            startNode.play();
            startNode.once('complete', () => {
                // TYPE-SAFE FIX: Only play the loop if MAO is still the selected track!
                if (this.musicOptions[this.selectedMusicIndex] === 'MAO') {
                    loopNode.play();
                    console.debug(`changeMusic(${delta}): sound.play('MAO_loop', { loop: true })`);
                }
            });
        }
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
        const yPos = height * 0.72; // Vertical position for the start button
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
            'A/D to move, S to drop',
            'K/L to rotate CCW/CW'
        ];

        instructions.forEach((text, index) => {
            this.add.text(width * 0.5, height * 0.83 + (index * 25), text, {
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
        // Prevent double-clicks from running this routine twice
        if (this.isStarting) return;
        this.isStarting = true;

        console.log(`MainMenuScene: Starting game with Level: ${this.selectedLevel}, Speed: ${this.selectedSpeed}`);

        const selection = this.musicOptions[this.selectedMusicIndex];

        // Explicitly stop the title music if it's still playing
        if (this.titleMusic) {
            this.titleMusic.stop();
        }

        // If the user NEVER touched the music arrows, the background music 
        // hasn't been queued yet, so we safely start it here. 
        // If they DID touch the arrows, it's already playing smoothly from the preview!
        if (!this.hasPreviewedMusic && selection !== 'OFF') {
            if (selection === 'SYNTHOTONIN') {
                this.sound.play('Synthotonin', { loop: true });
            } else if (selection === 'MAO') {
                const startNode = this.sound.add('MAO_start');
                const loopNode = this.sound.add('MAO_loop', { loop: true });
                startNode.play();
                startNode.once('complete', () => loopNode.play());
            }
        }

        // Explicitly set score to 0 here so fresh games from the menu start clean
        this.scene.start('GameScene', {
            level: this.selectedLevel,
            speed: this.selectedSpeed,
            score: 0 
        });
    }
}
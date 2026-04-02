/**
 * @file Capsule.ts
 * @description Defines the Capsule and CapsuleHalf game objects for ScruffRx.
 * Capsules are composed of two halves and can move and rotate.
 * CapsuleHalves are individual pieces that can be part of a capsule or standalone.
 */

import Phaser from 'phaser';
import { GameConfig, CapsuleOrientation, ColorType } from '../config/GameConfig';
import { GameScene } from '../scenes/GameScene'; // Import GameScene for type casting

/**
 * @class CapsuleHalf
 * @extends Phaser.GameObjects.Sprite
 * @description Represents one half of a capsule or a single, disconnected piece.
 * Manages its visual representation (sprite frame) and grid position.
 */
export class CapsuleHalf extends Phaser.GameObjects.Sprite {
    /**
     * @property {ColorType} colorIndex
     * @description The color index of this capsule half (0: Pink, 1: Blue, 2: Yellow).
     * @readonly
     */
    public readonly colorIndex: ColorType;

    /**
     * @property {Capsule | null} parentCapsule
     * @description A reference to the parent `Capsule` if this half is part of one, otherwise null.
     */
    public parentCapsule: Capsule | null = null;

    /**
     * @property {number} gridCol
     * @description The current column position of this half on the game grid.
     */
    public gridCol: number = 0;

    /**
     * @property {number} gridRow
     * @description The current row position of this half on the game grid.
     */
    public gridRow: number = 0;

    /**
     * @constructor
     * @description Creates a new capsule half.
     * @param {Phaser.Scene} scene - The Phaser scene this object belongs to.
     * @param {number} x - The initial x-coordinate in screen space.
     * @param {number} y - The initial y-coordinate in screen space.
     * @param {ColorType} colorIndex - The color of this half (0=pink, 1=blue, 2=yellow).
     */
    constructor(scene: Phaser.Scene, x: number, y: number, colorIndex: ColorType) {
        // Call the super constructor for Phaser.GameObjects.Sprite
        // 'sprite_sheet' is the key to refer to the loaded spritesheet asset
        super(scene, x, y, 'sprite_sheet');

        this.colorIndex = colorIndex;

        // Set the origin to the center of the sprite for easier positioning and rotation
        this.setOrigin(0.5);

        // Add this sprite to the scene
        scene.add.existing(this);
    }

    /**
     * @method updateSprite
     * @description Updates the sprite frame of this capsule half based on its orientation
     * and whether it's the first or second half of a capsule.
     * @param {CapsuleOrientation} orientation - The orientation of the parent capsule ('horizontal' or 'vertical').
     * @param {boolean} isFirst - True if this is the "first" half (left for horizontal, top for vertical), false otherwise.
     */
    public updateSprite(orientation: CapsuleOrientation, isFirst: boolean): void {
        let frameIndex: number;

        /*
         * Sprite Sheet Layout for Capsules (Rows 0-2 for colors, 3 for half-capsules):
         *
         * Row 0 (Pink):
         * 0: Pink horizontal left
         * 1: Pink horizontal right
         * 2: Pink vertical top
         * 3: Pink vertical bottom
         * Row 1 (Blue):
         * 4: Blue horizontal left
         * 5: Blue horizontal right
         * 6: Blue vertical top
         * 7: Blue vertical bottom
         * Row 2 (Yellow):
         * 8: Yellow horizontal left
         * 9: Yellow horizontal right
         * 10: Yellow vertical top
         * 11: Yellow vertical bottom
         * Row 3 (Half-Capsules):
         * 12: Pink half-capsule (disconnected)
         * 13: Blue half-capsule (disconnected)
         * 14: Yellow half-capsule (disconnected)
         */

        const baseRow = this.colorIndex * 4; // Each color occupies 4 frames (columns) per row

        if (orientation === 'horizontal') {
            frameIndex = baseRow + (isFirst ? 0 : 1); // 0 for left, 1 for right
        } else { // vertical
            frameIndex = baseRow + (isFirst ? 2 : 3); // 2 for top, 3 for bottom
        }

        this.setFrame(frameIndex);
    }

    /**
     * @method convertToSingle
     * @description Converts this capsule half into a single, disconnected piece.
     * This typically happens when its parent capsule breaks apart (e.g., one half is cleared).
     * Updates its sprite to the 'half-capsule' appearance.
     *
     * IMPORTANT: This method only updates the sprite frame and disconnects the parent reference.
     * The `x` and `y` position of the sprite are expected to be handled by the system
     * that detaches it from its parent container (Phaser's `Container.remove` handles world position conversion).
     */
    public convertToSingle(): void {
        console.log(`CapsuleHalf: Converting to single piece (color ${this.colorIndex}) at grid (${this.gridCol}, ${this.gridRow})`);
        this.parentCapsule = null; // Disconnect from parent capsule

        /*
         * Sprite Sheet Layout for Half-Capsules (Row 3):
         * 12: Pink half-capsule (disconnected)
         * 13: Blue half-capsule (disconnected)
         * 14: Yellow half-capsule (disconnected)
         */
        const frameIndex = 12 + this.colorIndex; // Base frame for half-capsules is 12

        this.setFrame(frameIndex);
        this.setDepth(1); // Ensure single pieces are on top of background but below falling capsules

        // Removed explicit setPosition call here.
        // Phaser's Container.remove() should handle converting local to world coordinates
        // when the child is re-parented to the scene. The gridCol/gridRow are still accurate
        // for logical position, and the sprite's x/y should reflect its world position.
    }
}

/**
 * @class Capsule
 * @extends Phaser.GameObjects.Container
 * @description Represents a full capsule, composed of two `CapsuleHalf` objects.
 * Manages the movement, rotation, and overall state of the two-part capsule.
 */
export class Capsule extends Phaser.GameObjects.Container {
    /**
     * @property {CapsuleHalf} half1
     * @description The first half of the capsule.
     */
    public readonly half1: CapsuleHalf;

    /**
     * @property {CapsuleHalf} half2
     * @description The second half of the capsule.
     */
    public readonly half2: CapsuleHalf;

    /**
     * @property {CapsuleOrientation} orientation
     * @description The current orientation of the capsule ('horizontal' or 'vertical').
     */
    public orientation: CapsuleOrientation = 'horizontal';

    /**
     * @property {boolean} half1IsFirst
     * @description Determines which half is considered the "base" or "first" half for rotation logic.
     * True if half1 is the leftmost/topmost, false if half2 is.
     */
    public half1IsFirst: boolean = true;

    /**
     * @property {number} gridCol
     * @description The current column position of the capsule's "base" half on the game grid.
     */
    public gridCol: number = 0;

    /**
     * @property {number} gridRow
     * @description The current row position of the capsule's "base" half on the game grid.
     */
    public gridRow: number = 0;

    /**
     * @property {boolean} isFalling
     * @description Indicates if the capsule is currently in a falling state.
     */
    public isFalling: boolean = true;

    /**
     * @constructor
     * @description Creates a new capsule with two colored halves.
     * @param {Phaser.Scene} scene - The Phaser scene this object belongs to.
     * @param {number} x - The initial x-coordinate of the container in screen space.
     * @param {number} y - The initial y-coordinate of the container in screen space.
     * @param {ColorType} color1 - Color index of the first half (0=pink, 1=blue, 2=yellow).
     * @param {ColorType} color2 - Color index of the second half.
     * @param {CapsuleOrientation} [orientation='horizontal'] - Initial orientation of the capsule.
     */
    constructor(scene: Phaser.Scene, x: number, y: number, color1: ColorType, color2: ColorType, orientation: CapsuleOrientation = 'horizontal') {
        // Call the super constructor for Phaser.GameObjects.Container
        super(scene, x, y);

        // Create the two halves, initially at (0,0) relative to the container
        this.half1 = new CapsuleHalf(scene, 0, 0, color1);
        this.half2 = new CapsuleHalf(scene, 0, 0, color2);

        // Add halves to this container. Their positions will be relative to the container's (x,y).
        this.add([this.half1, this.half2]);

        // Set parent references for each half
        this.half1.parentCapsule = this;
        this.half2.parentCapsule = this;

        // Set initial orientation and update positions/sprites
        this.orientation = orientation;
        this.updateHalfPositions();
        this.updateHalfSprites();

        // Add this container to the scene
        scene.add.existing(this);
        this.setDepth(10); // Ensure falling capsules are on top of other elements
    }

    /**
     * @method setGridPosition
     * @description Sets the grid position of the capsule's "base" half.
     * This method also updates the relative positions of both halves and their visual positions.
     * @param {number} col - The new column position for the base half.
     * @param {number} row - The new row position for the base half.
     */
    public setGridPosition(col: number, row: number): void {
        this.gridCol = col;
        this.gridRow = row;
        this.updateHalfPositions(); // Update relative positions of halves
        // The visual position of the container itself (this.x, this.y) will be updated by GameScene
    }

    /**
     * @method rotate
     * @description Rotates the capsule 90 degrees clockwise or counterclockwise using the Dr. Mario 2x2 bounding box algorithm with wall kicks.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback function
     * @returns {boolean} True if the rotation was successful.
     */
    public rotate(isOccupiedCheck: (col: number, row: number) => boolean, clockwise: boolean = true): boolean {
        // Cast this.scene to GameScene to access its gameGrid property
        const gameScene = this.scene as any;    // Cast to access gameGrid

        
        // 1. Determine current 2x2 State and Anchor (bottom-left corner of the 2x2 box)
        let currentState = 0;
        let ax = 0, ay = 0;

        if (this.orientation === 'horizontal') {
            if (this.half1IsFirst) { currentState = 0; ax = this.half1.gridCol; ay = this.half1.gridRow; }
            else { currentState = 2; ax = this.half2.gridCol; ay = this.half2.gridRow; }
        } else {    // vertical - the BOTTOM half is the anchor
            if (this.half1IsFirst) { currentState = 1; ax = this.half2.gridCol; ay = this.half2.gridRow; }
            else { currentState = 3; ax = this.half1.gridCol; ay = this.half1.gridRow; }
        }
        
        // 2. Calculate next State
        const nextState = clockwise ? (currentState + 1) % 4 : (currentState + 3) % 4;

        // 3. Define wall kicks to attempt
        let kicks = [{dx: 0, dy: 0}];   // Always try no-kick first
        if ((currentState === 0 || currentState === 2) && (nextState === 1 || nextState === 3)) {
            // Horizontal to Vertical kicks
            kicks.push({dx: 1, dy: 0}); // Kick right
            kicks.push({dx: 0, dy: 1}); // Kick down
            kicks.push({dx: 1, dy: 1}); // Kick down + right
        } else if ((currentState === 1 || currentState === 3) && (nextState === 0 || nextState === 2)) {
            // Vertical to Horizontal kicks
            kicks.push({dx: -1, dy: 0});    // Kick left
        }

        // Helper to get raw coordinates for a given state and anchor
        const getPos = (state: number, cx: number, cy: number) => {
            switch(state) {
                case 0: return { h1: {c: cx, r: cy}, h2: {c: cx+1, r: cy} };
                case 1: return { h1: {c: cx, r: cy-1}, h2: {c: cx, r: cy} };
                case 2: return { h1: {c: cx+1, r: cy}, h2: {c: cx, r: cy} };
                case 3: return { h1: {c: cx, r: cy}, h2: {c: cx, r: cy-1} };
                default: return { h1: {c: cx, r: cy}, h2: {c: cx+1, r: cy} };
            }
        };

        let success = false;
        let finalPos = { h1: {c: 0, r:0 }, h2: {c:0, r:0} };

        // 4. Test kicks until one fits
        for (let kick of kicks) {
            let testAx = ax + kick.dx;
            let testAy = ay + kick.dy;
            let pos = getPos(nextState, testAx, testAy);

            if (!gameScene.gameGrid.isValid(pos.h1.c, pos.h1.r) || !gameScene.gameGrid.isValid(pos.h2.c, pos.h2.r)) continue;   // bounds check
            if (isOccupiedCheck(pos.h1.c, pos.h1.r) || isOccupiedCheck(pos.h2.c, pos.h2.r)) continue;   // collision check

            finalPos = pos;
            success = true;
            break;
        }

        if (!success) return false;

        // 5. Apply the valid state back to the Capsule properties
        if (nextState === 0) {
            this.orientation = 'horizontal'; this.half1IsFirst = true;
            this.gridCol = finalPos.h1.c; this.gridRow = finalPos.h1.r;
        } else if (nextState === 1) {
            this.orientation = 'vertical'; this.half1IsFirst = true;
            this.gridCol = finalPos.h1.c; this.gridRow = finalPos.h1.r;
        } else if (nextState === 2) {
            this.orientation = 'horizontal'; this.half1IsFirst = false;
            this.gridCol = finalPos.h2.c; this.gridRow = finalPos.h2.r;
        } else if (nextState === 3) {
            this.orientation = 'vertical'; this.half1IsFirst = false;
            this.gridCol = finalPos.h2.c; this.gridRow = finalPos.h2.r;
        }

        this.updateHalfPositions(); 
        this.updateHalfSprites();

        return true;
    }

    /**
     * @method updateHalfPositions
     * @description Updates the relative positions of `half1` and `half2` within the `Capsule` container
     * based on the current `orientation` and `half1IsFirst` flag.
     * This method does NOT update the screen position of the capsule container itself.
     *
     * @algorithm
     * 1. Determine which half is the "first" half (left/top) and which is "second" (right/bottom).
     * 2. Set the `gridCol` and `gridRow` for the "first" half to the capsule's `gridCol` and `gridRow`.
     * 3. Based on `orientation`:
     * - If 'horizontal': The "second" half is one tile to the right of the "first".
     * - If 'vertical': The "second" half is one tile below the "first".
     * 4. Update the `x` and `y` properties of each `CapsuleHalf` sprite relative to the container's origin (0,0).
     * Since `setOrigin(0.5)` is used on the sprites, their `x` and `y` should be multiples of `TILE_SIZE`.
     */
    private updateHalfPositions(): void {
        const TILE_SIZE = GameConfig.TILE_SIZE;

        if (this.half1IsFirst) { // This `this.half1IsFirst` is the *new* state
            // half1 is the base (left/top)
            this.half1.gridCol = this.gridCol; // Capsule's gridCol/Row
            this.half1.gridRow = this.gridRow;

            if (this.orientation === 'horizontal') {
                // half2 is to the right
                this.half2.gridCol = this.gridCol + 1;
                this.half2.gridRow = this.gridRow;
            } else {
                // half2 is below
                this.half2.gridCol = this.gridCol;
                this.half2.gridRow = this.gridRow + 1;
            }
        } else {
            // half2 is the base (left/top)
            this.half2.gridCol = this.gridCol; // Capsule's gridCol/Row
            this.half2.gridRow = this.gridRow;

            if (this.orientation === 'horizontal') {
                // half1 is to the right
                this.half1.gridCol = this.gridCol + 1;
                this.half1.gridRow = this.gridRow;
            } else {
                // half1 is below
                this.half1.gridCol = this.gridCol;
                this.half1.gridRow = this.gridRow + 1;
            }
        }

        // Update the visual positions of the halves relative to the container.
        // Since the container's (x,y) is the center of the first half,
        // the first half is at (0,0) relative to the container.
        // The second half's position is relative to the first.
        if (this.half1IsFirst) {
            this.half1.setPosition(0, 0); // half1 is at the container's origin
            if (this.orientation === 'horizontal') {
                this.half2.setPosition(TILE_SIZE, 0); // half2 is one tile to the right
            } else {
                this.half2.setPosition(0, TILE_SIZE); // half2 is one tile below
            }
        } else {
            this.half2.setPosition(0, 0); // half2 is at the container's origin
            if (this.orientation === 'horizontal') {
                this.half1.setPosition(TILE_SIZE, 0); // half1 is one tile to the right
            } else {
                this.half1.setPosition(0, TILE_SIZE); // half1 is one tile below
            }
        }
    }

    /**
     * @method updateHalfSprites
     * @description Updates the visual sprite frames for `half1` and `half2`
     * based on the current `orientation` and `half1IsFirst` flag.
     * This ensures the correct visual representation for the capsule.
     */
    private updateHalfSprites(): void {
        if (this.half1IsFirst) {
            this.half1.updateSprite(this.orientation, true);
            this.half2.updateSprite(this.orientation, false);
        } else {
            this.half1.updateSprite(this.orientation, false);
            this.half2.updateSprite(this.orientation, true);
        }
    }

    /**
     * @method canMoveLeft
     * @description Checks if the capsule can move one column to the left without collision.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback function
     * (typically from `GameGrid`) to check if a target grid cell is occupied.
     * @returns {boolean} True if the capsule can move left, false otherwise.
     *
     * @algorithm
     * 1. Check if the leftmost part of the capsule would go out of bounds (col < 0).
     * 2. Determine the new potential positions for both halves if moved left.
     * 3. Check if these new positions are occupied by other static pieces on the grid
     * using `isOccupiedCheck`.
     */
    public canMoveLeft(isOccupiedCheck: (col: number, row: number) => boolean): boolean {
        // Calculate the new column for the leftmost part of the capsule
        const leftmostCol = Math.min(this.half1.gridCol, this.half2.gridCol);
        if (leftmostCol <= 0) {
            return false; // Already at or past the left boundary
        }

        // Check the cells that the capsule would move into
        if (this.orientation === 'horizontal') {
            // Horizontal: check the cell to the left of the leftmost half
            if (isOccupiedCheck(leftmostCol - 1, this.gridRow)) {
                return false;
            }
        } else { // Vertical
            // Vertical: check the cells to the left of both halves
            if (isOccupiedCheck(this.gridCol - 1, this.gridRow) ||
                isOccupiedCheck(this.gridCol - 1, this.gridRow + 1)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @method canMoveRight
     * @description Checks if the capsule can move one column to the right without collision.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback function
     * (typically from `GameGrid`) to check if a target grid cell is occupied.
     * @returns {boolean} True if the capsule can move right, false otherwise.
     *
     * @algorithm
     * 1. Check if the rightmost part of the capsule would go out of bounds (col >= FIELD_WIDTH).
     * 2. Determine the new potential positions for both halves if moved right.
     * 3. Check if these new positions are occupied by other static pieces on the grid
     * using `isOccupiedCheck`.
     */
    public canMoveRight(isOccupiedCheck: (col: number, row: number) => boolean): boolean {
        // Calculate the new column for the rightmost part of the capsule
        const rightmostCol = Math.max(this.half1.gridCol, this.half2.gridCol);
        if (rightmostCol >= GameConfig.FIELD_WIDTH - 1) {
            return false; // Already at or past the right boundary
        }

        // Check the cells that the capsule would move into
        if (this.orientation === 'horizontal') {
            // Horizontal: check the cell to the right of the rightmost half
            if (isOccupiedCheck(rightmostCol + 1, this.gridRow)) {
                return false;
            }
        } else { // Vertical
            // Vertical: check the cells to the right of both halves
            if (isOccupiedCheck(this.gridCol + 1, this.gridRow) ||
                isOccupiedCheck(this.gridCol + 1, this.gridRow + 1)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @method canMoveDown
     * @description Checks if the capsule can move one row down without collision.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback function
     * (typically from `GameGrid`) to check if a target grid cell is occupied.
     * @returns {boolean} True if the capsule can move down, false otherwise.
     *
     * @algorithm
     * 1. Determine the bottommost half of the capsule.
     * 2. Check if the bottommost part of the capsule would go out of bounds (row >= FIELD_HEIGHT).
     * 3. Determine the new potential positions for both halves if moved down.
     * 4. Check if these new positions are occupied by other static pieces on the grid
     * using `isOccupiedCheck`.
     */
    public canMoveDown(isOccupiedCheck: (col: number, row: number) => boolean): boolean {
        let bottomHalf: CapsuleHalf;
        if (this.orientation === 'horizontal') {
            // For horizontal, both halves are at the same row, so pick either
            bottomHalf = this.half1;
        } else { // vertical
            // For vertical, determine which is the bottommost half based on half1IsFirst
            bottomHalf = this.half1IsFirst ? this.half2 : this.half1;
        }

        // Check if the bottommost part of the capsule would go out of bounds
        if (bottomHalf.gridRow >= GameConfig.FIELD_HEIGHT - 1) {
            return false; // Already at or past the bottom boundary
        }

        // Check the cells that the capsule would move into
        if (this.orientation === 'horizontal') {
            // Horizontal: check cells below both halves
            if (isOccupiedCheck(this.half1.gridCol, this.half1.gridRow + 1) ||
                isOccupiedCheck(this.half2.gridCol, this.half2.gridRow + 1)) {
                return false;
            }
        } else { // Vertical
            // Vertical: check cell below the bottommost half
            if (isOccupiedCheck(bottomHalf.gridCol, bottomHalf.gridRow + 1)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @method tryMoveLeft
     * @description Attempts to move the capsule one column to the left if `canMoveLeft` returns true.
     * Updates the capsule's `gridCol` and then calls `updateHalfPositions` to reflect the change.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback for collision detection.
     * @returns {boolean} True if the move was successful, false otherwise.
     */
    public tryMoveLeft(isOccupiedCheck: (col: number, row: number) => boolean): boolean {
        if (!this.canMoveLeft(isOccupiedCheck)) {
            return false;
        }
        this.setGridPosition(this.gridCol - 1, this.gridRow);
        return true;
    }

    /**
     * @method tryMoveRight
     * @description Attempts to move the capsule one column to the right if `canMoveRight` returns true.
     * Updates the capsule's `gridCol` and then calls `updateHalfPositions` to reflect the change.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback for collision detection.
     * @returns {boolean} True if the move was successful, false otherwise.
     */
    public tryMoveRight(isOccupiedCheck: (col: number, row: number) => boolean): boolean {
        if (!this.canMoveRight(isOccupiedCheck)) {
            return false;
        }
        this.setGridPosition(this.gridCol + 1, this.gridRow);
        return true;
    }

    /**
     * @method tryMoveDown
     * @description Attempts to move the capsule one row down if `canMoveDown` returns true.
     * Updates the capsule's `gridRow` and then calls `updateHalfPositions` to reflect the change.
     * @param {(col: number, row: number) => boolean} isOccupiedCheck - A callback for collision detection.
     * @returns {boolean} True if the move was successful, false otherwise.
     */
    public tryMoveDown(isOccupiedCheck: (col: number, row: number) => boolean): boolean {
        if (!this.canMoveDown(isOccupiedCheck)) {
            return false;
        }
        this.setGridPosition(this.gridCol, this.gridRow + 1);
        return true;
    }

    /**
     * @method separateHalves
     * @description Separates the capsule into two individual `CapsuleHalf` pieces.
     * This is typically called when the capsule lands and becomes static, or when one half is cleared.
     * The `Capsule` container itself is then destroyed, but its `CapsuleHalf` children remain in the scene.
     */
    public separateHalves(): void {
        console.log('Capsule: Separating halves');
        const gameScene = this.scene as GameScene; // Cast for gridToScreen

        // Remove halves from this container. Phaser will re-parent them to the scene.
        // Then convert them to single pieces, which updates their sprite and world position.
        if (this.half1.active) {
            this.remove(this.half1); // Remove from container, re-parents to scene
            this.half1.convertToSingle(); // Update sprite, set parentCapsule to null
            // Now explicitly update its world position after re-parenting
            const screenPos = gameScene.gridToScreen(this.half1.gridCol, this.half1.gridRow);
            this.half1.setPosition(screenPos.x, screenPos.y);
        } else {
            // If half1 is already inactive, it means it was destroyed (e.g., cleared by a match).
            // Just ensure its parentCapsule reference is cleared.
            this.half1.parentCapsule = null;
        }

        if (this.half2.active) {
            this.remove(this.half2);
            this.half2.convertToSingle();
            const screenPos = gameScene.gridToScreen(this.half2.gridCol, this.half2.gridRow);
            this.half2.setPosition(screenPos.x, screenPos.y);
        } else {
            // If half2 is already inactive, it means it was destroyed.
            this.half2.parentCapsule = null;
        }

        this.isFalling = false;

        // Destroy the container itself if it's empty and active
        if (this.list.length === 0 && this.active) {
            this.destroy();
            console.log('Capsule: Container destroyed after separating halves.');
        } else {
            console.warn('Capsule: Container not destroyed, still has children or is inactive.');
        }
    }
}

// src/game/MatchSystem.ts
/**
 * @file MatchSystem.ts
 * @description Handles the core logic for detecting and clearing matches
 * of 4 or more connected pieces of the same color in ScruffRx.
 * Also manages the gravity effect after pieces are cleared.
 */

import Phaser from 'phaser';
import { GameConfig, ColorType } from '../config/GameConfig';
import { GameGrid, GridCell } from './GameGrid';
import { Pathogen } from '../entities/Pathogen';
import { CapsuleHalf, Capsule } from '../entities/Capsule';
import { GameScene } from '../scenes/GameScene'; // Import for type reference

/**
 * @interface MatchGroup
 * @description Represents a group of connected pieces of the same color that form a match.
 * @property {Array<{col: number, row: number, entity: Pathogen | CapsuleHalf}>} pieces - An array of objects, each containing the grid coordinates and the game entity (Pathogen or CapsuleHalf) that are part of this match.
 * @property {ColorType} color - The color index of the matched pieces.
 */
interface MatchGroup {
    pieces: Array<{ col: number, row: number, entity: Pathogen | CapsuleHalf }>;
    color: ColorType;
}

/**
 * @class MatchSystem
 * @description Manages match detection, clearing animations, and gravity effects.
 * It interacts with the `GameGrid` to query and modify piece positions,
 * and with the Phaser `Scene` to create and manage animations.
 */
export class MatchSystem {
    /**
     * @property {GameGrid} grid
     * @description Reference to the game's grid system.
     * @private
     */
    private grid: GameGrid;

    /**
     * @property {GameScene} scene
     * @description Reference to the Phaser GameScene, used for adding tweens/animations
     * and converting grid coordinates to screen coordinates.
     * @private
     */
    private scene: GameScene;

    /**
     * @property {boolean} isProcessing
     * @description Flag to indicate if the match system is currently busy processing matches
     * (clearing, dropping, re-checking). Prevents new inputs/actions during this time.
     * @private
     */
    private isProcessing: boolean = false;

    /**
     * @constructor
     * @description Creates a new MatchSystem instance.
     * @param {GameGrid} grid - The game grid to operate on.
     * @param {GameScene} scene - The Phaser GameScene to manage animations and coordinates.
     */
    constructor(grid: GameGrid, scene: GameScene) {
        this.grid = grid;
        this.scene = scene;
        console.log('MatchSystem: Initialized.');
    }

    /**
     * @method processMatches
     * @description The main entry point for match processing.
     * This asynchronous method repeatedly finds matches, clears them, applies gravity,
     * and then re-checks for new matches (chain reactions) until no more matches are found.
     * @returns {Promise<void>} A promise that resolves when all match processing (including chains) is complete.
     *
     * @algorithm
     * 1. Set `isProcessing` flag to true to block other game actions.
     * 2. Enter a loop that continues as long as matches are found:
     * a. Call `findMatches()` to identify all current match groups on the grid.
     * b. If no matches are found, break the loop.
     * c. Increment `chainCount` to track chain reactions.
     * d. Call `clearMatches()` to animate the removal of matched pieces. Await its completion.
     * e. Call `applyGravity()` to make floating pieces fall. Await its completion.
     * f. Introduce a small delay to allow visual settling before the next match check.
     * 3. Reset `isProcessing` flag to false.
     */
    public async processMatches(): Promise<void> {
        if (this.isProcessing) {
            console.log('MatchSystem: Already processing matches, skipping new request.');
            return;
        }

        this.isProcessing = true;
        console.log('MatchSystem: Starting match processing cycle.');

        try {
            let totalCleared = 0;
            let chainCount = 0;

            // Loop to handle chain reactions
            while (true) {
                const matches = this.findMatches(); // Find all current matches

                if (matches.length === 0) {
                    console.log(`MatchSystem: No more matches found. Chain ended after ${chainCount} reactions.`);
                    break; // No matches, exit the loop
                }

                chainCount++;
                console.log(`MatchSystem: Chain ${chainCount} - Found ${matches.length} match groups.`);

                // Clear the matched pieces with animations
                const clearedCount = await this.clearMatches(matches);
                totalCleared += clearedCount;
                this.scene.events.emit('scoreUpdate', clearedCount); // Notify GameScene for scoring

                // Apply gravity to make pieces fall into newly empty spaces
                const piecesDropped = await this.applyGravity();
                console.log(`MatchSystem: ${piecesDropped} pieces dropped due to gravity.`);

                // Small delay to allow pieces to settle visually before checking for new matches
                await this.delay(300);
            }

            console.log(`MatchSystem: Match processing complete. Total pieces cleared: ${totalCleared}. Total chains: ${chainCount}.`);
        } finally {
            this.isProcessing = false; // Ensure the flag is reset even if an error occurs
        }
    }

    /**
     * @method findMatches
     * @description Identifies all groups of 4 or more connected pieces (Pathogen or CapsuleHalf)
     * of the same color, horizontally or vertically, adhering to Dr. Mario's linear match rules.
     * @returns {MatchGroup[]} An array containing a single `MatchGroup` with all unique matched pieces,
     * or an empty array if no matches are found.
     *
     * @algorithm
     * 1. Initialize an empty `Set<string>` called `allMatchedPieces` to store unique "col,row" keys of pieces found in any valid line.
     * 2. Iterate through every cell (`col`, `row`) in the game grid:
     * a. Get the `entity` at the current cell. Skip if empty or not a game piece.
     * b. Get the `targetColor` of the entity.
     * c. Call `getLinearMatch` twice: once for horizontal (`dx=1, dy=0`) and once for vertical (`dx=0, dy=1`).
     * d. If either `horizontalLine` or `verticalLine` has 4 or more pieces:
     * i. Add the "col,row" key of each piece in that line to `allMatchedPieces`.
     * 3. If `allMatchedPieces` is not empty, create a single `MatchGroup` from its contents and return it in an array.
     * 4. Otherwise, return an empty array.
     */
    private findMatches(): MatchGroup[] {
        console.log('MatchSystem: Starting Dr. Mario style match detection...');
        const allMatchedPieces = new Set<string>(); // Use a Set to store "col,row" strings of unique matched pieces

        // Iterate through every cell in the grid
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const entity = this.grid.get(col, row);

                // Skip if empty or not a game piece
                if (!(entity instanceof Pathogen || entity instanceof CapsuleHalf)) {
                    continue;
                }

                const targetColor = entity.colorIndex;

                // Check for horizontal matches starting from this cell
                const horizontalLine = this.getLinearMatch(col, row, 1, 0, targetColor);
                if (horizontalLine.length >= 4) {
                    horizontalLine.forEach(p => allMatchedPieces.add(`${p.col},${p.row}`));
                }

                // Check for vertical matches starting from this cell
                const verticalLine = this.getLinearMatch(col, row, 0, 1, targetColor);
                if (verticalLine.length >= 4) {
                    verticalLine.forEach(p => allMatchedPieces.add(`${p.col},${p.row}`));
                }
            }
        }

        // Convert the set of matched piece coordinates back into a MatchGroup format
        const finalMatchGroup: MatchGroup = { pieces: [], color: 0 }; // Color doesn't matter for the overall group

        allMatchedPieces.forEach(key => {
            const [colStr, rowStr] = key.split(',');
            const col = parseInt(colStr);
            const row = parseInt(rowStr);
            const entity = this.grid.get(col, row);
            if (entity instanceof Pathogen || entity instanceof CapsuleHalf) {
                finalMatchGroup.pieces.push({ col, row, entity });
            }
        });

        if (finalMatchGroup.pieces.length > 0) {
            console.log(`MatchSystem: Found a total of ${finalMatchGroup.pieces.length} unique matched pieces.`);
            // Return as an array containing a single MatchGroup with all unique matched pieces
            // This simplifies clearMatches as it processes all at once.
            return [finalMatchGroup];
        }

        console.log('MatchSystem: No Dr. Mario style matches found.');
        return []; // No matches
    }

    /**
     * @method getLinearMatch
     * @description Helper function to find a contiguous line of pieces of the same color
     * in a specific direction (horizontal or vertical).
     * @param {number} startCol - The starting column.
     * @param {number} startRow - The starting row.
     * @param {number} dx - The column increment for the direction (e.g., 1 for right, 0 for vertical).
     * @param {number} dy - The row increment for the direction (e.g., 0 for horizontal, 1 for down).
     * @param {ColorType} targetColor - The color to match.
     * @returns {Array<{col: number, row: number, entity: Pathogen | CapsuleHalf}>} An array of pieces
     * that form a contiguous line of the target color starting from (startCol, startRow) in the given direction.
     * @private
     */
    private getLinearMatch(
        startCol: number,
        startRow: number,
        dx: number,
        dy: number,
        targetColor: ColorType
    ): Array<{ col: number, row: number, entity: Pathogen | CapsuleHalf }> {
        const line: Array<{ col: number, row: number, entity: Pathogen | CapsuleHalf }> = [];
        let currentCol = startCol;
        let currentRow = startRow;

        while (this.grid.isValid(currentCol, currentRow)) {
            const entity = this.grid.get(currentCol, currentRow);

            if (entity instanceof Pathogen || entity instanceof CapsuleHalf) {
                if (entity.colorIndex === targetColor) {
                    line.push({ col: currentCol, row: currentRow, entity: entity });
                } else {
                    break; // Color mismatch, end of line
                }
            } else {
                break; // Empty cell or non-game piece, end of line
            }

            currentCol += dx;
            currentRow += dy;
        }
        return line;
    }

    /**
     * @method clearMatches
     * @description Animates the clearing of matched pieces (shrinking and fading)
     * and removes them from the game grid and scene.
     * Handles the separation of capsules if only one half is cleared.
     * @param {MatchGroup[]} matches - An array of `MatchGroup` objects to be cleared.
     * @returns {Promise<number>} A promise that resolves with the total number of pieces cleared
     * once all clearing animations are complete.
     *
     * @algorithm
     * 1. Initialize `totalCleared` count and an array `clearPromises` to hold promises for each animation.
     * 2. Initialize a `Set` called `capsulesToSeparate` to track parent capsules that need to be broken apart.
     * 3. Iterate through each `match` in the `matches` array:
     * a. For each `piece` in the `match.pieces`:
     * i. If the `entity` is a `CapsuleHalf` and it has a `parentCapsule`:
     * - Remove the `CapsuleHalf` from its parent `Capsule` container. This detaches it visually.
     * - Add the `parentCapsule` to `capsulesToSeparate` for later processing.
     * ii. Remove the piece from the `GameGrid` immediately using `this.grid.remove()`.
     * iii. Increment `totalCleared`.
     * iv. Call `animateClearPiece()` to start the visual clearing animation for the `entity`.
     * Add the returned promise to `clearPromises`.
     * 4. After processing all pieces in all matches, iterate through `capsulesToSeparate`:
     * a. For each `capsule` in the set, call `separateCapsule()` to handle its breakdown.
     * 5. Use `Promise.all(clearPromises)` to wait for all individual clearing animations to finish.
     * 6. Return `totalCleared`.
     */
    private async clearMatches(matches: MatchGroup[]): Promise<number> {
        let totalCleared = 0;
        const clearPromises: Promise<void>[] = [];
        const capsulesToSeparate = new Set<Capsule>(); // Use a Set to avoid processing the same capsule multiple times

        // Iterate through all found matches
        for (const match of matches) {
            for (const piece of match.pieces) {
                // If this piece is a capsule half and has a parent capsule, detach it
                if (piece.entity instanceof CapsuleHalf && piece.entity.parentCapsule) {
                    // Remove the capsule half from its parent container.
                    // This detaches the sprite from the container's coordinate system,
                    // allowing its individual animation to play correctly.
                    piece.entity.parentCapsule.remove(piece.entity);
                    capsulesToSeparate.add(piece.entity.parentCapsule);
                }

                // Remove the piece from the grid immediately
                this.grid.remove(piece.col, piece.row);
                totalCleared++;

                // Start the clearing animation for the individual piece
                const clearPromise = this.animateClearPiece(piece.entity);
                clearPromises.push(clearPromise);
            }
        }

        // After all pieces are marked for clearing, process capsule separations
        for (const capsule of capsulesToSeparate) {
            this.separateCapsule(capsule);
        }

        // Wait for all clearing animations to complete before proceeding
        await Promise.all(clearPromises);

        console.log(`MatchSystem: Cleared ${totalCleared} pieces.`);
        return totalCleared;
    }

    /**
     * @method separateCapsule
     * @description Handles the logic for separating a `Capsule` into individual `CapsuleHalf` pieces
     * when one of its halves is cleared. The remaining half (if any) is converted to a single piece.
     * @param {Capsule} capsule - The `Capsule` object to separate.
     *
     * @algorithm
     * 1. Check which halves of the `capsule` are still present in the `GameGrid` and still children of the `capsule` container.
     * 2. If `half1` is a child of the capsule and still in the grid (meaning `half2` was cleared):
     * a. Remove `half1` from the capsule container.
     * b. Call `half1.convertToSingle()` to change its sprite and remove its `parentCapsule` reference.
     * 3. Else if `half2` is a child of the capsule and still in the grid:
     * a. Remove `half2` from the capsule container.
     * b. Call `half2.convertToSingle()`.
     * 4. Finally, if the `capsule` container has no more children, destroy the container itself.
     */
    private separateCapsule(capsule: Capsule): void {
        if (!capsule || !capsule.scene || !capsule.active) {
            return;
        }

        console.log(`MatchSystem: Attempting to separate capsule.`);

        // Call the capsule's own method to detach and convert its halves.
        // This method will handle re-parenting to the scene and sprite updates.
        capsule.separateHalves();

        // Now, check if the capsule container itself should be destroyed.
        // It should be destroyed if it's active and has no more active children.
        // The `separateHalves()` call above should have removed all children.
        if (capsule.active) { // Check active before destroying
            capsule.destroy();
            console.log('MatchSystem: Capsule container destroyed.');
        } else {
            console.warn('MatchSystem: Capsule was not active, skipping container destruction.');
        }
    }

    /**
     * @method animateClearPiece
     * @description Animates a single game piece (Pathogen or CapsuleHalf) being cleared
     * by shrinking and fading it out. Once the animation is complete, the piece is destroyed.
     * @param {Pathogen | CapsuleHalf} entity - The game entity to animate.
     * @returns {Promise<void>} A promise that resolves when the animation is complete and the entity is destroyed.
     *
     * @algorithm
     * 1. Create a Phaser tween for the `entity`.
     * 2. Configure the tween to:
     * - Target the entity's `scale` (to shrink to 0) and `alpha` (to fade to 0).
     * - Set the `duration` from `GameConfig.CLEAR_ANIMATION_DURATION`.
     * - Use an easing function (e.g., `Phaser.Math.Easing.Linear`) for smooth animation.
     * 3. Set an `onComplete` callback for the tween:
     * a. When the tween finishes, destroy the `entity` using `entity.destroy()`.
     * b. Resolve the promise.
     * 4. Return the promise.
     */
    private animateClearPiece(entity: Pathogen | CapsuleHalf): Promise<void> {
        return new Promise((resolve) => {
            // Ensure the entity is still active in the scene before animating
            if (!entity || !entity.scene || !entity.active) {
                console.warn('MatchSystem: Attempted to animate a non-existent or inactive entity for clearing.');
                resolve(); // Resolve immediately if entity is invalid
                return;
            }

            entity.scene.tweens.add({
                targets: entity,
                scale: 0, // Shrink to zero
                alpha: 0, // Fade to transparent
                duration: GameConfig.CLEAR_ANIMATION_DURATION,
                ease: 'Linear', // Simple linear easing
                onComplete: () => {
                    // Destroy the game object once the animation is complete
                    if (entity) { // Removed '&& entity.active' check
                        entity.destroy();
                    }
                    resolve();
                }
            });
        });
    }

    /**
     * @method animateCapsuleDrop
     * @description Animates an entire `Capsule` (container) dropping to a new grid position.
     * Uses a Phaser tween for smooth visual movement.
     * @param {Capsule} capsule - The capsule container to animate.
     * @param {number} startCol - The starting column position of the capsule's base half.
     * @param {number} startRow - The starting row position of the capsule's base half.
     * @param {number} newCol - The target column position of the capsule's base half.
     * @param {number} newRow - The target row position of the capsule's base half.
     * @returns {Promise<void>} A promise that resolves when the animation is complete.
     * @private
     */
    private animateCapsuleDrop(capsule: Capsule, startCol: number, startRow: number, newCol: number, newRow: number): Promise<void> {
        return new Promise((resolve) => {
            if (!capsule || !capsule.scene || !capsule.active) {
                console.warn('MatchSystem: Attempted to animate a non-existent or inactive capsule for dropping.');
                resolve();
                return;
            }

            // Calculate the starting and target screen positions for the capsule's container
            // The capsule's (x,y) is the center of its base half's grid cell.
            const startPos = this.scene.gridToScreen(startCol, startRow);
            const newPos = this.scene.gridToScreen(newCol, newRow);

            // Set the capsule's current visual position to its logical STARTING grid position
            capsule.setPosition(startPos.x, startPos.y);

            capsule.scene.tweens.add({
                targets: capsule,
                x: newPos.x,
                y: newPos.y,
                duration: GameConfig.DROP_ANIMATION_DURATION,
                ease: 'Quadratic.In', // Accelerate downwards
                onComplete: () => {
                    // Ensure the final position is exact to prevent floating point issues
                    capsule.setPosition(newPos.x, newPos.y);
                    resolve();
                }
            });
        });
    }

    /**
     * @method applyGravity
     * @description Applies gravity to all floating pieces (CapsuleHalves that are not part of a falling capsule)
     * and whole attached capsules that have space to fall. This is done column by column, from bottom to top.
     * @returns {Promise<number>} A promise that resolves with the total number of pieces that moved
     * once all drop animations are complete.
     *
     * @algorithm
     * 1. Initialize `piecesDropped` count, `dropPromises = []`, and `processedCapsules = new Set<Capsule>()`.
     * 2. Iterate through the grid columns (`col` from 0 to `FIELD_WIDTH` - 1).
     * 3. For each column, iterate from the second-to-last row upwards (`row` from `FIELD_HEIGHT - 2` down to 0):
     * a. Get the `entity` at `(col, row)`.
     * b. If `entity` is `null` or `Pathogen`, `continue` (Pathogens do not fall).
     * c. If `entity instanceof CapsuleHalf`:
     * i. If `entity.parentCapsule !== null` (it's part of an attached capsule):
     * - Get `capsule = entity.parentCapsule`.
     * - If `processedCapsules.has(capsule)`, `continue` (already handled this capsule in this pass).
     * - Add `capsule` to `processedCapsules`.
     * - Create a `customIsOccupiedCheck` for the capsule that ignores its own halves.
     * - If `capsule.canMoveDown(customIsOccupiedCheck)`:
     * - Store `oldCol` and `oldRow` of the capsule's base half.
     * - Call `capsule.tryMoveDown(customIsOccupiedCheck)` (this updates `capsule.gridCol`, `capsule.gridRow`, and its halves' positions).
     * - Remove both halves from their *old* positions in the `gameGrid`.
     * - Set both halves at their *new* positions in the `gameGrid`.
     * - Add `this.animateCapsuleDrop(capsule, oldCol, oldRow, capsule.gridCol, capsule.gridRow)` to `dropPromises`.
     * - `piecesDropped += 2`.
     * ii. Else (`entity.parentCapsule === null`, it's a detached CapsuleHalf):
     * - Calculate `dropDistance` for this single `CapsuleHalf`.
     * - If `dropDistance > 0`:
     * - `newRow = row + dropDistance`.
     * - `this.grid.remove(col, row)`.
     * - `this.grid.set(col, newRow, entity)`.
     * - Add `this.animateDropPiece(entity, col, row, col, newRow)` to `dropPromises`.
     * - `piecesDropped++`.
     * 4. Wait for all individual drop animations to finish using `Promise.all(dropPromises)`.
     * 5. Return `piecesDropped`.
     */
    private async applyGravity(): Promise<number> {
        let piecesDropped = 0;
        const dropPromises: Promise<void>[] = [];
        const processedCapsules = new Set<Capsule>();   // To avoid processing the same whole capsule multiple times

        // Iterate through each column
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            // Iterate from the second-to-last row upwards (bottom-up processing)
            for (let row = GameConfig.FIELD_HEIGHT - 2; row >= 0; row--) {
                const entity = this.grid.get(col, row);

                // Pathogens never fall, and null cells don't fall
                if (entity === null || entity instanceof Pathogen) continue;
                
                // At this point, entity must be a CapsuleHalf
                if (entity instanceof CapsuleHalf) {
                    // Case 1: It's part of a whole, attached capsule
                    if (entity.parentCapsule !== null) {
                        const capsule = entity.parentCapsule;

                        // Ensure we only process this capsule once per applyGravity cycle
                        if (processedCapsules.has(capsule)) continue;
                        processedCapsules.add(capsule);

                        // Define a custom isOccupiedCheck that ignores the current capsule's own halves
                        const customIsOccupiedCheck = (checkCol: number, checkRow: number): boolean => {
                            const cellContent = this.grid.get(checkCol, checkRow);
                            if (cellContent instanceof CapsuleHalf) {
                                if (cellContent === capsule.half1 || cellContent === capsule.half2) {
                                    return false;   // It's one of our own halves, so it's not a collision
                                }
                            }
                            return this.grid.isOccupied(checkCol, checkRow);
                        };

                        if (capsule.canMoveDown(customIsOccupiedCheck)) {
                            // Store old grid positions of the capsule's halves before moving
                            const oldHalf1Col = capsule.half1.gridCol;
                            const oldHalf1Row = capsule.half1.gridRow;
                            const oldHalf2Col = capsule.half2.gridCol;
                            const oldHalf2Row = capsule.half2.gridRow;

                            // Move the capsule (this updates its internal gridCol/Row and its halves' positions)
                            capsule.tryMoveDown(customIsOccupiedCheck);

                            // Update the grid: remove from old positions, set to new positions
                            this.grid.remove(oldHalf1Col, oldHalf1Row);
                            this.grid.remove(oldHalf2Col, oldHalf2Row);
                            this.grid.set(capsule.half1.gridCol, capsule.half1.gridRow, capsule.half1);
                            this.grid.set(capsule.half2.gridCol, capsule.half2.gridRow, capsule.half2);

                            // Animate the entire capsule container
                            const dropPromise = this.animateCapsuleDrop(capsule, oldHalf1Col, oldHalf1Row, capsule.half1.gridCol, capsule.half1.gridRow);
                            dropPromises.push(dropPromise);
                            piecesDropped += 2; // A whole capsule counts as 2 pieces
                        }
                    } else {
                        // Case 2: It's a detached CapsuleHalf (parentCapsule is null)
                        let dropDistance = 0;
                        for (let checkRow = row + 1; checkRow < GameConfig.FIELD_HEIGHT; checkRow++) {
                            if (this.grid.isEmpty(col, checkRow)) {
                                dropDistance++;
                            } else {
                                break; // Hit an occupied cell, stop falling
                            }
                        }

                        // If the piece can fall, update its grid position and animate its drop
                        if (dropDistance > 0) {
                            const newRow = row + dropDistance;

                            // Store current grid position before removing from the grid
                            const oldCol = entity.gridCol;
                            const oldRow = entity.gridRow;

                            // Update grid: remove from old position, set to new position
                            this.grid.remove(col, row);
                            this.grid.set(col, newRow, entity); // This also updates entity.gridCol/Row

                            // Animate the visual drop
                            // Pass the old (current) position and the new (target) position
                            const dropPromise = this.animateDropPiece(entity, oldCol, oldRow, col, newRow);
                            dropPromises.push(dropPromise);
                            
                            piecesDropped++;
                        }
                    }
                }
            }
        }

        // Wait for all drop animations to complete
        await Promise.all(dropPromises);

        return piecesDropped;
    }

    /**
     * @method animateDropPiece
     * @description Animates a single `CapsuleHalf` (or `Pathogen`) dropping to a new grid position. (***SHOULD NEVER DROP PATHOGENS... FIX THIS!***)
     * Uses a Phaser tween for smooth visual movement.
     * @param {CapsuleHalf | Pathogen} entity - The game entity to animate.
     * @param {number} startCol - The starting column position for the animation.
     * @param {number} startRow - The starting row position for the animation.
     * @param {number} newCol - The target column position.
     * @param {number} newRow - The target row position.
     * @returns {Promise<void>} A promise that resolves when the animation is complete.
     *
     * @algorithm
     * 1. Calculate the target screen coordinates (`newX`, `newY`) for the `entity`
     * using `this.scene.gridToScreen()`.
     * 2. Create a Phaser tween for the `entity`.
     * 3. Configure the tween to:
     * - Target the entity's `x` and `y` properties to the `newX` and `newY`.
     * - Set the `duration` from `GameConfig.DROP_ANIMATION_DURATION`.
     * - Use an easing function (e.g., `Phaser.Math.Easing.Quadratic.In`) for a more natural falling effect.
     * 4. Set an `onComplete` callback for the tween:
     * a. Ensure the `entity`'s final `x` and `y` positions are exactly `newX` and `newY` to prevent floating point inaccuracies.
     * b. Resolve the promise.
     * 5. Return the promise.
     */
    private animateDropPiece(entity: CapsuleHalf | Pathogen, startCol: number, startRow: number, newCol: number, newRow: number): Promise<void> {
        return new Promise((resolve) => {
            // Ensure the entity is still active in the scene before animating
            if (!entity || !entity.scene || !entity.active) {
                console.warn('MatchSystem: Attempted to animate a non-existent or inactive entity for dropping.');
                resolve(); // Resolve immediately if entity is invalid
                return;
            }

            // Calculate the starting and target screen positions
            const startPos = this.scene.gridToScreen(startCol, startRow);
            const newPos = this.scene.gridToScreen(newCol, newRow);

            // Set the entity's current visual position to its logical STARTING grid position
            entity.setPosition(startPos.x, startPos.y);

            entity.scene.tweens.add({
                targets: entity,
                x: newPos.x,
                y: newPos.y,
                duration: GameConfig.DROP_ANIMATION_DURATION,
                ease: 'Quadratic.In', // Accelerate downwards
                onComplete: () => {
                    // Ensure the final position is exact to prevent floating point issues
                    entity.setPosition(newPos.x, newPos.y);
                    resolve();
                }
            });
        });
    }

    /**
     * @method isProcessingMatches
     * @description Checks if the match system is currently busy processing matches (clearing, dropping, re-checking).
     * This flag can be used by other parts of the game (e.g., input handler) to pause actions.
     * @returns {boolean} True if processing, false otherwise.
     */
    public isProcessingMatches(): boolean {
        return this.isProcessing;
    }

    /**
     * @method delay
     * @description A utility function to create a time delay using a Promise.
     * @param {number} ms - The duration of the delay in milliseconds.
     * @returns {Promise<void>} A promise that resolves after the specified delay.
     * @private
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @method getColorName
     * @description Helper method to get a human-readable color name for debugging purposes.
     * @param {ColorType} colorIndex - The numerical color index.
     * @returns {string} The name of the color.
     * @private
     */
    private getColorName(colorIndex: ColorType): string {
        switch (colorIndex) {
            case GameConfig.COLOR_INDEX.PINK: return 'Hot Pink';
            case GameConfig.COLOR_INDEX.BLUE: return 'Sky Blue';
            case GameConfig.COLOR_INDEX.YELLOW: return 'Pear';
            default: return 'Unknown';
        }
    }
}
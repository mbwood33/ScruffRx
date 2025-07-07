// src/game/GameGrid.ts
/**
 * @file GameGrid.ts
 * @description Manages the 2D grid state of the game playing field.
 * It tracks the position of all game pieces (pathogens and capsule halves)
 * and provides methods for adding, removing, checking occupancy, and querying the grid.
 */

import { GameConfig } from "../config/GameConfig";
import { Pathogen } from "../entities/Pathogen";
import { CapsuleHalf } from "../entities/Capsule";
import { ColorType } from "../config/GameConfig";

/**
 * @typedef {Pathogen | CapsuleHalf | null} GridCell
 * @description Type alias representing the possible content of a single grid cell:
 * either a Pathogen, a CapsuleHalf, or null (if empty).
 */
export type GridCell = Pathogen | CapsuleHalf | null;

/**
 * @class GameGrid
 * @description Manages the game playing field grid and what's in each cell.
 * Provides an abstraction layer for grid operations, ensuring pieces are
 * placed and removed correctly.
 */
export class GameGrid {
    /**
     * @property {GridCell[][]} grid
     * @description A 2D array representing the playing field.
     * Indexed as `grid[column][row]`.
     * @private
     */
    private grid: GridCell[][];

    /**
     * @constructor
     * @description Creates a new empty game grid with dimensions defined in `GameConfig`.
     */
    constructor() {
        this.grid = [];
        // Initialize an empty grid with null values for each cell
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            this.grid[col] = [];
            for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
                this.grid[col][row] = null;
            }
        }
        console.log(`GameGrid: Initialized an empty grid of ${GameConfig.FIELD_WIDTH}x${GameConfig.FIELD_HEIGHT}.`);
    }

    /**
     * @method clear
     * @description Clears all contents from the grid, setting every cell to null.
     */
    public clear(): void {
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
                this.grid[col][row] = null;
            }
        }
        console.log('GameGrid: All grid contents cleared.');
    }

    /**
     * @method get
     * @description Retrieves the content of a specific grid cell.
     * @param {number} col - The column index (0 to `FIELD_WIDTH` - 1).
     * @param {number} row - The row index (0 to `FIELD_HEIGHT` - 1).
     * @returns {GridCell} The content of the cell (Pathogen, CapsuleHalf, or null)
     * or null if the coordinates are out of bounds.
     */
    public get(col: number, row: number): GridCell {
        // Check if the coordinates are within the valid grid bounds
        if (!this.isValid(col, row)) {
            return null;
        }
        return this.grid[col][row];
    }

    /**
     * @method set
     * @description Sets the content of a specific grid cell.
     * If the content is a `Pathogen` or `CapsuleHalf`, its internal `gridCol` and `gridRow`
     * properties are also updated to reflect its new position.
     * @param {number} col - The column index (0 to `FIELD_WIDTH` - 1).
     * @param {number} row - The row index (0 to `FIELD_HEIGHT` - 1).
     * @param {GridCell} content - The `Pathogen`, `CapsuleHalf`, or `null` to place in the cell.
     * @returns {boolean} True if the content was successfully set, false if coordinates were out of bounds.
     */
    public set(col: number, row: number, content: GridCell): boolean {
        // Check if the coordinates are within the valid grid bounds
        if (!this.isValid(col, row)) {
            console.warn(`GameGrid: Attempted to set content out of bounds at (${col}, ${row}).`);
            return false;
        }

        this.grid[col][row] = content;

        // Update the entity's internal grid position if it's a game piece
        if (content instanceof Pathogen || content instanceof CapsuleHalf) {
            content.gridCol = col;
            content.gridRow = row;
        }

        // console.log(`GameGrid: set - cell (${col}, ${row}) updated with ${content ? content.constructor.name : 'null'}`);
        return true;
    }

    /**
     * @method remove
     * @description Removes content from a specific grid cell by setting it to null.
     * @param {number} col - The column index.
     * @param {number} row - The row index.
     * @returns {GridCell} The content that was removed from the cell, or null if the cell was already empty or out of bounds.
     */
    public remove(col: number, row: number): GridCell {
        const content = this.get(col, row); // Get current content before removal
        if (content !== null) {
            this.set(col, row, null); // Set the cell to null
            // console.log(`GameGrid: remove - cell (${col}, ${row}) set to null`);
        }
        return content;
    }

    /**
     * @method isOccupied
     * @description Checks if a specific grid cell is occupied by any game piece.
     * @param {number} col - The column index.
     * @param {number} row - The row index.
     * @returns {boolean} True if the cell has content and is within bounds, false otherwise.
     */
    public isOccupied(col: number, row: number): boolean {
        return this.get(col, row) !== null;
    }

    /**
     * @method isEmpty
     * @description Checks if a specific grid cell is empty.
     * @param {number} col - The column index.
     * @param {number} row - The row index.
     * @returns {boolean} True if the cell is empty (null) and within bounds, false if occupied or out of bounds.
     */
    public isEmpty(col: number, row: number): boolean {
        return this.get(col, row) === null;
    }

    /**
     * @method isValid
     * @description Checks if a given column and row are within the valid bounds of the game grid.
     * @param {number} col - The column index.
     * @param {number} row - The row index.
     * @returns {boolean} True if the coordinates are valid, false otherwise.
     */
    public isValid(col: number, row: number): boolean {
        return col >= 0 && col < GameConfig.FIELD_WIDTH &&
               row >= 0 && row < GameConfig.FIELD_HEIGHT;
    }

    /**
     * @method countPathogens
     * @description Counts how many `Pathogen` entities are currently on the field.
     * @returns {number} The total number of pathogens on the grid.
     */
    public countPathogens(): number {
        let count = 0;
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
                if (this.grid[col][row] instanceof Pathogen) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * @method getPathogens
     * @description Retrieves an array of all `Pathogen` entities currently on the field.
     * @returns {Pathogen[]} An array containing all `Pathogen` instances.
     */
    public getPathogens(): Pathogen[] {
        const pathogens: Pathogen[] = [];
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
                const cell = this.grid[col][row];
                if (cell instanceof Pathogen) {
                    pathogens.push(cell);
                }
            }
        }
        return pathogens;
    }

    /**
     * @method isBottleNeckClear
     * @description Checks if the "bottle neck" area (top rows of the grid) is clear of any pieces.
     * This is typically used to determine a game over condition.
     * @returns {boolean} True if all cells from row 0 up to (but not including) `BOTTLE_NECK_ROW` are empty,
     * false if any piece occupies this critical area.
     */
    public isBottleNeckClear(): boolean {
        // Check all cells from row 0 up to the BOTTLE_NECK_ROW (exclusive)
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            for (let row = 0; row < GameConfig.BOTTLE_NECK_ROW; row++) {
                if (this.isOccupied(col, row)) {
                    return false; // Found an occupied cell in the bottle neck
                }
            }
        }
        return true; // All cells in the bottle neck are clear
    }

    /**
     * @method getPiecesInColumn
     * @description Retrieves all game pieces (Pathogen or CapsuleHalf) in a given column,
     * starting from a specified row downwards.
     * @param {number} col - The column index.
     * @param {number} startRow - The starting row index (inclusive).
     * @returns {(Pathogen | CapsuleHalf)[]} An array of pieces found in the column.
     */
    public getPiecesInColumn(col: number, startRow: number): (Pathogen | CapsuleHalf)[] {
        const pieces: (Pathogen | CapsuleHalf)[] = [];
        if (!this.isValid(col, startRow)) {
            return pieces;
        }
        for (let row = startRow; row < GameConfig.FIELD_HEIGHT; row++) {
            const piece = this.get(col, row);
            if (piece instanceof Pathogen || piece instanceof CapsuleHalf) {
                pieces.push(piece);
            }
        }
        return pieces;
    }
}

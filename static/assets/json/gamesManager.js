/**
 * Games Manager
 * Manages and processes games data from multiple sources
 */

// Import games data from source files
import { gamesData } from './games.js';
import { games2Data } from './games2.js';

// Key for storing game click counts in localStorage
const GAME_CLICKS_KEY = 'game_click_counts';

// Combine all games into a single array
const allGames = [...gamesData, ...games2Data];

/**
 * Get the number of times each game has been clicked
 * @returns {Object} Object with game titles as keys and click counts as values
 */
function getGameClickCounts() {
    const storedData = localStorage.getItem(GAME_CLICKS_KEY);
    return storedData ? JSON.parse(storedData) : {};
}

/**
 * Save game click counts to localStorage
 * @param {Object} clickCounts Object with game titles as keys and click counts as values
 */
function saveGameClickCounts(clickCounts) {
    localStorage.setItem(GAME_CLICKS_KEY, JSON.stringify(clickCounts));
}

/**
 * Increment the click count for a game
 * @param {string} gameTitle The title of the game to increment
 */
function incrementGameClickCount(gameTitle) {
    if (!gameTitle) return;
    
    const clickCounts = getGameClickCounts();
    clickCounts[gameTitle] = (clickCounts[gameTitle] || 0) + 1;
    saveGameClickCounts(clickCounts);
}

/**
 * Get a specified number of most popular games
 * @param {number} count Number of popular games to return
 * @returns {Array} Array of game objects with their click counts
 */
function getPopularGames(count = 5) {
    const clickCounts = getGameClickCounts();
    
    // Convert to array for sorting
    const gameClicksArray = Object.entries(clickCounts).map(([title, count]) => ({
        title,
        count
    }));
    
    // Sort by click count in descending order
    gameClicksArray.sort((a, b) => b.count - a.count);
    
    // Take only the top N or fewer
    const topGames = gameClicksArray.slice(0, count);
    
    // Map to full game objects with click counts
    return topGames.map(item => {
        const gameInfo = allGames.find(g => g.title === item.title);
        if (gameInfo) {
            return {
                ...gameInfo,
                clickCount: item.count
            };
        }
        return null;
    }).filter(Boolean); // Remove any nulls
}

/**
 * Find a game title by its URL
 * @param {string} url The URL to search for
 * @returns {string|null} The game title or null if not found
 */
function findGameTitleByUrl(url) {
    const game = allGames.find(g => g.link === url);
    return game ? game.title : null;
}

/**
 * Get a specified number of random games from the collection
 * @param {number} count Number of random games to get
 * @param {string} [excludeTitle] Optional title to exclude from results
 * @returns {Array} Array of random game objects
 */
function getRandomGames(count = 3, excludeTitle = null) {
    // Filter out the excluded game if specified
    const availableGames = excludeTitle 
        ? allGames.filter(game => game.title !== excludeTitle)
        : [...allGames];
    
    // Shuffle and slice
    return [...availableGames]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(count, availableGames.length));
}

/**
 * Get all available games
 * @returns {Array} All game objects
 */
function getAllGames() {
    return allGames;
}

console.log(`Games Manager loaded with ${allGames.length} total games`);

// Export the module functionality
export default {
    getAllGames,
    getGameClickCounts,
    incrementGameClickCount,
    getPopularGames,
    findGameTitleByUrl,
    getRandomGames
};

/**
 * Task Executor Utility
 * Provides a standardized way to execute async tasks with consistent error handling
 */

/**
 * Executes an async task function and returns a standardized result object
 * @param {Function} taskFn - Async function to execute
 * @returns {Promise<{success: boolean, result?: any, error?: string}>}
 */
export async function executeTask(taskFn) {
    try {
        const result = await taskFn();
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { executeTask } from './task_executor.js';

describe('executeTask', () => {
    it('should return success result when task executes successfully', async () => {
        const task = async () => 'task result';
        const result = await executeTask(task);

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.result, 'task result');
        assert.strictEqual(result.error, undefined);
    });

    it('should return success with object result when task returns object', async () => {
        const task = async () => ({ data: 'test', count: 42 });
        const result = await executeTask(task);

        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(result.result, { data: 'test', count: 42 });
    });

    it('should return failure result when task throws an error', async () => {
        const task = async () => {
            throw new Error('Task failed');
        };
        const result = await executeTask(task);

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Task failed');
        assert.strictEqual(result.result, undefined);
    });

    it('should return failure result with custom error message', async () => {
        const task = async () => {
            throw new Error('Custom error message');
        };
        const result = await executeTask(task);

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Custom error message');
    });

    it('should handle synchronous errors thrown in async function', async () => {
        const task = async () => {
            throw new Error('Sync error in async');
        };
        const result = await executeTask(task);

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Sync error in async');
    });

    it('should handle null result', async () => {
        const task = async () => null;
        const result = await executeTask(task);

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.result, null);
    });

    it('should handle undefined result', async () => {
        const task = async () => undefined;
        const result = await executeTask(task);

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.result, undefined);
    });
});
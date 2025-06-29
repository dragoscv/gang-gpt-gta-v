/**
 * @file utils.test.ts
 * @description Tests for utility functions
 */
import { describe, it, expect, vi } from 'vitest';
import {
    sleep,
    generateRandomString,
    generateId,
    clamp,
    distance2D,
    distance3D,
    formatCurrency,
    formatNumber,
    isValidEmail,
    sanitizeUsername,
    percentage,
    debounce,
    throttle,
    deepClone,
    retryWithBackoff
} from '../utils';

describe('Utility Functions', () => {
    describe('sleep', () => {
        it('should pause execution for specified milliseconds', async () => {
            const start = Date.now();
            await sleep(100);
            const end = Date.now();

            expect(end - start).toBeGreaterThanOrEqual(90);
            expect(end - start).toBeLessThan(150);
        });
    });

    describe('generateRandomString', () => {
        it('should generate random string of specified length', () => {
            const length = 16;
            const randomString = generateRandomString(length);

            expect(typeof randomString).toBe('string');
            expect(randomString.length).toBe(length);
        });

        it('should generate different strings each time', () => {
            const str1 = generateRandomString(10);
            const str2 = generateRandomString(10);

            expect(str1).not.toBe(str2);
        });

        it('should only contain valid characters', () => {
            const randomString = generateRandomString(20);
            const validChars = /^[A-Za-z0-9]+$/;

            expect(validChars.test(randomString)).toBe(true);
        });
    });

    describe('generateId', () => {
        it('should generate a unique ID', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(typeof id1).toBe('string');
            expect(typeof id2).toBe('string');
            expect(id1).not.toBe(id2);
            expect(id1.length).toBeGreaterThan(10);
        });

        it('should generate valid UUID format', () => {
            const id = generateId();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            expect(uuidRegex.test(id)).toBe(true);
        });
    });

    describe('clamp', () => {
        it('should clamp value within bounds', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
        });

        it('should handle edge cases', () => {
            expect(clamp(0, 0, 0)).toBe(0);
            expect(clamp(5, 5, 5)).toBe(5);
        });
    });

    describe('distance2D', () => {
        it('should calculate 2D distance correctly', () => {
            expect(distance2D(0, 0, 3, 4)).toBe(5);
            expect(distance2D(0, 0, 0, 0)).toBe(0);
            expect(distance2D(1, 1, 4, 5)).toBe(5);
        });
    });

    describe('distance3D', () => {
        it('should calculate 3D distance correctly', () => {
            expect(distance3D(0, 0, 0, 3, 4, 0)).toBe(5);
            expect(distance3D(0, 0, 0, 0, 0, 0)).toBe(0);
            expect(distance3D(1, 1, 1, 4, 5, 1)).toBe(5);
        });
    });

    describe('formatCurrency', () => {
        it('should format currency correctly', () => {
            expect(formatCurrency(1234)).toBe('$1,234');
            expect(formatCurrency(1000)).toBe('$1,000');
            expect(formatCurrency(0)).toBe('$0');
        });
    });

    describe('formatNumber', () => {
        it('should format large numbers with suffixes', () => {
            expect(formatNumber(1500)).toBe('1.5K');
            expect(formatNumber(1500000)).toBe('1.5M');
            expect(formatNumber(500)).toBe('500');
        });
    });

    describe('isValidEmail', () => {
        it('should validate correct email', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@example.org'
            ];

            validEmails.forEach(email => {
                expect(isValidEmail(email)).toBe(true);
            });
        });

        it('should reject invalid email', () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'test@',
                'test@.com',
                'test@domain.',
                'test @example.com', // space
                'test@domain@com' // double @
            ];

            invalidEmails.forEach(email => {
                expect(isValidEmail(email)).toBe(false);
            });
        });
    });

    describe('sanitizeUsername', () => {
        it('should sanitize username correctly', () => {
            expect(sanitizeUsername('User@123!')).toBe('user123');
            expect(sanitizeUsername('Valid_User-123')).toBe('valid_user-123');
            expect(sanitizeUsername('a'.repeat(30))).toHaveLength(20);
        });
    });

    describe('percentage', () => {
        it('should calculate percentage correctly', () => {
            expect(percentage(25, 100)).toBe(25);
            expect(percentage(1, 3)).toBe(33);
            expect(percentage(0, 100)).toBe(0);
            expect(percentage(50, 0)).toBe(0);
        });
    });

    describe('debounce', () => {
        it('should debounce function calls', async () => {
            let callCount = 0;
            const fn = () => callCount++;
            const debouncedFn = debounce(fn, 100);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(callCount).toBe(0);

            await sleep(150);
            expect(callCount).toBe(1);
        });
    });

    describe('throttle', () => {
        it('should throttle function calls', async () => {
            let callCount = 0;
            const fn = () => callCount++;
            const throttledFn = throttle(fn, 100);

            throttledFn();
            throttledFn();
            throttledFn();

            expect(callCount).toBe(1);

            await sleep(150);
            throttledFn();
            expect(callCount).toBe(2);
        });
    });

    describe('deepClone', () => {
        it('should deep clone objects', () => {
            const original = {
                a: 1,
                b: { c: 2, d: [3, 4] },
                e: new Date('2023-01-01')
            };

            const cloned = deepClone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.b).not.toBe(original.b);
            expect(cloned.b.d).not.toBe(original.b.d);
        });

        it('should handle primitive values', () => {
            expect(deepClone(null)).toBe(null);
            expect(deepClone(42)).toBe(42);
            expect(deepClone('string')).toBe('string');
            expect(deepClone(true)).toBe(true);
        });
    });

    describe('retryWithBackoff', () => {
        it('should succeed on first try', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const result = await retryWithBackoff(fn);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new Error('fail 1'))
                .mockRejectedValueOnce(new Error('fail 2'))
                .mockResolvedValue('success');

            const result = await retryWithBackoff(fn, 3, 10);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should throw after max retries', async () => {
            const error = new Error('persistent failure');
            const fn = vi.fn().mockRejectedValue(error);

            await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('persistent failure');
            expect(fn).toHaveBeenCalledTimes(3); // Initial call + 2 retries
        });
    });
});

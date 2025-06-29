/**
 * Utility functions for GangGPT applications
 */

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate a random string of given length
 */
export const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate a random ID using crypto.randomUUID if available
 */
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return generateRandomString(8) + '-' +
        generateRandomString(4) + '-' +
        generateRandomString(4) + '-' +
        generateRandomString(4) + '-' +
        generateRandomString(12);
};

/**
 * Clamp a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

/**
 * Calculate distance between two 2D points
 */
export const distance2D = (x1: number, y1: number, x2: number, y2: number): number =>
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

/**
 * Calculate distance between two 3D points
 */
export const distance3D = (
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number
): number =>
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

/**
 * Format large numbers with suffixes (1.2K, 1.5M, etc.)
 */
export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

/**
 * Check if a string is a valid email
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Sanitize username (remove special characters, limit length)
 */
export const sanitizeUsername = (username: string): string => {
    return username
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 20)
        .toLowerCase();
};

/**
 * Calculate percentage
 */
export const percentage = (value: number, total: number): number =>
    total === 0 ? 0 : Math.round((value / total) * 100);

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => void>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
    if (typeof obj === 'object') {
        const cloned = {} as T;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                throw lastError;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            await sleep(delay);
        }
    }

    throw lastError!;
};

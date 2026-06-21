export function truncateObjectStrings<T>(obj: T, defaultMax: number = 128, customLimits: Record<string, number> = {}): T {
    if (Array.isArray(obj)) {
        return obj.map((item: unknown) => truncateObjectStrings(item, defaultMax, customLimits)) as unknown as T;
    }
    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                const limit = customLimits[key] !== undefined ? customLimits[key] : defaultMax;
                if (value.length > limit) {
                    result[key] = value.substring(0, limit) + '...';
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = truncateObjectStrings(value, defaultMax, customLimits);
            }
        }
        return result as unknown as T;
    }
    return obj;
}


// Basic retry fetcher for build scripts

// Rate Limiting State
let lastRequestTime = 0;
const MIN_REQUEST_DELAY = 100; // ms

// Helper for delays
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchJson<T = unknown>(url: string, retries = 5): Promise<T | null> {
    for (let i = 0; i < retries; i++) {
        // Enforce rate limit
        const now = Date.now();
        const timeSinceLast = now - lastRequestTime;
        if (timeSinceLast < MIN_REQUEST_DELAY) {
            await delay(MIN_REQUEST_DELAY - timeSinceLast);
        }
        lastRequestTime = Date.now();

        try {
            const res = await fetch(url);

            // Success
            if (res.ok) return await res.json();

            // Not Found - Do not retry
            if (res.status === 404) return null;

            // Rate Limit (429) or Server Error (5xx)
            if (res.status === 429 || res.status >= 500) {
                const retryAfter = res.headers.get('Retry-After');
                let waitTime = 1000 * Math.pow(2, i); // Default exponential backoff

                if (retryAfter) {
                    const seconds = parseInt(retryAfter);
                    if (!isNaN(seconds)) waitTime = seconds * 1000;
                }

                console.warn(`[${res.status}] ${url} - Retrying in ${waitTime}ms...`);
                await delay(waitTime);
                continue;
            }

            // OtherClient Errors (4xx) - Do not retry
            console.error(`[${res.status}] ${url}`);
            return null;

        } catch (e: unknown) {
            console.warn(`Fetch error for ${url}:`, (e as Error).message);
            if (i === retries - 1) throw e;
            await delay(1000 * Math.pow(2, i));
        }
    }
    return null;
}

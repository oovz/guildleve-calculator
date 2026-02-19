
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect and interact with CafeKit (CafeMaker Desktop Environment).
 * This allows the app to know if it's running inside the specific desktop client
 * and potentially access contextual data (like current character).
 */
export function useCafeKit() {
    const [isCafeKit, setIsCafeKit] = useState(false);
    const [context, setContext] = useState<unknown>(null);

    useEffect(() => {
        // Check for CafeKit global object
        const checkForCafeKit = () => {
            // @ts-expect-error CafeKit injection
            if (typeof window !== 'undefined' && window.CafeKit) {
                setIsCafeKit(true);
                // @ts-expect-error CafeKit injection
                setContext(window.CafeKit.context || null);
            }
        };

        checkForCafeKit();

        // Potential event listener if CafeKit injects later
        window.addEventListener('cafekit-ready', checkForCafeKit);
        return () => window.removeEventListener('cafekit-ready', checkForCafeKit);
    }, []);

    return { isCafeKit, context };
}

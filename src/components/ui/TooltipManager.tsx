'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

declare global {
    interface Window {
        CafeKitTooltip?: {
            initTooltip: () => void;
        };
    }
}

export function TooltipManager() {
    const locale = useLocale();

    useEffect(() => {
        // Only load for zh-Hans
        if (locale !== 'zh-Hans') return;

        // Check if script already exists
        const SCRIPT_ID = 'cafekit-tooltip-script';
        if (!document.getElementById(SCRIPT_ID)) {
            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = 'https://unpkg.com/@thewakingsands/kit-tooltip@0.2.0/dist/bundle.js';
            script.async = true;
            script.onload = () => {
                // Initialize after load
                if (window.CafeKitTooltip) {
                    window.CafeKitTooltip.initTooltip();
                }
            };
            document.body.appendChild(script);
        } else {
            // Already loaded, just re-init
            if (window.CafeKitTooltip) {
                window.CafeKitTooltip.initTooltip();
            }
        }

        // Re-init on DOM mutation (naive approach for SPA)
        const observer = new MutationObserver(() => {
            if (window.CafeKitTooltip) {
                window.CafeKitTooltip.initTooltip();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [locale]);

    return null;
}

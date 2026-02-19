import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock next-intl
vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string) => key,
}));

// Mock next/image
vi.mock('next/image', () => ({
    default: (props: any) => {
        return React.createElement('img', props);
    },
}));

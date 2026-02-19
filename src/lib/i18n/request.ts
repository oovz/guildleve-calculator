import { getRequestConfig } from 'next-intl/server';
import { locales } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !(locales as readonly string[]).includes(locale)) {
        locale = locales[0]; // Default to first locale or handle 404
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});

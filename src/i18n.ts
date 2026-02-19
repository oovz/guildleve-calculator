import { getRequestConfig } from 'next-intl/server';
import { locales } from './lib/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;
    if (!locale || !(locales as readonly string[]).includes(locale)) {
        locale = 'en';
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});

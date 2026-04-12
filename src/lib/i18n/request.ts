import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

import { isLocale, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : defaultLocale;

  try {
    const messages = (await import(`@/../messages/${locale}.json`)).default;
    return { locale, messages };
  } catch {
    notFound();
  }
});

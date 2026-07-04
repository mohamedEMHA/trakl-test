// oxlint-disable-next-line import/no-unassigned-import
import 'i18next';

import type { Resources } from './lib/locales/en';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Resources };
  }
}

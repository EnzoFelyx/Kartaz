import 'i18next';

import type en from './locales/en.json';

// Tipagem das chaves de tradução: `t('cards.title')` é verificado pelo TypeScript
// usando o inglês como referência.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

import 'server-only' // Pour s'assurer que ça ne tourne que côté serveur

const dictionaries = {
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
}

export const getDictionary = async (locale: 'fr' | 'ar') => 
  dictionaries[locale]?.() ?? dictionaries.fr()
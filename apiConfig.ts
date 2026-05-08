export type ServiceName = 'contrats'| 'auth' | 'soumissions' | 'evaluations' | 'acteurs' | 'contractant' | 'appels' | 'documents';

// 2. Interface pour la configuration d'un service
interface ServiceConfig {
  baseUrl: string;      // URL de base du service
  timeout: number;      // Timeout en millisecondes
}

// 3. Configuration de chaque service
// On utilise les variables d'environnement avec des valeurs par défaut
const services: Record<ServiceName, ServiceConfig> = {
  contrats: {
    baseUrl: process.env.NEXT_PUBLIC_CONTRATS_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  auth: {
    baseUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8080',
    timeout: 5000, // Auth souvent plus rapide, timeout plus court
  },
  soumissions: {
    baseUrl: process.env.NEXT_PUBLIC_SOUMISSIONS_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  evaluations: {
    baseUrl: process.env.NEXT_PUBLIC_EVALUATIONS_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  acteurs: {
    baseUrl: process.env.NEXT_PUBLIC_ACTEURS_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  contractant: {
    baseUrl: process.env.NEXT_PUBLIC_CONTRACTANT_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  appels: {
    baseUrl: process.env.NEXT_PUBLIC_APPELS_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
  documents: {
    baseUrl: process.env.NEXT_PUBLIC_DOCUMENTS_SERVICE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  },
};

/**
 * Génère l'URL complète pour un endpoint donné
 * 
 * @param service - Nom du service ('contrats', 'validations', etc.)
 * @param endpoint - Chemin de l'endpoint (ex: 'contrats', 'contrats/123')
 * @returns URL complète prête à être utilisée avec fetch
 * 
 * @example
 * getApiUrl('contrats', 'contrats') 
 * // → 'http://localhost:18085/contrats'
 * 
 * getApiUrl('contrats', 'contrats/123/signer')
 * // → 'http://localhost:18085/contrats/123/signer'
 */
export const getApiUrl = (service: ServiceName, endpoint: string): string => {
  const config = services[service];
  
  if (!config) {
    throw new Error(`Service "${service}" non configuré dans apiConfig.ts`);
  }
  
  // Nettoie les URLs pour éviter les doubles slashes :
  // baseUrl: "http://localhost:18085/" + endpoint: "/contrats" 
  // → "http://localhost:18085/contrats" (et non "http://localhost:18085//contrats")
  const cleanBaseUrl = config.baseUrl.replace(/\/$/, ''); // retire le slash final
  const cleanEndpoint = endpoint.replace(/^\//, '');       // retire le slash initial
  
  return `${cleanBaseUrl}/${cleanEndpoint}`;
};

/**
 * Récupère le timeout configuré pour un service
 * 
 * @param service - Nom du service
 * @returns Timeout en millisecondes
 */
export const getServiceTimeout = (service: ServiceName): number => {
  return services[service]?.timeout || 10000; // 10s par défaut
};

/**
 * Fonction utilitaire pour créer un AbortController avec timeout
 * Utile pour annuler les requêtes trop longues
 * 
 * @param service - Nom du service pour récupérer son timeout
 * @returns { controller, timeoutId } à utiliser avec fetch
 */
export const createTimeoutController = (service: ServiceName) => {
  const controller = new AbortController();
  const timeout = getServiceTimeout(service);
  
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn(`Requête vers ${service} annulée après ${timeout}ms`);
  }, timeout);
  
  return { controller, timeoutId };
};
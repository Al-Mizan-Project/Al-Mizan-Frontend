// Dans n'importe quelle page, ex: src/app/page.tsx
import ConnectionTest from '../components/ConnectionTest';

export default function HomePage() {
  return (
    <main>
      <h1>Page d'accueil</h1>
      {/* Ajoute le test uniquement en développement */}
      {process.env.NODE_ENV === 'development' && <ConnectionTest />}
    </main>
  );
}
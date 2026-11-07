import { config } from '@/app/lib/config';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900 md:text-6xl">{config.appNom}</h1>
      <p className="text-xl text-gray-700 md:text-2xl">{config.collectiviteNom}</p>
    </main>
  );
}

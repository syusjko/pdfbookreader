import dynamic from 'next/dynamic';

const Player = dynamic(() => import('../components/Player'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-black">
      <Player />
    </main>
  );
}

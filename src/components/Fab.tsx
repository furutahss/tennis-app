'use client';
export default function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="fixed bottom-8 right-8 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-transform z-40">
      ＋
    </button>
  );
}
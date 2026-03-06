'use client';
import { useEffect, useState } from 'react';
import { fetchAPI, saveAPI, deleteAPI } from '@/lib/apiClient';
import { Place } from '@/types';
import Fab from '@/components/Fab';
import Modal from '@/components/Modal';

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Place>({ name: '' });

  const loadData = async () => setPlaces(await fetchAPI('places'));
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAPI('places', form, !!form.id);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <>
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">📍 場所一覧</h1>
      <div className="bg-white rounded-lg shadow max-w-2xl">
        <table className="w-full text-left text-sm md:text-base">
          <thead className="bg-gray-100">
            <tr><th className="p-2 md:p-4">場所名</th><th className="p-2 md:p-4 w-24 md:w-40 text-center">操作</th></tr>
          </thead>
          <tbody>
            {places.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-2 md:p-4 font-bold break-words">{p.name}</td>
                <td className="p-2 md:p-4 text-center">
                  <div className="flex flex-col sm:flex-row gap-1 md:gap-2 justify-center">
                    <button onClick={() => { setForm(p); setIsModalOpen(true); }} className="text-xs md:text-sm bg-gray-200 px-2 py-1 md:px-3 md:py-1 rounded">編集</button>
                    <button onClick={async () => { if(confirm('削除しますか？')) { await deleteAPI('places', p.id!); loadData(); } }} className="text-xs md:text-sm bg-red-100 text-red-600 px-2 py-1 md:px-3 md:py-1 rounded">削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Fab onClick={() => { setForm({ name: '' }); setIsModalOpen(true); }} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "場所の編集" : "場所の登録"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="場所名" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="border p-2 rounded text-sm md:text-base" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded font-bold text-sm md:text-base">保存</button>
        </form>
      </Modal>
    </>
  );
}
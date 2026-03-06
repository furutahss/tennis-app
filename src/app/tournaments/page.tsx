'use client';
import { useEffect, useState } from 'react';
import { fetchAPI, saveAPI, deleteAPI } from '@/lib/apiClient';
import { Tournament, Place, RecordData, Opponent } from '@/types';
import Fab from '@/components/Fab';
import Modal from '@/components/Modal';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [records, setRecords] = useState<RecordData[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [form, setForm] = useState<Tournament>({ places_id: '', name: '', date: '', result: '' });

  const loadData = async () => {
    const [t, p, r, o] = await Promise.all([fetchAPI('tournaments'), fetchAPI('places'), fetchAPI('records'), fetchAPI('opponents')]);
    setTournaments(t); setPlaces(p); setRecords(r); setOpponents(o);
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAPI('tournaments', form, !!form.id);
    setIsModalOpen(false);
    loadData();
  };

  const getPlaceName = (id: any) => places.find(p => p.id == id)?.name || '不明';
  const getOpponentName = (id: any) => opponents.find(o => o.id == id)?.name || '不明';
  const getScoreText = (r: RecordData) => {
    const myS = r.is_ret_me ? 'RET' : r.my_score;
    const opS = r.is_ret_op ? 'RET' : r.op_score;
    const tb = (r.my_tb_score || r.op_tb_score) ? `(${r.my_tb_score}-${r.op_tb_score})` : '';
    return `${myS} - ${opS} ${tb}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">🏆 大会一覧</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-100">
            <tr><th className="p-4">日付</th><th className="p-4">場所</th><th className="p-4">大会名</th><th className="p-4">結果</th><th className="p-4 text-center whitespace-nowrap">操作</th></tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{t.date}</td>
                <td className="p-4">{getPlaceName(t.places_id)}</td>
                <td className="p-4">
                  <button onClick={() => { setActiveTournament(t); setIsHistoryOpen(true); }} className="text-blue-600 font-bold hover:underline text-left">{t.name}</button>
                </td>
                <td className="p-4">{t.result}</td>
                <td className="p-4 text-center space-x-2 whitespace-nowrap">
                  <button onClick={() => { setForm(t); setIsModalOpen(true); }} className="text-sm bg-gray-200 px-3 py-1 rounded">編集</button>
                  <button onClick={async () => { if(confirm('削除しますか？')) { await deleteAPI('tournaments', t.id!); loadData(); } }} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Fab onClick={() => { setForm({ places_id: '', name: '', date: '', result: '' }); setIsModalOpen(true); }} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "大会の編集" : "大会の登録"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="border p-2 rounded" />
          <select value={form.places_id} onChange={e => setForm({...form, places_id: e.target.value})} required className="border p-2 rounded">
            <option value="">場所を選択</option>
            {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="text" placeholder="大会名" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="border p-2 rounded" />
          <input type="text" placeholder="結果 (例: 優勝, 予選敗退)" value={form.result} onChange={e => setForm({...form, result: e.target.value})} className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded font-bold">保存</button>
        </form>
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`${activeTournament?.name} の戦績`}>
        <ul className="space-y-2">
          {records.filter(r => r.tournaments_id == activeTournament?.id).map(r => (
            <li key={r.id} className="p-3 bg-gray-50 border rounded flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <span className="font-bold">{getOpponentName(r.opponents_id)}</span>
                <span className="text-sm text-gray-500 ml-2">({r.round})</span>
              </div>
              <div className="flex items-center gap-3">
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition">動画</a>}
                <span className="font-mono">{getScoreText(r)}</span>
                <span className={`font-bold w-12 text-center ${r.result === 'WIN' ? 'text-red-500' : 'text-blue-500'}`}>{r.result}</span>
              </div>
            </li>
          ))}
          {records.filter(r => r.tournaments_id == activeTournament?.id).length === 0 && <p className="text-gray-500">戦績がありません</p>}
        </ul>
      </Modal>
    </>
  );
}
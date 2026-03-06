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
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">🏆 大会一覧</h1>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 md:p-4">日付</th>
              <th className="hidden md:table-cell p-4">場所</th>
              <th className="p-2 md:p-4">大会名</th>
              <th className="p-2 md:p-4">結果</th>
              <th className="p-2 md:p-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-2 md:p-4 whitespace-nowrap">{t.date}</td>
                <td className="hidden md:table-cell p-4">{getPlaceName(t.places_id)}</td>
                <td className="p-2 md:p-4">
                  <button onClick={() => { setActiveTournament(t); setIsHistoryOpen(true); }} className="text-blue-600 font-bold hover:underline text-left break-words max-w-[120px] md:max-w-none">
                    {t.name}
                  </button>
                  <div className="text-[10px] text-gray-500 md:hidden mt-0.5">{getPlaceName(t.places_id)}</div>
                </td>
                <td className="p-2 md:p-4 break-words">{t.result}</td>
                <td className="p-2 md:p-4 text-center">
                  <div className="flex flex-col sm:flex-row gap-1 md:gap-2 justify-center">
                    <button onClick={() => { setForm(t); setIsModalOpen(true); }} className="text-[10px] md:text-sm bg-gray-200 px-2 py-1 md:px-3 rounded w-full sm:w-auto">編集</button>
                    <button onClick={async () => { if(confirm('削除しますか？')) { await deleteAPI('tournaments', t.id!); loadData(); } }} className="text-[10px] md:text-sm bg-red-100 text-red-600 px-2 py-1 md:px-3 rounded w-full sm:w-auto">削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Fab onClick={() => { setForm({ places_id: '', name: '', date: '', result: '' }); setIsModalOpen(true); }} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "大会の編集" : "大会の登録"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm md:text-base">
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
            <li key={r.id} className="p-2 md:p-3 bg-gray-50 border rounded flex flex-row justify-between items-center gap-1.5 md:gap-3 text-xs md:text-sm">
              <div className="flex-1 min-w-0 flex items-center gap-1 md:gap-2">
                <span className="font-bold truncate">{getOpponentName(r.opponents_id)}</span>
                <span className="text-[10px] md:text-xs text-gray-500 shrink-0">({r.round})</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] md:text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded hover:bg-green-200">動画</a>}
                <span className="font-mono text-xs md:text-base">{getScoreText(r)}</span>
                <span className={`font-bold w-8 md:w-12 text-center text-[10px] md:text-sm ${r.result === 'WIN' ? 'text-red-500' : 'text-blue-500'}`}>{r.result}</span>
              </div>
            </li>
          ))}
          {records.filter(r => r.tournaments_id == activeTournament?.id).length === 0 && <p className="text-gray-500 text-sm">戦績がありません</p>}
        </ul>
      </Modal>
    </>
  );
}
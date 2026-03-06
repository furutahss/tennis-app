'use client';
import { useEffect, useState } from 'react';
import { fetchAPI, saveAPI, deleteAPI } from '@/lib/apiClient';
import { Opponent, RecordData, Tournament, Place } from '@/types';
import Fab from '@/components/Fab';
import Modal from '@/components/Modal';

export default function OpponentsPage() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [records, setRecords] = useState<RecordData[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeOpponent, setActiveOpponent] = useState<Opponent | null>(null);
  const [form, setForm] = useState<Opponent>({ name: '', memo: '', spec: '' });

  const loadData = async () => {
    const [o, r, t, p] = await Promise.all([fetchAPI('opponents'), fetchAPI('records'), fetchAPI('tournaments'), fetchAPI('places')]);
    setOpponents(o); setRecords(r); setTournaments(t); setPlaces(p);
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAPI('opponents', form, !!form.id);
    setIsModalOpen(false);
    loadData();
  };

  const getRecordSummary = (opId: any) => {
    const matches = records.filter(r => r.opponents_id == opId);
    const wins = matches.filter(r => r.result === 'WIN').length;
    return `${matches.length}戦 ${wins}勝 ${matches.length - wins}敗`;
  };

  const formatTournament = (tId: any) => {
    const t = tournaments.find(x => x.id == tId);
    if (!t) return '不明';
    const placeName = places.find(p => p.id == t.places_id)?.name || '不明';
    return `${t.date} ${placeName} ${t.name}`;
  };

  const getScoreText = (r: RecordData) => {
    const myS = r.is_ret_me ? 'RET' : r.my_score;
    const opS = r.is_ret_op ? 'RET' : r.op_score;
    const tb = (r.my_tb_score || r.op_tb_score) ? `(${r.my_tb_score}-${r.op_tb_score})` : '';
    return `${myS} - ${opS} ${tb}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">👤 対戦相手一覧</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-100">
            <tr><th className="p-4">名前</th><th className="p-4">対戦成績</th><th className="p-4">特徴/メモ</th><th className="p-4 text-center whitespace-nowrap">操作</th></tr>
          </thead>
          <tbody>
            {opponents.map(o => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <button onClick={() => { setActiveOpponent(o); setIsHistoryOpen(true); }} className="text-blue-600 font-bold hover:underline text-left">{o.name}</button>
                  {o.memo && <span className="text-xs text-gray-400 ml-2 block md:inline">({o.memo})</span>}
                </td>
                <td className="p-4 font-mono">{getRecordSummary(o.id)}</td>
                <td className="p-4 text-sm text-gray-600">{o.spec}</td>
                <td className="p-4 text-center space-x-2 whitespace-nowrap">
                  <button onClick={() => { setForm(o); setIsModalOpen(true); }} className="text-sm bg-gray-200 px-3 py-1 rounded">編集</button>
                  <button onClick={async () => { if(confirm('削除しますか？')) { await deleteAPI('opponents', o.id!); loadData(); } }} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Fab onClick={() => { setForm({ name: '', memo: '', spec: '' }); setIsModalOpen(true); }} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "相手の編集" : "相手の登録"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="名前" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="border p-2 rounded" />
          <input type="text" placeholder="識別メモ (同姓同名対策)" value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} className="border p-2 rounded" />
          <textarea placeholder="特徴やプレースタイル" value={form.spec} onChange={e => setForm({...form, spec: e.target.value})} className="border p-2 rounded h-24" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded font-bold">保存</button>
        </form>
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`${activeOpponent?.name} との戦績`}>
        <ul className="space-y-2">
          {records.filter(r => r.opponents_id == activeOpponent?.id).map(r => (
            <li key={r.id} className="p-3 bg-gray-50 border rounded flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <span className="font-bold text-sm block md:inline">{formatTournament(r.tournaments_id)}</span>
                <span className="text-sm text-gray-500 ml-0 md:ml-2">({r.round})</span>
              </div>
              <div className="flex items-center gap-3">
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition">動画</a>}
                <span className="font-mono">{getScoreText(r)}</span>
                <span className={`font-bold w-12 text-center ${r.result === 'WIN' ? 'text-red-500' : 'text-blue-500'}`}>{r.result}</span>
              </div>
            </li>
          ))}
          {records.filter(r => r.opponents_id == activeOpponent?.id).length === 0 && <p className="text-gray-500">戦績がありません</p>}
        </ul>
      </Modal>
    </>
  );
}
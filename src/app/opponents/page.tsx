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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMatches, setSortMatches] = useState<'none' | 'desc' | 'asc'>('none');

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

  const getMatchCount = (opId: any) => records.filter(r => r.opponents_id == opId).length;
  
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

  const toggleSort = () => {
    if (sortMatches === 'none') setSortMatches('desc');
    else if (sortMatches === 'desc') setSortMatches('asc');
    else setSortMatches('none');
  };

  const sortIcon = sortMatches === 'desc' ? '▼' : sortMatches === 'asc' ? '▲' : '➖';

  // 検索フィルタリング
  const filteredOpponents = opponents.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.name.toLowerCase().includes(q) || (o.memo && o.memo.toLowerCase().includes(q)) || (o.spec && o.spec.toLowerCase().includes(q));
  });

  // 対戦数でソート
  const sortedOpponents = [...filteredOpponents].sort((a, b) => {
    if (sortMatches === 'none') return 0;
    const countA = getMatchCount(a.id);
    const countB = getMatchCount(b.id);
    return sortMatches === 'desc' ? countB - countA : countA - countB;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">👤 対戦相手一覧</h1>
        <input
          type="text"
          placeholder="名前やメモで検索..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full md:w-64 bg-white shadow-sm text-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 md:p-4 whitespace-nowrap w-1">名前</th>
              <th 
                className="p-2 md:p-4 whitespace-nowrap w-1 cursor-pointer hover:bg-gray-200 transition select-none"
                onClick={toggleSort}
              >
                成績 {sortIcon}
              </th>
              {/* 他のカラムが圧迫されないよう、この列に残り幅を使わせる */}
              <th className="hidden md:table-cell p-4 w-auto">特徴/メモ</th>
              <th className="p-2 md:p-4 text-center whitespace-nowrap w-1">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedOpponents.map(o => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="p-2 md:p-4 whitespace-nowrap">
                  <button onClick={() => { setActiveOpponent(o); setIsHistoryOpen(true); }} className="text-blue-600 font-bold hover:underline text-left">{o.name}</button>
                  {o.memo && <span className="text-[10px] md:text-xs text-gray-500 block md:inline md:ml-2">({o.memo})</span>}
                </td>
                <td className="p-2 md:p-4 font-mono whitespace-nowrap">{getRecordSummary(o.id)}</td>
                {/* メモが長くても改行して収める */}
                <td className="hidden md:table-cell p-4 text-gray-600 text-sm break-words min-w-[150px]">{o.spec}</td>
                <td className="p-2 md:p-4 text-center whitespace-nowrap">
                  <div className="flex flex-col sm:flex-row gap-1 md:gap-2 justify-center">
                    <button onClick={() => { setForm(o); setIsModalOpen(true); }} className="text-[10px] md:text-sm bg-gray-200 px-2 py-1 md:px-3 rounded w-full sm:w-auto">編集</button>
                    <button onClick={async () => { if(confirm('削除しますか？')) { await deleteAPI('opponents', o.id!); loadData(); } }} className="text-[10px] md:text-sm bg-red-100 text-red-600 px-2 py-1 md:px-3 rounded w-full sm:w-auto">削除</button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedOpponents.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">該当する相手がいません</td></tr>}
          </tbody>
        </table>
      </div>

      <Fab onClick={() => { setForm({ name: '', memo: '', spec: '' }); setIsModalOpen(true); }} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "相手の編集" : "相手の登録"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm md:text-base">
          <input type="text" placeholder="名前" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="border p-2 rounded" />
          <input type="text" placeholder="識別メモ (同姓同名対策)" value={form.memo} onChange={e => setForm({...form, memo: e.target.value})} className="border p-2 rounded" />
          <textarea placeholder="特徴やプレースタイル" value={form.spec} onChange={e => setForm({...form, spec: e.target.value})} className="border p-2 rounded h-24" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded font-bold">保存</button>
        </form>
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`${activeOpponent?.name} との戦績`}>
        <ul className="space-y-2">
          {records.filter(r => r.opponents_id == activeOpponent?.id).sort((a, b) => {
            const tA = tournaments.find(t => t.id == a.tournaments_id);
            const tB = tournaments.find(t => t.id == b.tournaments_id);
            return (tB ? new Date(tB.date).getTime() : 0) - (tA ? new Date(tA.date).getTime() : 0);
          }).map(r => (
            <li key={r.id} className="p-2 md:p-3 bg-gray-50 border rounded flex flex-row justify-between items-center gap-1.5 md:gap-3 text-xs md:text-sm">
              <div className="flex-1 min-w-0 flex items-center gap-1 md:gap-2">
                <span className="font-bold truncate text-xs md:text-sm">{formatTournament(r.tournaments_id)}</span>
                <span className="text-[10px] md:text-xs text-gray-500 shrink-0">({r.round})</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] md:text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded hover:bg-green-200">動画</a>}
                <span className="font-mono text-xs md:text-base">{getScoreText(r)}</span>
                <span className={`font-bold w-8 md:w-12 text-center text-[10px] md:text-sm ${r.result === 'WIN' ? 'text-red-500' : 'text-blue-500'}`}>{r.result}</span>
              </div>
            </li>
          ))}
          {activeOpponent && records.filter(r => r.opponents_id == activeOpponent.id).length === 0 && <p className="text-gray-500 text-sm">戦績がありません</p>}
        </ul>
      </Modal>
    </>
  );
}
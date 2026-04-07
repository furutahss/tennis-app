'use client';
import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/apiClient';
import { RecordData, Tournament, Opponent, Place } from '@/types';
import Modal from '@/components/Modal';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [filterYear, setFilterYear] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [filterTournament, setFilterTournament] = useState('');
  const [filterOpponent, setFilterOpponent] = useState('');

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeOpponent, setActiveOpponent] = useState<Opponent | null>(null);

  useEffect(() => {
    Promise.all([fetchAPI('records'), fetchAPI('tournaments'), fetchAPI('opponents'), fetchAPI('places')])
      .then(([r, t, o, p]) => { setRecords(r); setTournaments(t); setOpponents(o); setPlaces(p); });
  }, []);

  const years = Array.from(new Set(tournaments.map(t => t.date.substring(0, 4)))).sort().reverse();

  const filteredRecords = records.filter(r => {
    if (filterOpponent && r.opponents_id.toString() !== filterOpponent) return false;
    if (filterTournament && r.tournaments_id.toString() !== filterTournament) return false;
    
    const t = tournaments.find(x => x.id == r.tournaments_id);
    if (filterYear && (!t || t.date.substring(0, 4) !== filterYear)) return false;
    if (filterPlace && (!t || t.places_id.toString() !== filterPlace)) return false;
    
    return true;
  });

  // 日付でソート
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const tA = tournaments.find(t => t.id == a.tournaments_id);
    const tB = tournaments.find(t => t.id == b.tournaments_id);
    const dateA = tA ? new Date(tA.date).getTime() : 0;
    const dateB = tB ? new Date(tB.date).getTime() : 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const total = filteredRecords.length;
  const wins = filteredRecords.filter(r => r.result === 'WIN').length;
  const rate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

  const getName = (list: any[], id: any) => list.find(x => x.id == id)?.name || '不明';
  const formatTournament = (tId: any) => {
    const t = tournaments.find(x => x.id == tId);
    if (!t) return '不明';
    const placeName = getName(places, t.places_id);
    return `${t.date} ${placeName} ${t.name}`;
  };

  const getScoreText = (r: RecordData) => {
    const myS = r.is_ret_me ? 'RET' : r.my_score;
    const opS = r.is_ret_op ? 'RET' : r.op_score;
    const tb = (r.my_tb_score || r.op_tb_score) ? `(${r.my_tb_score}-${r.op_tb_score})` : '';
    return `${myS} - ${opS} ${tb}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">📊 戦績分析</h1>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-t-4 border-blue-500">
        <h2 className="text-base md:text-lg font-bold mb-3 text-gray-800">絞り込み条件</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border p-2 rounded bg-gray-50 text-sm md:text-base">
            <option value="">すべての年</option>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={filterPlace} onChange={e => setFilterPlace(e.target.value)} className="border p-2 rounded bg-gray-50 text-sm md:text-base">
            <option value="">すべての場所</option>
            {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterTournament} onChange={e => setFilterTournament(e.target.value)} className="border p-2 rounded bg-gray-50 text-sm md:text-base">
            <option value="">すべての大会</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{formatTournament(t.id)}</option>)}
          </select>
          <select value={filterOpponent} onChange={e => setFilterOpponent(e.target.value)} className="border p-2 rounded bg-gray-50 text-sm md:text-base">
            <option value="">すべての対戦相手</option>
            {opponents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-lg shadow text-center">
          <div className="text-gray-500 font-bold text-xs md:text-sm mb-1">総試合</div>
          <div className="text-xl md:text-4xl font-black">{total}<span className="text-xs md:text-xl ml-1">試合</span></div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-lg shadow text-center">
          <div className="text-gray-500 font-bold text-xs md:text-sm mb-1">勝 / 敗</div>
          <div className="text-xl md:text-4xl font-black text-red-500">{wins} <span className="text-gray-300">/</span> <span className="text-blue-500">{total - wins}</span></div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-lg shadow text-center">
          <div className="text-gray-500 font-bold text-xs md:text-sm mb-1">勝率</div>
          <div className="text-xl md:text-4xl font-black text-green-500">{rate}<span className="text-xs md:text-xl ml-1">%</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mt-4 md:mt-6">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th 
                className="p-2 md:p-3 border-b cursor-pointer hover:bg-gray-200 transition select-none"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                大会/ラウンド {sortOrder === 'desc' ? '▼' : '▲'}
              </th>
              <th className="p-2 md:p-3 border-b">対戦相手</th>
              <th className="p-2 md:p-3 border-b text-center">スコア</th>
              <th className="hidden md:table-cell p-3 border-b text-center">結果</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map(r => {
              const op = opponents.find(o => o.id == r.opponents_id);
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-2 md:p-3 max-w-[140px] md:max-w-none break-words">
                    {formatTournament(r.tournaments_id)} <span className="text-gray-500 block md:inline">({r.round})</span>
                  </td>
                  <td className="p-2 md:p-3 break-words">
                    {op ? (
                      <button onClick={() => { setActiveOpponent(op); setIsHistoryOpen(true); }} className="text-blue-600 font-bold hover:underline text-left">
                        {op.name}
                      </button>
                    ) : '不明'}
                  </td>
                  <td className="p-2 md:p-3 text-center font-mono">
                    <div>
                      {r.is_ret_me ? 'RET' : r.my_score} - {r.is_ret_op ? 'RET' : r.op_score}
                      {(r.my_tb_score || r.op_tb_score) ? <span className="block md:inline text-[10px] md:text-xs"> ({r.my_tb_score}-{r.op_tb_score})</span> : ''}
                    </div>
                    <div className="mt-1 md:hidden">
                      {r.result === 'WIN' ? <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">WIN</span> : <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">LOSE</span>}
                    </div>
                  </td>
                  <td className="hidden md:table-cell p-3 text-center font-bold">
                    {r.result === 'WIN' ? <span className="text-red-500">WIN</span> : <span className="text-blue-500">LOSE</span>}
                  </td>
                </tr>
              );
            })}
            {sortedRecords.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">該当する戦績がありません</td></tr>}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
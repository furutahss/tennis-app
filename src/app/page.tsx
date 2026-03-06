'use client';
import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/apiClient';
import { RecordData, Tournament, Opponent, Place } from '@/types';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [filterYear, setFilterYear] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [filterTournament, setFilterTournament] = useState('');
  const [filterOpponent, setFilterOpponent] = useState('');

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
              <th className="p-2 md:p-3 border-b">大会/ラウンド</th>
              <th className="p-2 md:p-3 border-b">対戦相手</th>
              <th className="p-2 md:p-3 border-b text-center">スコア</th>
              <th className="hidden md:table-cell p-3 border-b text-center">結果</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-2 md:p-3 max-w-[140px] md:max-w-none break-words">
                  {formatTournament(r.tournaments_id)} <span className="text-gray-500 block md:inline">({r.round})</span>
                </td>
                <td className="p-2 md:p-3 break-words">{getName(opponents, r.opponents_id)}</td>
                <td className="p-2 md:p-3 text-center font-mono">
                  <div>
                    {r.is_ret_me ? 'RET' : r.my_score} - {r.is_ret_op ? 'RET' : r.op_score}
                    {(r.my_tb_score || r.op_tb_score) ? <span className="block md:inline text-[10px] md:text-xs"> ({r.my_tb_score}-{r.op_tb_score})</span> : ''}
                  </div>
                  {/* スマホ用 結果バッジ */}
                  <div className="mt-1 md:hidden">
                    {r.result === 'WIN' ? <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">WIN</span> : <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">LOSE</span>}
                  </div>
                </td>
                <td className="hidden md:table-cell p-3 text-center font-bold">
                  {r.result === 'WIN' ? <span className="text-red-500">WIN</span> : <span className="text-blue-500">LOSE</span>}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">該当する戦績がありません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
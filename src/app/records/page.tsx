'use client';
import { useEffect, useState } from 'react';
import { fetchAPI, saveAPI, deleteAPI } from '@/lib/apiClient';
import { RecordData, Tournament, Opponent, Place } from '@/types';
import Fab from '@/components/Fab';
import Modal from '@/components/Modal';

const initForm: RecordData = { tournaments_id: '', opponents_id: '', round: '', my_score: '', op_score: '', my_tb_score: '', op_tb_score: '', is_ret_me: false, is_ret_op: false, result: '', url: '' };

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeOpponent, setActiveOpponent] = useState<Opponent | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<RecordData>(initForm);

  const [searchOp, setSearchOp] = useState('');
  const [showOpList, setShowOpList] = useState(false);

  const loadData = async () => {
    const [r, t, o, p] = await Promise.all([fetchAPI('records'), fetchAPI('tournaments'), fetchAPI('opponents'), fetchAPI('places')]);
    setRecords(r); setTournaments(t); setOpponents(o); setPlaces(p);
  };
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (form.opponents_id) {
      setSearchOp(getName(opponents, form.opponents_id));
    } else {
      setSearchOp('');
    }
  }, [form.opponents_id, opponents]);

  const calculateResult = (f: RecordData): 'WIN' | 'LOSE' => {
    if (f.is_ret_me) return 'LOSE';
    if (f.is_ret_op) return 'WIN';
    const myS = Number(f.my_score) || 0;
    const opS = Number(f.op_score) || 0;
    if (myS > opS) return 'WIN';
    if (myS < opS) return 'LOSE';
    const myTB = Number(f.my_tb_score) || 0;
    const opTB = Number(f.op_tb_score) || 0;
    return myTB > opTB ? 'WIN' : 'LOSE';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.opponents_id) {
      alert('対戦相手をリストから選択してください。');
      return;
    }
    const dataToSave = { ...form, result: calculateResult(form) };
    await saveAPI('records', dataToSave, !!form.id);
    setIsModalOpen(false);
    loadData();
  };

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

  // 登録用：大会を日付の新しい順にソート
  const sortedTournamentsForSelect = [...tournaments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 一覧用：日付でソート
  const sortedRecords = [...records].sort((a, b) => {
    const tA = tournaments.find(t => t.id == a.tournaments_id);
    const tB = tournaments.find(t => t.id == b.tournaments_id);
    const dateA = tA ? new Date(tA.date).getTime() : 0;
    const dateB = tB ? new Date(tB.date).getTime() : 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <>
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">🎾 戦績一覧</h1>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th 
                className="p-2 md:p-4 cursor-pointer hover:bg-gray-200 transition select-none"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                大会/ラウンド {sortOrder === 'desc' ? '▼' : '▲'}
              </th>
              <th className="p-2 md:p-4">相手</th>
              <th className="p-2 md:p-4 text-center">スコア</th>
              <th className="hidden sm:table-cell p-4 text-center">結果</th>
              <th className="p-2 md:p-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map(r => {
              const op = opponents.find(o => o.id == r.opponents_id);
              return (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 md:p-4 font-medium max-w-[120px] md:max-w-none break-words">
                    {formatTournament(r.tournaments_id)}<br/>
                    <span className="text-[10px] md:text-sm text-gray-500">{r.round}</span>
                  </td>
                  <td className="p-2 md:p-4 max-w-[80px] md:max-w-none break-words">
                    {op ? (
                      <button onClick={() => { setActiveOpponent(op); setIsHistoryOpen(true); }} className="text-blue-600 font-bold hover:underline text-left">
                        {op.name}
                      </button>
                    ) : '不明'}
                  </td>
                  <td className="p-2 md:p-4 text-center font-mono text-sm md:text-lg">
                    <div className="flex justify-center items-center gap-1 md:gap-2">
                      <span className={r.is_ret_me ? 'text-red-500 text-[10px] md:text-sm' : ''}>{r.is_ret_me ? 'RET' : r.my_score}</span>
                      <span>-</span>
                      <span className={r.is_ret_op ? 'text-red-500 text-[10px] md:text-sm' : ''}>{r.is_ret_op ? 'RET' : r.op_score}</span>
                    </div>
                    {(r.my_tb_score || r.op_tb_score) ? <div className="text-[10px] md:text-xs text-gray-500">TB: {r.my_tb_score} - {r.op_tb_score}</div> : null}
                    <div className="mt-1 sm:hidden">
                      {r.result === 'WIN' ? <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px]">WIN</span> : <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">LOSE</span>}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell p-4 text-center font-bold">
                    {r.result === 'WIN' ? <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">WIN</span> : <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">LOSE</span>}
                  </td>
                  <td className="p-2 md:p-4 text-center">
                    <div className="flex flex-col sm:flex-row gap-1 justify-center items-center">
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] md:text-sm bg-green-100 text-green-600 px-2 py-1 md:px-3 rounded w-full sm:w-auto text-center">動画</a>
                      )}
                      <button onClick={() => { setForm(r); setIsModalOpen(true); }} className="text-[10px] md:text-sm bg-gray-200 px-2 py-1 md:px-3 rounded w-full sm:w-auto">編集</button>
                      <button onClick={async () => { if(confirm('削除しますか？')) { await deleteAPI('records', r.id!); loadData(); } }} className="text-[10px] md:text-sm bg-red-100 text-red-600 px-2 py-1 md:px-3 rounded w-full sm:w-auto">削除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Fab onClick={() => { setForm(initForm); setIsModalOpen(true); }} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "戦績の編集" : "戦績の登録"}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:gap-4 text-sm md:text-base">
          <select value={form.tournaments_id} onChange={e => setForm({...form, tournaments_id: e.target.value})} required className="border p-2 rounded bg-gray-50">
            <option value="">大会を選択</option>
            {sortedTournamentsForSelect.map(t => <option key={t.id} value={t.id}>{formatTournament(t.id)}</option>)}
          </select>
          <input type="text" placeholder="ラウンド (例: 予選1回戦)" value={form.round} onChange={e => setForm({...form, round: e.target.value})} required className="border p-2 rounded" />
          
          <div className="relative">
            <input
              type="text"
              placeholder="対戦相手を検索して選択"
              value={searchOp}
              onChange={e => {
                setSearchOp(e.target.value);
                setShowOpList(true);
                setForm(prev => ({...prev, opponents_id: ''}));
              }}
              onFocus={() => setShowOpList(true)}
              onBlur={() => setTimeout(() => setShowOpList(false), 200)}
              className="border p-2 rounded bg-gray-50 w-full"
              required
            />
            {showOpList && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                {opponents.filter(o => o.name.toLowerCase().includes(searchOp.toLowerCase()) || (o.memo && o.memo.toLowerCase().includes(searchOp.toLowerCase()))).map(o => (
                  <li
                    key={o.id}
                    className="p-3 hover:bg-blue-100 cursor-pointer text-sm border-b last:border-0"
                    onClick={() => {
                      setForm(prev => ({...prev, opponents_id: String(o.id)}));
                      setSearchOp(o.name);
                      setShowOpList(false);
                    }}
                  >
                    {o.name} {o.memo && <span className="text-xs text-gray-500 ml-2">({o.memo})</span>}
                  </li>
                ))}
                {opponents.filter(o => o.name.toLowerCase().includes(searchOp.toLowerCase()) || (o.memo && o.memo.toLowerCase().includes(searchOp.toLowerCase()))).length === 0 && (
                  <li className="p-3 text-sm text-gray-500">一致する相手がいません</li>
                )}
              </ul>
            )}
          </div>
          
          <div className="p-2 md:p-4 border rounded bg-gray-50 grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-bold mb-1 text-center">自分</label>
              <input type="number" placeholder="スコア" value={form.my_score} onChange={e => setForm({...form, my_score: e.target.value})} disabled={form.is_ret_me} className="border p-1.5 md:p-2 rounded w-full mb-2" />
              <input type="number" placeholder="TB" value={form.my_tb_score} onChange={e => setForm({...form, my_tb_score: e.target.value})} disabled={form.is_ret_me} className="border p-1.5 md:p-2 rounded w-full mb-2" />
              <label className="flex items-center justify-center gap-1 text-[10px] md:text-sm text-red-600 font-bold"><input type="checkbox" checked={form.is_ret_me} onChange={e => setForm({...form, is_ret_me: e.target.checked})} /> リタイア</label>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-bold mb-1 text-center">相手</label>
              <input type="number" placeholder="スコア" value={form.op_score} onChange={e => setForm({...form, op_score: e.target.value})} disabled={form.is_ret_op} className="border p-1.5 md:p-2 rounded w-full mb-2" />
              <input type="number" placeholder="TB" value={form.op_tb_score} onChange={e => setForm({...form, op_tb_score: e.target.value})} disabled={form.is_ret_op} className="border p-1.5 md:p-2 rounded w-full mb-2" />
              <label className="flex items-center justify-center gap-1 text-[10px] md:text-sm text-red-600 font-bold"><input type="checkbox" checked={form.is_ret_op} onChange={e => setForm({...form, is_ret_op: e.target.checked})} /> リタイア</label>
            </div>
          </div>
          
          <input type="url" placeholder="動画URL (任意)" value={form.url || ''} onChange={e => setForm({...form, url: e.target.value})} className="border p-2 rounded bg-gray-50" />
          
          <button type="submit" className="bg-blue-600 text-white p-2 md:p-3 rounded font-bold hover:bg-blue-700">保存</button>
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
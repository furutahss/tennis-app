export type Place = { id?: number; name: string };
export type Tournament = { id?: number; places_id: number | string; name: string; date: string; result: string };
export type Opponent = { id?: number; name: string; memo: string; spec: string };
export type RecordData = {
  id?: number;
  tournaments_id: number | string;
  opponents_id: number | string;
  round: string;
  my_score: number | string;
  op_score: number | string;
  my_tb_score: number | string;
  op_tb_score: number | string;
  is_ret_me: boolean;
  is_ret_op: boolean;
  result: 'WIN' | 'LOSE' | '';
  url: string;
};
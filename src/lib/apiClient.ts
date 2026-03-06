const API_BASE = 'http://localhost:8000/api.php';

export const fetchAPI = async (type: string) => {
  const res = await fetch(`${API_BASE}?type=${type}`);
  return res.json();
};

export const saveAPI = async (type: string, data: any, isEdit = false) => {
  const res = await fetch(`${API_BASE}?type=${type}`, {
    method: isEdit ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteAPI = async (type: string, id: number) => {
  await fetch(`${API_BASE}?type=${type}&id=${id}`, { method: 'DELETE' });
};
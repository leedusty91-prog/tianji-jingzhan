import type { DivinationRecord } from '../types';

const API_BASE = '/api';

export async function fetchRecords(): Promise<DivinationRecord[]> {
  const res = await fetch(`${API_BASE}/records`);
  if (!res.ok) {
    throw new Error(`Failed to fetch records: ${res.status}`);
  }
  return res.json();
}

export async function createRecord(
  data: Omit<DivinationRecord, 'id' | 'createdAt'>
): Promise<DivinationRecord> {
  const res = await fetch(`${API_BASE}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to create record: ${res.status}`);
  }
  return res.json();
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/records/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete record: ${res.status}`);
  }
}

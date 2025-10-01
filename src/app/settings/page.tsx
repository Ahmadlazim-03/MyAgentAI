'use client';

import React, { useEffect, useState } from 'react';
import { aiService } from '@/lib/ai-service';

export default function SettingsPage() {
  const [keys, setKeys] = useState<{ index: number; masked: string }[]>([]);
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await aiService.listKeys();
      setKeys(list);
    } catch {
      setError('Tidak dapat memuat daftar API key.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    setLoading(true);
    setError(null);
    setOkMsg(null);
    try {
      const ok = await aiService.addKey(newKey);
      if (!ok) return setError('Gagal menambahkan key. Pastikan formatnya benar.');
      setNewKey('');
      setOkMsg('Key ditambahkan.');
      await load();
    } catch {
      setError('Gagal menambahkan key.');
    } finally {
      setLoading(false);
    }
  };

  const del = async (index: number) => {
    setLoading(true);
    setError(null);
    setOkMsg(null);
    try {
      const ok = await aiService.deleteKeyByIndex(index);
      if (!ok) return setError('Gagal menghapus key.');
      setOkMsg('Key dihapus.');
      await load();
    } catch {
      setError('Gagal menghapus key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings • API Keys</h1>
        <p className="text-sm text-gray-600 mb-4">Tambahkan beberapa Gemini API Key sebagai cadangan (backup). Sistem akan mencoba kunci lain jika kunci saat ini limit.</p>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tambah API Key</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Masukkan Gemini API Key"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2"
            />
            <button onClick={add} disabled={loading || !newKey.trim()} className="px-4 py-2 rounded-lg text-white accent-gradient disabled:opacity-50">Tambah</button>
          </div>
          {error ? <p className="text-red-600 text-sm mt-2">{error}</p> : null}
          {okMsg ? <p className="text-green-600 text-sm mt-2">{okMsg}</p> : null}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Daftar Key</h2>
            <button onClick={load} className="text-sm text-gray-600 hover:text-gray-900">Refresh</button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada key tambahan. ENV key tetap akan digunakan jika tersedia.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {keys.map(k => (
                <li key={k.index} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-800">{k.masked}</span>
                  <button onClick={() => del(k.index)} className="text-sm text-red-600 hover:text-red-700">Hapus</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

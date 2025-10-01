import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), '.keys');
const FILE = path.join(DIR, 'gemini-keys.json');

function ensureStore() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ keys: [] }, null, 2));
}

export function loadKeys(): string[] {
  try {
    ensureStore();
    const raw = fs.readFileSync(FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data.keys) ? data.keys : [];
  } catch {
    return [];
  }
}

export function saveKeys(keys: string[]) {
  ensureStore();
  fs.writeFileSync(FILE, JSON.stringify({ keys }, null, 2));
}

export function getAllKeys(includeEnv = true): string[] {
  const stored = loadKeys();
  const envKey = process.env.GEMINI_API_KEY ? [String(process.env.GEMINI_API_KEY)] : [];
  // Env key first, then stored; de-duplicate while preserving order
  const seen = new Set<string>();
  const ordered = [...(includeEnv ? envKey : []), ...stored].filter(k => {
    if (!k) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return ordered;
}

export function addKey(key: string): { added: boolean; reason?: string } {
  const clean = key.trim();
  if (!clean || clean.length < 20) {
    return { added: false, reason: 'API key terlalu pendek atau tidak valid.' };
  }
  const keys = loadKeys();
  if (keys.includes(clean)) {
    return { added: false, reason: 'API key sudah ada.' };
  }
  keys.push(clean);
  saveKeys(keys);
  return { added: true };
}

export function deleteKey(keyOrIndex: string | number): { deleted: boolean; reason?: string } {
  const keys = loadKeys();
  let idx = -1;
  if (typeof keyOrIndex === 'number') idx = keyOrIndex;
  else idx = keys.indexOf(keyOrIndex);
  if (idx < 0 || idx >= keys.length) return { deleted: false, reason: 'Key tidak ditemukan.' };
  keys.splice(idx, 1);
  saveKeys(keys);
  return { deleted: true };
}

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return key.replace(/.(?=.{4})/g, '*');
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}

import fs from 'fs';
import path from 'path';

export interface MosqueSnapshot {
  id: string;
  slug: string;
  name: string;
  city: string;
  postcode: string;
}

// In-memory lookup map of verified mosques loaded from static public/mosques.json
let mosquesMap: Map<string, MosqueSnapshot> | null = null;
let slugMap: Map<string, MosqueSnapshot> | null = null;

function loadMosques(): void {
  if (mosquesMap) return;

  mosquesMap = new Map();
  slugMap = new Map();

  // Try locating mosques.json
  const possiblePaths = [
    path.resolve(__dirname, '..', '..', 'public', 'mosques.json'),
    path.resolve(process.cwd(), 'public', 'mosques.json'),
    path.resolve(process.cwd(), '..', 'public', 'mosques.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        for (const m of data) {
          const snapshot: MosqueSnapshot = {
            id: String(m.id),
            slug: String(m.slug),
            name: String(m.name),
            city: String(m.city),
            postcode: String(m.postcode || ''),
          };
          mosquesMap.set(snapshot.id, snapshot);
          slugMap.set(snapshot.slug, snapshot);
        }
        break;
      } catch (err) {
        console.error('Error parsing mosques.json for backend validator:', err);
      }
    }
  }
}

export function getVerifiedMosque(identifier: string): MosqueSnapshot | null {
  loadMosques();
  if (!mosquesMap || !slugMap) return null;

  return mosquesMap.get(identifier) || slugMap.get(identifier) || null;
}

export function isValidMosque(identifier: string): boolean {
  return getVerifiedMosque(identifier) !== null;
}

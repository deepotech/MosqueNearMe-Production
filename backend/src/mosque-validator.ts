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

  // Try locating mosques.json.
  // The primary path is backend/mosques.json — a copy committed alongside the
  // backend source so the validator always works in production (Railway, etc.)
  // even when the backend is deployed without the frontend directory tree.
  // The remaining paths are fallbacks for local monorepo development.
  const possiblePaths = [
    // Primary: backend/mosques.json (dist/ → .. → backend root)
    path.resolve(__dirname, '..', 'mosques.json'),
    // Fallback 1: monorepo public/ from compiled dist/ (dist/ → backend/ → project root)
    path.resolve(__dirname, '..', '..', 'public', 'mosques.json'),
    // Fallback 2: public/ relative to process.cwd() when run from backend/
    path.resolve(process.cwd(), 'public', 'mosques.json'),
    // Fallback 3: public/ one level above cwd (run from backend/)
    path.resolve(process.cwd(), '..', 'public', 'mosques.json'),
    // Fallback 4: mosques.json at cwd root (e.g., Railway CWD = backend/)
    path.resolve(process.cwd(), 'mosques.json'),
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
        console.log(`[mosque-validator] Loaded ${mosquesMap.size} mosques from: ${p}`);
        break;
      } catch (err) {
        console.error('Error parsing mosques.json for backend validator:', err);
      }
    }
  }

  if (mosquesMap.size === 0) {
    console.warn(
      '[mosque-validator] WARNING: No mosques loaded from any candidate path. ' +
      'All donation requests will be rejected with "Invalid or unknown mosque." ' +
      'Ensure backend/mosques.json exists and is readable.'
    );
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

/** Returns the number of mosques currently loaded in the in-memory registry. */
export function getMosqueCount(): number {
  loadMosques();
  return mosquesMap?.size ?? 0;
}

// Eagerly pre-load on module import so any file-not-found warning appears
// in the server startup log rather than silently on the first request.
loadMosques();

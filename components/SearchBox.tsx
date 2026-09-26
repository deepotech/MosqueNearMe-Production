'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBox() {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const router = useRouter();

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search mosque name, city or postcode..."
                style={{
                    width: '100%',
                    padding: '15px 56px 15px 18px',
                    borderRadius: '10px',
                    border: focused ? '2px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.3)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    transition: 'border-color 0.2s',
                }}
            />
            <style>{`
                ::placeholder { color: rgba(255,255,255,0.6); }
            `}</style>
            <button
                type="submit"
                style={{
                    position: 'absolute', right: '6px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#c8a84b',
                    color: 'white', border: 'none',
                    borderRadius: '8px',
                    width: '44px', height: '38px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                    transition: 'background 0.2s',
                    boxShadow: '0 2px 8px rgba(200,168,75,0.4)',
                }}
            >
                🔍
            </button>
        </form>
    );
}

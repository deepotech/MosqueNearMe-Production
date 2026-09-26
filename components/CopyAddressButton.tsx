'use client';

import { useState } from 'react';

export default function CopyAddressButton({ address }: { address: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginLeft: '10px',
                padding: '4px',
                fontSize: '1.1rem',
                verticalAlign: 'middle',
                color: copied ? 'green' : '#666',
                transition: 'color 0.2s'
            }}
            title="Copy Address"
            aria-label="Copy address to clipboard"
        >
            {copied ? '✅' : '📋'}
        </button>
    );
}

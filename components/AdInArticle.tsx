'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdInArticleProps {
    slot: string;
    style?: React.CSSProperties;
}

export default function AdInArticle({ slot, style }: AdInArticleProps) {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <div style={{ margin: '20px 0', textAlign: 'center', ...style }}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center' }}
                data-ad-layout="in-article"
                data-ad-format="fluid"
                data-ad-client="ca-pub-6331163447795368"
                data-ad-slot={slot}
            />
        </div>
    );
}

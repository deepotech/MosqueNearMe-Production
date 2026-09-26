import { getAllMosques } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
    const mosques = await getAllMosques();
    const categories = new Set<string>();

    mosques.forEach(m => {
        if (m.category) categories.add(m.category);
        if (m.theme && m.theme !== 'General' && m.theme !== 'Unknown') categories.add(m.theme);
    });

    return Array.from(categories)
        .filter(cat => cat && typeof cat === 'string')
        .map(cat => ({
            category: cat.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        }))
        .filter(p => p.category.length > 0);
}

export async function generateMetadata({ params }: PageProps) {
    const { category } = await params;
    const catName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
        title: `${catName} Mosques in UK - Find ${catName} Prayer Places`,
        description: `Directory of ${catName} mosques and Islamic centres in the UK.`,
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const mosques = await getAllMosques();
    const { category: catSlug } = await params;

    const filteredMosques = mosques.filter(m => {
        const catMatch = m.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === catSlug;
        const themeMatch = m.theme.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === catSlug;
        return catMatch || themeMatch;
    });

    if (filteredMosques.length === 0) {
        notFound();
    }

    // Determine display name
    const displayCat = filteredMosques[0].category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === catSlug
        ? filteredMosques[0].category
        : filteredMosques[0].theme;

    return (
        <div className="container">
            <div style={{ marginBottom: '20px' }}>
                <Link href="/" style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>&larr; Back to Home</Link>
            </div>

            <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '10px' }}>{displayCat} Mosques in UK</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>Found {filteredMosques.length} locations.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filteredMosques.map(m => (
                    <Link
                        key={m.slug}
                        href={`/mosques/${m.slug}`}
                        style={{
                            display: 'block',
                            padding: '20px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            border: '1px solid #eee'
                        }}
                    >
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginBottom: '5px' }}>{m.name}</h3>
                        <p style={{ color: '#555', marginBottom: '5px' }}>{m.city}</p>
                        <div style={{ marginTop: '10px' }}>
                            <span className="tag category">{m.category}</span>
                            <span className="tag">{m.theme}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

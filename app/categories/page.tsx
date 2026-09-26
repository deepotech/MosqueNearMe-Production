import { getAllMosques } from '@/lib/data';
import Link from 'next/link';

function generateSlug(text: string): string {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const metadata = {
    title: 'Browse Mosques by Category | Mosque Near Me',
    description: 'Browse mosques by type, denomination, and community across the UK.',
};

export default async function CategoriesPage() {
    const mosques = await getAllMosques();

    // Aggregate categories
    const categoryCounts: Record<string, number> = {};
    mosques.forEach(m => {
        if (m.category) {
            categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
        }
        if (m.theme && m.theme !== 'General' && m.theme !== 'Unknown') {
            categoryCounts[m.theme] = (categoryCounts[m.theme] || 0) + 1;
        }
    });

    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]); // Sort by count descending

    return (
        <div className="container">
            <div style={{ marginBottom: '20px' }}>
                <Link href="/" style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>&larr; Back to Home</Link>
            </div>

            <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '10px' }}>Browse by Category</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>Find mosques by type, denomination, and community.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {sortedCategories.map(([category, count]) => (
                    <Link
                        key={category}
                        href={`/categories/${generateSlug(category)}`}
                        style={{
                            display: 'block',
                            padding: '20px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            border: '1px solid #eee',
                            textDecoration: 'none'
                        }}
                    >
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary-color)', marginBottom: '5px' }}>{category}</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>{count} Locations</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

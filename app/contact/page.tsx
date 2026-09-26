import Link from 'next/link';

export const metadata = {
    title: 'Contact Us | Mosque Near Me',
    description: 'Get in touch with the Mosque Near Me team. Report errors, add mosques, or send feedback.',
};

const CONTACTS = [
    {
        icon: '📧',
        title: 'General Inquiries',
        desc: 'Questions, feedback, or partnership opportunities.',
        label: 'Email Us',
        href: 'mailto:dounia.elmarradi@gmail.com',
        bg: '#0f4c35',
    },
    {
        icon: '🔧',
        title: 'Update Mosque Data',
        desc: 'Found incorrect information? Help us keep the directory accurate.',
        label: 'Report an Issue',
        href: 'mailto:dounia.elmarradi@gmail.com?subject=Mosque%20Data%20Update',
        bg: '#059669',
    },
    {
        icon: '➕',
        title: 'Add a Mosque',
        desc: "Know a mosque that's not listed? We'd love to add it.",
        label: 'Submit a Mosque',
        href: 'mailto:dounia.elmarradi@gmail.com?subject=Add%20New%20Mosque',
        bg: '#c8a84b',
    },
];

const FAQS = [
    { q: 'How accurate are the prayer times?', a: 'Prayer times are calculated based on GPS coordinates using the Muslim World League method. They may differ slightly from a mosque\'s official Jamaat times — always verify with the mosque directly.' },
    { q: 'How do I add or update a mosque?', a: 'Email us with the mosque name, address, and any facility details. We review and add submissions within a few days.' },
    { q: 'Is Mosque Near Me free to use?', a: 'Yes! Our directory is completely free and will remain so. We\'re funded by non-intrusive ads.' },
    { q: 'How long until I get a reply?', a: 'We\'re a small team, but aim to respond within 48 hours. Thank you for your patience.' },
];

export default function ContactPage() {
    return (
        <div style={{ background: '#f7f8f5', minHeight: '100vh' }}>

            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #082e20 0%, #0f4c35 60%, #1a6b4a 100%)',
                padding: '80px 24px 70px',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ color: '#c8a84b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
                        💬 Get In Touch
                    </p>
                    <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: '900', color: 'white', marginBottom: '16px', letterSpacing: '-0.03em' }}>
                        Contact Us
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto 28px', lineHeight: '1.7' }}>
                        We&apos;d love to hear from you. Whether it&apos;s feedback, a missing mosque, or a correction — reach out anytime.
                    </p>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)',
                        border: '1.5px solid rgba(255,255,255,0.25)', padding: '10px 22px',
                        borderRadius: '99px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
                    }}>
                        ← Back to Home
                    </Link>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 48L60 40C120 32 240 16 360 12C480 8 600 16 720 22C840 28 960 34 1080 32C1200 30 1320 22 1380 18L1440 14V48H0Z" fill="#f7f8f5"/>
                    </svg>
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '50px 24px 80px' }}>

                {/* Contact Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '60px' }}>
                    {CONTACTS.map(c => (
                        <div key={c.title} style={{
                            background: 'white', borderRadius: '16px',
                            border: '1px solid #e5e7eb', padding: '28px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{
                                width: '52px', height: '52px',
                                background: c.bg,
                                borderRadius: '14px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', marginBottom: '16px',
                                boxShadow: `0 4px 12px ${c.bg}44`,
                            }}>
                                {c.icon}
                            </div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>{c.title}</h2>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>{c.desc}</p>
                            <a href={c.href} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: c.bg, color: 'white',
                                padding: '10px 20px', borderRadius: '99px',
                                fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none',
                                boxShadow: `0 4px 12px ${c.bg}44`,
                                alignSelf: 'flex-start',
                            }}>
                                {c.label} →
                            </a>
                        </div>
                    ))}
                </div>

                {/* FAQ */}
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                        Frequently Asked Questions
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {FAQS.map(faq => (
                            <div key={faq.q} style={{
                                background: 'white', borderRadius: '14px',
                                border: '1px solid #e5e7eb', padding: '22px 24px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ color: '#c8a84b', flexShrink: 0 }}>Q.</span>
                                    {faq.q}
                                </h3>
                                <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.7', margin: 0, paddingLeft: '24px' }}>
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Response time note */}
                <div style={{
                    marginTop: '40px',
                    background: 'linear-gradient(135deg, #082e20, #0f4c35)',
                    borderRadius: '16px', padding: '28px 32px',
                    display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
                }}>
                    <div style={{ fontSize: '2.5rem' }}>⏱️</div>
                    <div>
                        <h3 style={{ color: 'white', fontWeight: '700', marginBottom: '4px' }}>Response Time</h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                            We aim to respond to all inquiries within <strong style={{ color: '#c8a84b' }}>48 hours</strong>. Thank you for your patience and support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

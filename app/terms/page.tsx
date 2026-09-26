import Link from 'next/link';

export const metadata = {
    title: 'Terms of Service | Mosque Near Me',
    description: 'Terms of Service for using Mosque Near Me.',
};

export default function TermsPage() {
    return (
        <div className="container">
            <div style={{ marginBottom: '20px' }}>
                <Link href="/" style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>&larr; Back to Home</Link>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginBottom: '20px' }}>Terms of Service</h1>
                <p style={{ marginBottom: '20px', color: '#666' }}>Last Updated: November 2025</p>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>1. Acceptance of Terms</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>2. Accuracy of Information</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        <strong>Disclaimer:</strong> While we strive to keep the information on Mosque Near Me accurate and up-to-date,
                        we cannot guarantee the correctness of mosque details, prayer times, or facility information.
                        Prayer times are calculated estimates or sourced from mosque websites and should be verified with the local mosque.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>3. User Conduct</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        You agree to use the website only for lawful purposes. You are prohibited from posting or transmitting to or from
                        this site any unlawful, threatening, libelous, defamatory, obscene, pornographic, or other material that would violate any law.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>4. Limitation of Liability</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        Mosque Near Me and its owners shall not be liable for any damages whatsoever, and in particular
                        Mosque Near Me shall not be liable for any special, indirect, consequential, or incidental damages,
                        or damages for lost profits, loss of revenue, or loss of use, arising out of or related to this web site
                        or the information contained in it.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>5. Changes to Terms</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        We reserve the right to modify these terms at any time. You should check these terms periodically for changes.
                        By using this site after we post any changes to these terms, you agree to accept those changes.
                    </p>
                </section>
            </div>
        </div>
    );
}

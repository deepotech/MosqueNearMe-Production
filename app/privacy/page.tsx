import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy | Mosque Near Me',
    description: 'Privacy Policy for Mosque Near Me. Learn how we handle your data.',
};

export default function PrivacyPage() {
    return (
        <div className="container">
            <div style={{ marginBottom: '20px' }}>
                <Link href="/" style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>&larr; Back to Home</Link>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginBottom: '20px' }}>Privacy Policy</h1>
                <p style={{ marginBottom: '20px', color: '#666' }}>Last Updated: November 2025</p>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>1. Introduction</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        Welcome to Mosque Near Me. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you visit our website
                        and tell you about your privacy rights and how the law protects you.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>2. Data We Collect</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px', color: '#444' }}>
                        <li><strong>Usage Data:</strong> Information about how you use our website, products and services.</li>
                        <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
                        <li><strong>Location Data:</strong> If you grant permission, we use your location to show mosques near you. This data is processed locally on your device and is not stored on our servers.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>3. Cookies and Tracking Technologies</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.
                        We use Google Analytics to understand how our website is used. We also use Google AdSense to display advertisements.
                        These third-party vendors may use cookies to serve ads based on your prior visits to our website or other websites.
                    </p>
                    <p style={{ marginTop: '10px', lineHeight: '1.6', color: '#444' }}>
                        You can choose to disable cookies through your individual browser options.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>4. Third-Party Links</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling
                        those connections may allow third parties to collect or share data about you. We do not control these third-party websites
                        and are not responsible for their privacy statements.
                    </p>
                </section>

                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>5. Contact Us</h2>
                    <p style={{ lineHeight: '1.6', color: '#444' }}>
                        If you have any questions about this privacy policy or our privacy practices, please contact us at:
                        <a href="mailto:dounia.elmarradi@gmail.com" style={{ color: 'var(--secondary-color)', marginLeft: '5px' }}>dounia.elmarradi@gmail.com</a>
                    </p>
                </section>
            </div>
        </div>
    );
}

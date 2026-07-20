import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'BNI 121 · HopeTech', description: 'BNI outreach operations' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="shell">
    <aside className="side"><div className="brand"><div className="logo">BK</div><div><strong>Dr. BK Murali</strong><small>BNI 121 · AI Tools</small></div></div>
      <div className="nav-label">DAILY</div><Link className="nav-link" href="/follow-ups">↔ Follow-ups</Link>
      <div className="nav-label">PIPELINE</div><Link className="nav-link" href="/tracker">▣ Contact Tracker</Link><Link className="nav-link" href="/proposals">✓ Proposals</Link>
    </aside><main className="main"><div className="top">BNI 121</div>{children}</main>
  </div></body></html>;
}

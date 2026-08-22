export const metadata = {
  title: 'WhatsApp Communication - HopeTech',
  description: 'WhatsApp Communication for Hope Hospital'
};

export default function WhatsAppCommunicationLayout({ children }: { children: React.ReactNode }) {
  // Nested layouts must not render <html>/<head>/<body> — the root layout owns those.
  return <>{children}</>;
}
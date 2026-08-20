import { permanentRedirect } from 'next/navigation';

export default function Home() {
  // Redirect to the main landing page
  permanentRedirect('/hopetech-landing.html');
}

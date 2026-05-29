import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Pizza & Pasta Inn',
  description: 'Learn more about Pizza & Pasta Inn - our journey of culinary excellence, branches, and specialties.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

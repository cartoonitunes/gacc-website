import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Dashboard | GACC',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar variant="dark" />
      {children}
      <Footer />
    </>
  );
}

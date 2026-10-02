import { Hero } from '@/features/landing/Hero';
import { Navbar } from '@/features/landing/Navbar';
import { CallToAction, Features, Footer, HowItWorks, Impact, Problem } from '@/features/landing/Sections';

export default function Home() {
  return (
    <>
      <Navbar />
      <main><Hero /><Problem /><HowItWorks /><Features /><Impact /><CallToAction /></main>
      <Footer />
    </>
  );
}

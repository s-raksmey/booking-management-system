import Header from '@/components/shared/Header';
import HeroSection from '@/components/shared/HeroSection';
import FeaturesSection from '@/components/shared/FeaturesSection';
import Footer from '@/components/shared/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header/>
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
import Header from '@/components/homePage/Header';
import HeroSection from '@/components/homePage/HeroSection';
import FeaturesSection from '@/components/homePage/FeaturesSection';
import Footer from '@/components/homePage/Footer';

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
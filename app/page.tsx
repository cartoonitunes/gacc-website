'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import RankLookup from '@/components/home/RankLookup';
import SubdomainManager from '@/components/home/SubdomainManager';
import RoadmapSection from '@/components/home/RoadmapSection';
import GallerySection from '@/components/home/GallerySection';
import TeamSection from '@/components/home/TeamSection';

export default function HomePage() {
  return (
    <div className="home-page min-h-screen">
      <Navbar variant="light" />

      <HeroSection />

      <div className="common-container px-4">
        <hr className="gray-line mb-5" />
      </div>

      <RankLookup />

      <div className="common-container px-4">
        <hr className="gray-line mb-5" />
      </div>

      <SubdomainManager />

      <div className="common-container px-4">
        <hr className="gray-line mb-5" />
      </div>

      <RoadmapSection />

      <div className="common-container px-4">
        <hr className="gray-line mb-5" />
      </div>

      <GallerySection />

      <div className="common-container px-4">
        <hr className="gray-line mb-5" />
      </div>

      <TeamSection />

      <Footer variant="light" />
    </div>
  );
}

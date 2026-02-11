'use client';

import HeroSection from '@/components/home/HeroSection';
import RankLookup from '@/components/home/RankLookup';
import SubdomainManager from '@/components/home/SubdomainManager';
import RoadmapSection from '@/components/home/RoadmapSection';
import GallerySection from '@/components/home/GallerySection';
import TeamSection from '@/components/home/TeamSection';

export default function HomePage() {
  return (
    <div className="bg-[#f9edcd] min-h-screen">
      <HeroSection />

      <div className="px-4 mt-4">
        <hr className="border-gray-300 mb-10" />
      </div>

      <RankLookup />

      <div className="px-4">
        <hr className="border-gray-300 mb-10" />
      </div>

      <SubdomainManager />

      <div className="px-4">
        <hr className="border-gray-300 mb-10" />
      </div>

      <RoadmapSection />

      <div className="px-4">
        <hr className="border-gray-300 mb-10" />
      </div>

      <GallerySection />

      <div className="px-4">
        <hr className="border-gray-300 mb-10" />
      </div>

      <TeamSection />
    </div>
  );
}

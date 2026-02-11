'use client';

import Image from 'next/image';

const roadmapItems = [
  { num: 1, text: 'The Grandpa Ape Country Club ("GACC") is minted.', done: true },
  { num: 2, text: 'Holders only GACC Merchandise is available for a limited time.', done: true },
  { num: 3, text: 'GACC Laboratory will open and begin airdropping Mutant Serums to GACC holders.', done: true },
  { num: 4, text: 'The Mutant Ape Country Club ("MACC") is minted and the mutation laboratory opens.', done: true },
  { num: 5, text: 'Holders begin accruing Grandpa Points ("GP") for buying and holding NFTs. Join the Discord to enroll!', done: true },
  { num: 6, text: 'The GACC Pro Shop will open, offering MACC merch, limited-edition drops, and GACC classics.', done: true },
  { num: 7, text: 'The Grandpa Ape Country Club V1 Toys collection is launched and the top 50 holders receive one for free.', done: true },
  { num: 8, text: 'Lunagems are mined and the Grandpa Ape Kitten Club ("GAKC") is born.', done: false },
  { num: 9, text: 'The GACC Laboratory experimentations reveal something spectacular...', done: false },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="common-container px-4 mb-5">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-8/12">
          <h2 className="common-title" style={{ color: 'black' }}>THE FRONT NINE</h2>
          <p className="common-p" style={{ color: 'black' }}>We&apos;re in this for the long haul.</p>
          <p className="common-p mb-6" style={{ color: 'black' }}>
            Just like the front nine of a golf course, our roadmap is a set of holes were working to complete and achieve together. Where the back nine takes us, only time will tell!
          </p>

          {roadmapItems.map((item) => (
            <div key={item.num} className="flex items-start gap-4 mb-2">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <span className="goal text-lg">{item.num}</span>
              </div>
              <p className={`common-p flex-1 ${item.done ? 'line-through' : ''}`} style={{ color: 'black' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <div className="lg:w-3/12 lg:ml-auto my-auto">
          <div className="shirt-container mx-auto rounded-md overflow-hidden">
            <Image
              src="/assets/images/Road_Map.png"
              alt="roadmap"
              width={400}
              height={400}
              className="shirt-mask"
            />
            <Image
              src="/assets/images/Road_Map.png"
              alt="roadmap"
              width={400}
              height={400}
              className="shirt"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

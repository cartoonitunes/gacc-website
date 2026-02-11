'use client';

import Image from 'next/image';

export default function TeamSection() {
  return (
    <section className="common-container px-4">
      <div id="team" className="mb-5">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-7/12">
            <h2 className="common-title" style={{ color: 'black' }}>THE TEAM</h2>
            <p className="common-p mb-4" style={{ color: 'black' }}>
              GACC is run by a team of hard-working collectors, focused on returning value and fun to the GACC NFT community.
            </p>
            <p className="common-p mb-2" style={{ color: 'black' }}>
              <span className="bold-text" style={{ color: '#977039' }}>SWIRL</span>{' '}
              <span className="italic">CEO AND CHIEF DJ{' '}
                <a href="https://twitter.com/SwirlOne" target="_blank" rel="noopener noreferrer"><i className="fa fa-twitter" style={{ color: 'black' }} /></a>
              </span>
            </p>
            <p className="common-p mb-2" style={{ color: 'black' }}>
              <span className="bold-text" style={{ color: '#977039' }}>CARTOON</span>{' '}
              <span className="italic">CODE MONKEY{' '}
                <a href="https://twitter.com/cartoonitunes" target="_blank" rel="noopener noreferrer"><i className="fa fa-twitter" style={{ color: 'black' }} /></a>
              </span>
            </p>
            <p className="common-p mb-2" style={{ color: 'black' }}>
              <span className="bold-text" style={{ color: '#977039' }}>DARK</span>{' '}
              <span className="italic">ALL THINGS DESIGN{' '}
                <a href="https://twitter.com/StudioDarkk" target="_blank" rel="noopener noreferrer"><i className="fa fa-twitter" style={{ color: 'black' }} /></a>
              </span>
            </p>
          </div>
          <div className="lg:w-4/12 lg:ml-auto my-auto">
            <div className="mb-2 overflow-hidden">
              <div className="w-full pb-[50%] relative rounded-md overflow-hidden">
                <Image
                  src="/assets/images/swirl.png"
                  alt="swirl"
                  fill
                  className="object-cover object-[center_70%]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Image src="/assets/images/cartoon.png" alt="cartoon" width={200} height={200} className="rounded-md w-full" />
              <Image src="/assets/images/dark.png" alt="dark" width={200} height={200} className="rounded-md w-full" />
            </div>
          </div>
        </div>
      </div>

      <hr className="gray-line mb-5" />

      <div className="mb-5 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-8/12">
          <h2 className="common-title" style={{ color: 'black' }}>THE ARTIST</h2>
          <p className="common-p" style={{ color: 'black' }}>
            Naro, a.k.a. Kuchuya, is the artist behind the immaculate GACC NFT ecosystem. Naro has been drawing for 25+ years and draws inspiration from films, video games, and Japanese anime. Naro has an amazing story and an even more amazing heart.
          </p>
        </div>
        <div className="lg:w-3/12 lg:ml-auto my-auto">
          <Image
            src="/assets/images/kuchuya.jpg"
            alt="kuchuya"
            width={300}
            height={300}
            className="rounded-md w-full"
          />
        </div>
      </div>

      <hr className="gray-line mb-5" />

      <div className="mb-5 text-center">
        <p style={{ color: 'black' }} className="text-sm">
          <span className="bold-text">VERIFIED SMART CONTRACT ADDRESS: </span>
          <a
            href="https://etherscan.io/address/0x4b103d07c18798365946e76845edc6b565779402"
            style={{ color: '#977039' }}
            className="break-all"
          >
            0x4B103d07C18798365946E76845EDC6b565779402
          </a>
        </p>
      </div>
    </section>
  );
}

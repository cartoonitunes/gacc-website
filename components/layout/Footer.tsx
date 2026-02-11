'use client';

import Image from 'next/image';

const SOCIALS = [
  { href: 'https://discord.gg/8uuhkZ2TA2', icon: 'fa-discord-alt', label: 'Discord' },
  { href: 'https://twitter.com/GrandpaApeCC', icon: 'fa-twitter', label: 'Twitter' },
  { href: 'https://www.instagram.com/grandpaapecountryclubofficial', icon: 'fa-instagram', label: 'Instagram' },
  { href: 'mailto:grandpaapecountryclub@gmail.com', icon: 'fa-envelope', label: 'Email' },
];

export function Footer({ variant = 'dark' }: { variant?: 'light' | 'dark' }) {
  const isLight = variant === 'light';
  const socialClass = isLight ? 'black-social-icon' : 'social-icon';

  return (
    <footer>
      <div className="line" />
      <div className="common-container px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="md:w-4/12 flex justify-center md:justify-start">
            <Image
              src={isLight ? '/assets/images/GACC-Banner-Black-V6.png' : '/assets/images/GACC_WHITE_2.png'}
              alt="GACC logo"
              width={200}
              height={70}
              className="h-[50px] w-auto"
            />
          </div>
          <div className="md:w-4/12 flex justify-center">
            <img
              src="https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0"
              alt="GACC NFT"
              className="footer-logo rounded-full"
            />
          </div>
          <div className="md:w-4/12 flex flex-col items-center md:items-end">
            <div className="flex items-center">
              {SOCIALS.map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  target={s.href.startsWith('mailto') ? undefined : '_blank'}
                  rel={s.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                  aria-label={s.label}
                  className={socialClass}
                >
                  <i className={`fa ${s.icon}`} />
                </a>
              ))}
            </div>
            <p className="copyright mt-2">
              &copy; {new Date().getFullYear()} Grandpa Ape Country Club
            </p>
          </div>
        </div>
      </div>
      <div className="last-line" />
    </footer>
  );
}

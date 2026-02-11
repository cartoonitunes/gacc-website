'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectWallet } from '@/components/shared/ConnectWallet';

const NAV_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/macc', label: 'MACC' },
  { href: '/kitten-club', label: 'KITTENS' },
  { href: '/grandpacoin', label: '$GRANDPA' },
];

const SOCIALS = [
  { href: 'https://discord.gg/8uuhkZ2TA2', icon: 'fa-discord-alt', label: 'Discord' },
  { href: 'https://twitter.com/GrandpaApeCC', icon: 'fa-twitter', label: 'Twitter' },
  { href: 'https://www.instagram.com/grandpaapecountryclubofficial', icon: 'fa-instagram', label: 'Instagram' },
  { href: 'mailto:grandpaapecountryclub@gmail.com', icon: 'fa-envelope', label: 'Email' },
];

export function Navbar({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);

  const isLight = variant === 'light';
  const bgClass = isLight ? 'bg-[#f9edcd]' : 'bg-black';
  const textClass = isLight ? 'text-black' : 'text-white';
  const logo = isLight ? '/assets/images/GACC-Banner-Black-V6.png' : '/assets/images/GACC_WHITE_2.png';
  const socialClass = isLight ? 'black-social-icon' : 'social-icon';

  return (
    <nav className={`${bgClass} px-4 py-3`}>
      <div className="common-container flex items-center justify-between">
        <Link href="/">
          <Image
            src={logo}
            alt="GACC logo"
            width={200}
            height={70}
            className="h-[50px] w-auto md:h-[70px]"
            priority
          />
        </Link>

        <button
          className={`md:hidden p-2 ${textClass}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${textClass} font-medium text-sm hover:opacity-70 transition-opacity`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-1">
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
          <ConnectWallet />
        </div>
      </div>

      {open && (
        <div className="md:hidden mt-3 flex flex-col gap-3 pb-3 common-container">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${textClass} font-medium text-sm`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-1">
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
          <ConnectWallet />
        </div>
      )}
    </nav>
  );
}

const GACC_IMAGE =
  'https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0';

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Grandpa Ape Country Club',
  alternateName: 'GACC',
  url: 'https://grandpaapecountryclub.com',
  logo: GACC_IMAGE,
  description:
    'The Grandpa Ape Country Club (GACC) is a collection of 5,000 unique Grandpa Ape NFTs on the Ethereum blockchain, with an ecosystem of derivative collections and ERC-20 tokens.',
  sameAs: [
    'https://twitter.com/GrandpaApeCC',
    'https://discord.gg/8uuhkZ2TA2',
    'https://www.instagram.com/grandpaapecountryclubofficial',
    'https://opensea.io/collection/grandpa-ape-country-club',
  ],
  foundingDate: '2022',
};

export const gaccCollectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: 'Grandpa Ape Country Club NFT Collection',
  description:
    '5,000 unique Grandpa Ape NFTs living on the Ethereum blockchain. Your token doubles as your membership to the country club.',
  url: 'https://grandpaapecountryclub.com',
  image: GACC_IMAGE,
  creator: { '@type': 'Organization', name: 'Grandpa Ape Country Club' },
  isPartOf: {
    '@type': 'CreativeWorkSeries',
    name: 'GACC Ecosystem',
  },
};

export const grandpaCoinJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'GrandpaCoin ($GRANDPA)',
  description:
    'GrandpaCoin is the official ERC-20 token of the Grandpa Ape Country Club ecosystem on Ethereum. View tokenomics, live chart, and buy $GRANDPA.',
  url: 'https://grandpaapecountryclub.com/grandpacoin',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Grandpa Ape Country Club',
    url: 'https://grandpaapecountryclub.com',
  },
  about: {
    '@type': 'Thing',
    name: 'GrandpaCoin',
    alternateName: '$GRANDPA',
    description: 'ERC-20 governance and utility token for the GACC ecosystem on Ethereum.',
  },
};

export const maccCollectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: 'Mutant Ape Country Club (MACC)',
  description:
    'MACC is the mutant derivative collection of Grandpa Ape Country Club, featuring mutated versions of the original GACC apes on Ethereum.',
  url: 'https://grandpaapecountryclub.com/macc',
  creator: { '@type': 'Organization', name: 'Grandpa Ape Country Club' },
};

export const kittenClubJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: 'Grandpa Ape Kitten Club (GAKC)',
  description:
    'GAKC is the companion kitten collection to GACC. Kittens can be bred and earn Lunagem tokens within the GACC ecosystem.',
  url: 'https://grandpaapecountryclub.com/kitten-club',
  creator: { '@type': 'Organization', name: 'Grandpa Ape Country Club' },
};

import React, { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import '../styles/style.css'

// Contract addresses
const GRANDPA_COIN_ADDRESS = "0xaDde68057C6Eb34C066f8F0ED3310c6ca8C7Ca0b";
const STRATEGY_VAULT_ADDRESS = "0xDE82675759071131a21Ef97086B90410Bc68c96d";
const COUNTRY_CLUB_ADDRESS = "0xf4C84ed6302b9214C63890cdA6d9f3a08cBCb410";
const GACC_COLLECTION_ADDRESS = "0x4B103d07C18798365946E76845EDC6b565779402";

// ERC20 ABI (minimal for balance, totalSupply)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

// CountryClub ABI (minimal)
const COUNTRY_CLUB_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "totalMembers",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "members",
    "outputs": [
      {"name": "collection", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "joinedAt", "type": "uint256"},
      {"name": "source", "type": "uint8"}
    ],
    "type": "function"
  }
];

function GrandpaCoin() {
  const [totalSupply, setTotalSupply] = useState(null);
  const [totalBurned, setTotalBurned] = useState(null);
  const [vaultBalance, setVaultBalance] = useState(null);
  const [countryClubMembers, setCountryClubMembers] = useState(null);
  const [nftList, setNftList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Swap state
  const ethAmount = "0.05";

  const loadContractData = useCallback(async () => {
    try {
      const web3 = new Web3(
        new Web3.providers.HttpProvider(process.env.REACT_APP_ALCHEMY_URL || process.env.REACT_APP_INFURA_URL)
      );

      // GrandpaCoin contract
      const grandpaContract = new web3.eth.Contract(ERC20_ABI, GRANDPA_COIN_ADDRESS);
      
      // Get total supply
      const supply = await grandpaContract.methods.totalSupply().call();
      const supplyFormatted = web3.utils.fromWei(supply, 'ether');
      setTotalSupply(supplyFormatted);

      // Get vault balance
      const vaultBal = await grandpaContract.methods.balanceOf(STRATEGY_VAULT_ADDRESS).call();
      const vaultBalFormatted = web3.utils.fromWei(vaultBal, 'ether');
      setVaultBalance(vaultBalFormatted);

      // Calculate burned (initial supply was 100,000,000 - current supply)
      const initialSupply = 100000000;
      const burned = initialSupply - parseFloat(supplyFormatted);
      setTotalBurned(burned.toFixed(2));

      // CountryClub contract
      const countryClubContract = new web3.eth.Contract(COUNTRY_CLUB_ABI, COUNTRY_CLUB_ADDRESS);
      const memberCount = await countryClubContract.methods.totalMembers().call();
      setCountryClubMembers(memberCount);

      // Fetch NFT details for each member
      if (memberCount > 0) {
        const nfts = [];
        const maxToShow = 50; // Limit to first 50 for performance
        const count = Math.min(parseInt(memberCount), maxToShow);
        
        for (let i = 0; i < count; i++) {
          try {
            const member = await countryClubContract.methods.members(i).call();
            nfts.push({
              collection: member.collection,
              tokenId: member.tokenId,
              joinedAt: new Date(parseInt(member.joinedAt) * 1000).toLocaleDateString(),
              source: member.source === '0' ? 'Strategy' : 'Holder'
            });
          } catch (err) {
            console.error(`Error fetching member ${i}:`, err);
          }
        }
        setNftList(nfts);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading contract data:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContractData();
  }, [loadContractData]);


  const formatNumber = (num, decimals = 2) => {
    if (!num) return "0";
    return parseFloat(num).toLocaleString(undefined, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    });
  };

  return (
    <div>
      <div id="root">
        <div className="app" style={{backgroundColor: '#f9edcd'}}>
          <nav id="nav" className="navbar navbar-expand-md navbar-light" style={{backgroundColor: '#f9edcd'}}>
            <a href="/home" id="bayc-brand" className="navbar-brand">
              <img src={process.env.PUBLIC_URL + '/assets/images/GACC-Banner-Black-V6.png'} className="d-inline-block align-top" alt="gacc logo" width="auto" height="70px" />
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <div className="navbar-nav" id="nav-bar">
                <a id="nav-link" style={{color: 'black'}} title="About" href="/grandpacoin#about" className="nav-link">About</a>
                <a id="nav-link" style={{color: 'black'}} title="Tokenomics" href="/grandpacoin#tokenomics" className="nav-link">Tokenomics</a>
                <a id="nav-link" style={{color: 'black'}} title="Chart" href="/grandpacoin#chart" className="nav-link">Chart</a>
                <a id="nav-link" style={{color: 'black'}} title="Buy" href="/grandpacoin#buy-grandpacoin" className="nav-link">Buy</a>
                <a id="nav-link" style={{color: 'black'}} title="Country Club" href="/grandpacoin#country-club" className="nav-link">Country Club</a>
              </div>
              <div className="navbar-nav" id="nav-social">
                <a href="https://discord.gg/8uuhkZ2TA2"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a>
                <a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a>
                <a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a>
              </div>
            </div>
          </nav>
          
          {/* Header Banner Section */}
          <div className="common-container">
            <div className="mb-4 mb-lg-5 container">
              <div className="row">
                <div className="px-0 col-12" style={{
                  padding: '60px 20px',
                  textAlign: 'center'
                }}>
                  <img 
                    src={process.env.PUBLIC_URL + '/assets/images/grandpacoinlogo.jpg'} 
                    alt="Grandpa Coin Logo" 
                    className="img-fluid"
                    style={{
                      maxWidth: '400px',
                      width: '100%',
                      height: 'auto',
                      marginBottom: '30px',
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                  />
                  <h1 className="common-title" style={{
                    color: 'black',
                    fontSize: '3.5rem',
                    marginBottom: '10px',
                    textAlign: 'center'
                  }}>
                    GRANDPA COIN
                  </h1>
                  <p className="common-p" style={{
                    color: 'black',
                    fontSize: '1.5rem',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    The Grandpa Strategy
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
              <div className="common-container">
                <div className="px-4 mt-md-4 container">
                  
                  {/* Introduction Section */}
                  <div id="about" className="mb-5 row">
                    <div className="col">
                      <div className="common-container">
                        <div className="row">
                          <div className="mb-4 col-lg-12 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>GRANDPA COIN</h2>
                            <p className="common-p" style={{color: 'black'}}>
                              Grandpa Coin ($GRANDPA) is a revolutionary token that powers the Grandpa Ape ecosystem through an innovative buy-and-burn strategy. With each purchase, 4% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs.
                            </p>
                            <p className="common-p" style={{color: 'black'}}>
                              The bot uses these accumulated funds to purchase floor Grandpa NFTs and automatically sends them to the Country Club contract, where they are enshrined eternally and cannot be removed. This creates perpetual buy pressure on the Grandpa Ape collection while rewarding holders through the deflationary nature of the token.
                            </p>
                            <p className="common-p mb-0" style={{color: 'black'}}>
                              Join the strategy. Hold Grandpa Coin. Support the Country Club.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="gray-line mb-5" />

                  {/* Token Information Section */}
                  <div id="tokenomics" className="mb-5 row">
                    <div className="col">
                      <div className="common-container">
                        <div className="row">
                          <div className="mb-4 col-lg-12 col-12">
                            <h2 className="common-title mb-4" style={{color: 'black'}}>TOKEN INFORMATION</h2>
                            
                            {loading ? (
                              <p className="common-p" style={{color: 'black'}}>Loading token data...</p>
                            ) : (
                              <div className="row">
                                <div className="col-lg-4 col-md-6 col-12 mb-4">
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '30px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    height: '100%'
                                  }}>
                                    <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold'}}>Total Supply</h3>
                                    <p style={{color: 'black', fontSize: '1.8rem', fontWeight: 'bold', margin: 0, lineHeight: '1.2'}}>
                                      {formatNumber(totalSupply, 0)} $GRANDPA
                                    </p>
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-12 mb-4">
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '30px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    height: '100%'
                                  }}>
                                    <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold'}}>Total Burned</h3>
                                    <p style={{color: 'black', fontSize: '1.8rem', fontWeight: 'bold', margin: 0, lineHeight: '1.2'}}>
                                      {formatNumber(totalBurned, 0)} $GRANDPA
                                    </p>
                                  </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-12 mb-4">
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '30px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    height: '100%'
                                  }}>
                                    <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold'}}>In Strategy Vault</h3>
                                    <p style={{color: 'black', fontSize: '1.8rem', fontWeight: 'bold', margin: 0, lineHeight: '1.2'}}>
                                      {formatNumber(vaultBalance)} $GRANDPA
                                    </p>
                                    <p style={{color: '#666', fontSize: '0.9rem', marginTop: '10px', margin: 0}}>
                                      <a href={`https://etherscan.io/address/${STRATEGY_VAULT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{color: '#977039'}}>
                                        View on Etherscan
                                      </a>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="row mt-4">
                              <div className="col-lg-6 col-md-6 col-12 mb-4">
                                <div style={{
                                  backgroundColor: 'white',
                                  padding: '30px',
                                  borderRadius: '10px',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                  height: '100%'
                                }}>
                                  <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold'}}>Buy Tax</h3>
                                  <p style={{color: 'black', fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0'}}>
                                    4%
                                  </p>
                                  <p style={{color: '#666', fontSize: '1rem', margin: '10px 0 0 0'}}>
                                    All to buy NFTs
                                  </p>
                                </div>
                              </div>
                              <div className="col-lg-6 col-md-6 col-12 mb-4">
                                <div style={{
                                  backgroundColor: 'white',
                                  padding: '30px',
                                  borderRadius: '10px',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                  height: '100%'
                                }}>
                                  <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold'}}>Sell Tax</h3>
                                  <p style={{color: 'black', fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0'}}>
                                    4%
                                  </p>
                                  <p style={{color: '#666', fontSize: '1rem', margin: '10px 0 0 0'}}>
                                    All burned
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{
                              padding: '30px 20px',
                              marginTop: '30px',
                              textAlign: 'center'
                            }}>
                              <h3 style={{color: '#977039', fontSize: '1.5rem', marginBottom: '25px', fontWeight: 'bold'}}>Contract Addresses</h3>
                              <div style={{display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto'}}>
                                <div>
                                  <p style={{margin: '0 0 8px 0', color: '#666', fontSize: '1rem', fontWeight: 'bold'}}>Grandpa Coin</p>
                                  <a 
                                    href={`https://etherscan.io/address/${GRANDPA_COIN_ADDRESS}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{color: '#977039', wordBreak: 'break-all', fontSize: '0.95rem', textDecoration: 'underline'}}
                                  >
                                    {GRANDPA_COIN_ADDRESS}
                                  </a>
                                </div>
                                <div>
                                  <p style={{margin: '0 0 8px 0', color: '#666', fontSize: '1rem', fontWeight: 'bold'}}>Strategy Vault</p>
                                  <a 
                                    href={`https://etherscan.io/address/${STRATEGY_VAULT_ADDRESS}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{color: '#977039', wordBreak: 'break-all', fontSize: '0.95rem', textDecoration: 'underline'}}
                                  >
                                    {STRATEGY_VAULT_ADDRESS}
                                  </a>
                                </div>
                                <div>
                                  <p style={{margin: '0 0 8px 0', color: '#666', fontSize: '1rem', fontWeight: 'bold'}}>Country Club</p>
                                  <a 
                                    href={`https://etherscan.io/address/${COUNTRY_CLUB_ADDRESS}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{color: '#977039', wordBreak: 'break-all', fontSize: '0.95rem', textDecoration: 'underline'}}
                                  >
                                    {COUNTRY_CLUB_ADDRESS}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="gray-line mb-5" />

                  {/* DexScreener Section */}
                  <div id="chart" className="mb-5 row">
                    <div className="col">
                      <div className="common-container">
                        <div className="row">
                          <div className="mb-4 col-lg-12 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>GRANDPA COIN CHART</h2>
                            <style>{`
                              #dexscreener-embed {
                                position: relative;
                                width: 100%;
                                padding-bottom: 125%;
                              }
                              @media (min-width: 1400px) {
                                #dexscreener-embed {
                                  padding-bottom: 65%;
                                }
                              }
                              #dexscreener-embed iframe {
                                position: absolute;
                                width: 100%;
                                height: 100%;
                                top: 0;
                                left: 0;
                                border: 0;
                              }
                            `}</style>
                            <div id="dexscreener-embed">
                              <iframe
                                src="https://dexscreener.com/ethereum/0x8b140FE4214080057e176e7fC255d4F1d8157126?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
                                title="DexScreener Chart"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="gray-line mb-5" />

                  {/* Buy GrandpaCoin Section */}
                  <div id="buy-grandpacoin" className="mb-5 row">
                    <div className="col">
                      <div className="buy-token-container">
                        <div className="bayc-bg p-4 m-auto row" style={{backgroundColor: 'white'}}>
                          <div className="m-auto col-lg-3 col-12">
                            <h3 className="buy-ape-title">BUY GRANDPACOIN</h3>
                          </div>
                          <div className="m-auto col-lg-4 col-12 offset-lg-1">
                            <p className="common-p mb-lg-0">Swap ETH for $GRANDPA on Uniswap. Connect your wallet and complete the swap on Uniswap's secure interface.</p>
                          </div>
                          <div className="m-auto col-lg-2 col-12 offset-lg-1">
                            <a 
                              href={`https://app.uniswap.org/#/swap?exactField=input&exactAmount=${ethAmount}&inputCurrency=ETH&outputCurrency=${GRANDPA_COIN_ADDRESS}&slippage=5`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <button className="bayc-button mint" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>SWAP ON UNISWAP</button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="gray-line mb-5" />

                  {/* Country Club Section */}
                  <div id="country-club" className="mb-5 row">
                    <div className="col">
                      <div className="common-container">
                        <div className="row">
                          <div className="mb-4 col-lg-12 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>THE COUNTRY CLUB</h2>
                            <p className="common-p mb-4" style={{color: 'black'}}>
                              NFTs purchased by the Strategy Vault bot are automatically sent to the Country Club contract, where they are enshrined eternally and cannot be removed. These NFTs represent the permanent treasury of the Grandpa Ape ecosystem.
                            </p>
                            {loading ? (
                              <p className="common-p" style={{color: 'black'}}>Loading Country Club data...</p>
                            ) : (
                              <div>
                                <div style={{
                                  backgroundColor: 'white',
                                  padding: '20px',
                                  borderRadius: '10px',
                                  marginBottom: '20px',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                }}>
                                  <h3 style={{color: '#977039', fontSize: '1.5rem', marginBottom: '10px'}}>
                                    Country Club Members: {countryClubMembers || 'None Yet!'}
                                  </h3>
                                  <p style={{color: '#666', fontSize: '0.9rem', margin: 0}}>
                                    <a href={`https://etherscan.io/address/${COUNTRY_CLUB_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{color: '#977039'}}>
                                      View Contract on Etherscan
                                    </a>
                                  </p>
                                </div>
                                
                                {nftList.length > 0 && (
                                  <div>
                                    <h3 style={{color: 'black', fontSize: '1.2rem', marginBottom: '15px'}}>Recent Additions</h3>
                                    <div className="row">
                                      {nftList.slice(0, 12).map((nft, index) => (
                                        <div key={index} className="col-lg-3 col-md-4 col-6 mb-3">
                                          <div style={{
                                            backgroundColor: 'white',
                                            padding: '15px',
                                            borderRadius: '10px',
                                            textAlign: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                          }}>
                                            <p style={{color: '#977039', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold'}}>
                                              {nft.collection === GACC_COLLECTION_ADDRESS ? 'GACC' : 'NFT'} #{nft.tokenId}
                                            </p>
                                            <p style={{color: '#666', fontSize: '0.8rem', margin: '5px 0'}}>
                                              Source: {nft.source}
                                            </p>
                                            <p style={{color: '#666', fontSize: '0.8rem', margin: 0}}>
                                              Joined: {nft.joinedAt}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {nftList.length > 12 && (
                                      <p style={{color: '#666', fontSize: '0.9rem', marginTop: '15px', textAlign: 'center'}}>
                                        Showing first 12 of {nftList.length} members
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <footer className="footer">
            <div className="container-fluid footer-line">
              <hr className="p-0 line" />
              <div className="row mx-0 footer-padding">
                <div className="col-12 col-lg-4 order-lg-first my-lg-auto">
                  <img className="col-12 col-lg-8 order-first" src={process.env.PUBLIC_URL + '/assets/images/GACC-Banner-Black-V6.png'} alt=""></img>
                </div>
                <div className="col-12 col-lg-4 order-first">
                  <img className="img-fluid footer-logo" src="https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0" alt="logo" />
                </div>
                <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
                  <div className="row">
                    <div className="text-lg-right col-sm-12 col-12">
                      <a href="https://discord.gg/8uuhkZ2TA2"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a>
                      <a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a>
                      <a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-6">
                      <p className="copyright text-right"><span className="copy-left" style={{color: 'black'}}>© 2023 Grandpa Ape Country Club</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="container-fluid m-0 p-0" style={{borderBottom: 'white'}}>
              <span className="last-line" style={{borderBottom: 'white'}} />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default GrandpaCoin;

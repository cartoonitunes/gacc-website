import React, { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import { Network, Alchemy } from "alchemy-sdk";
import '../styles/style.css'

// Contract addresses
const GRANDPA_COIN_ADDRESS = "0x20BFd82E6AD6A39cf4bD1F803e662FC065cD3d5F";
const STRATEGY_VAULT_ADDRESS = "0xDE82675759071131a21Ef97086B90410Bc68c96d";
const COUNTRY_CLUB_ADDRESS = "0xf4C84ed6302b9214C63890cdA6d9f3a08cBCb410";
const GACC_COLLECTION_ADDRESS = "0x4B103d07C18798365946E76845EDC6b565779402";
const ADDITIONAL_WALLET_ADDRESS = "0x4965599764a4C48C4f209Ca1eE36d8AA4530a551";

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

// CountryClub ABI
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
  },
  {
    "constant": true,
    "inputs": [{"name": "collection", "type": "address"}],
    "name": "isCollectionApproved",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

// ERC721 ABI (for safeTransferFrom)
const ERC721_ABI = [
  {
    "constant": false,
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "type": "function"
  }
];

// NFT Image component with error handling
function NftImage({ imageUrl, nftName, loadingMetadata }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        borderRadius: '8px',
        marginBottom: '10px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '0.9rem'
      }}>
        {loadingMetadata ? 'Loading...' : 'No image'}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
      {!imageLoaded && (
        <div style={{
          width: '100%',
          height: '200px',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '0.9rem',
          position: 'absolute',
          top: 0,
          left: 0
        }}>
          Loading...
        </div>
      )}
      <img 
        src={imageUrl} 
        alt={nftName}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          objectFit: 'cover',
          minHeight: '200px',
          maxHeight: '300px',
          backgroundColor: '#f5f5f5',
          display: imageLoaded ? 'block' : 'none'
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
      />
    </div>
  );
}

function GrandpaCoin() {
  const [totalSupply, setTotalSupply] = useState(null);
  const [totalBurned, setTotalBurned] = useState(null);
  const [vaultBalance, setVaultBalance] = useState(null);
  const [additionalWalletBalance, setAdditionalWalletBalance] = useState(null);
  const [countryClubMembers, setCountryClubMembers] = useState(null);
  const [nftList, setNftList] = useState([]);
  const [nftMetadata, setNftMetadata] = useState({}); // Map of "contractAddress-tokenId" to metadata
  const [nftSenders, setNftSenders] = useState({}); // Map of "contractAddress-tokenId" to sender info
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loadingSenders, setLoadingSenders] = useState(false);
  
  // Wallet connection state
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [approvedCollections, setApprovedCollections] = useState([]);
  const [userNfts, setUserNfts] = useState({}); // Map of collection address to array of NFTs
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [selectedNft, setSelectedNft] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState("");
  
  // Swap state
  const ethAmount = "0.05";

  const fetchNftMetadata = useCallback(async (nfts) => {
    setLoadingMetadata(true);
    try {
      // Prepare batch request
      const nftBatch = nfts.map(nft => ({
        contractAddress: nft.collection,
        tokenId: nft.tokenId
      }));
      
      const response = await fetch('/api/nft-metadata-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nfts: nftBatch })
      });
      
      if (response.ok) {
        const data = await response.json();
        const metadataMap = {};
        data.results.forEach(result => {
          const key = `${result.contractAddress}-${result.tokenId}`;
          if (result.metadata) {
            metadataMap[key] = result.metadata;
            // Debug: log image URL if available
            if (result.metadata.image) {
              console.log(`NFT ${key} image:`, result.metadata.image);
            }
          }
        });
        setNftMetadata(metadataMap);
      } else {
        console.error('Error fetching NFT metadata:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
    } finally {
      setLoadingMetadata(false);
    }
  }, []);

  const fetchNftSenders = useCallback(async (nfts) => {
    setLoadingSenders(true);
    try {
      // Prepare request with collection, tokenId, and joinedAt (timestamp)
      const nftBatch = nfts.map(nft => ({
        collection: nft.collection,
        tokenId: nft.tokenId,
        joinedAt: nft.joinedAt // Already a Unix timestamp from the contract
      }));
      
      const response = await fetch('/api/nft-senders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nfts: nftBatch,
          countryClubAddress: COUNTRY_CLUB_ADDRESS
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNftSenders(data.results || {});
      } else {
        console.error('Error fetching NFT senders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching NFT senders:', error);
    } finally {
      setLoadingSenders(false);
    }
  }, []);

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

      // Get additional wallet balance
      const additionalWalletBal = await grandpaContract.methods.balanceOf(ADDITIONAL_WALLET_ADDRESS).call();
      const additionalWalletBalFormatted = web3.utils.fromWei(additionalWalletBal, 'ether');
      setAdditionalWalletBalance(additionalWalletBalFormatted);

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
            const joinedAtTimestamp = parseInt(member.joinedAt);
            nfts.push({
              collection: member.collection,
              tokenId: member.tokenId,
              joinedAt: joinedAtTimestamp, // Unix timestamp (seconds) for API call
              joinedAtFormatted: new Date(joinedAtTimestamp * 1000).toLocaleDateString(), // For display
              source: member.source === '0' ? 'Strategy' : 'Holder'
            });
          } catch (err) {
            console.error(`Error fetching member ${i}:`, err);
          }
        }
        setNftList(nfts);
        
        // Fetch metadata and senders for NFTs
        if (nfts.length > 0) {
          fetchNftMetadata(nfts);
          fetchNftSenders(nfts);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading contract data:", error);
      setLoading(false);
    }
  }, [fetchNftMetadata]);

  // Load approved collections from Country Club contract
  const loadApprovedCollections = useCallback(async (web3Instance) => {
    try {
      const countryClubContract = new web3Instance.eth.Contract(COUNTRY_CLUB_ABI, COUNTRY_CLUB_ADDRESS);
      
      // Known collections to check (you can expand this list)
      // For now, we'll check GACC collection and allow manual entry
      const knownCollections = [
        { address: GACC_COLLECTION_ADDRESS, name: "Grandpa Ape Country Club" }
      ];

      const approved = [];
      for (const collection of knownCollections) {
        try {
          const isApproved = await countryClubContract.methods.isCollectionApproved(collection.address).call();
          if (isApproved) {
            approved.push(collection);
          }
        } catch (err) {
          console.error(`Error checking collection ${collection.address}:`, err);
        }
      }

      // If no known collections are approved, at least show GACC as an option
      // Users can manually enter other approved collections
      if (approved.length === 0 && knownCollections.length > 0) {
        approved.push(knownCollections[0]);
      }

      setApprovedCollections(approved);
    } catch (error) {
      console.error("Error loading approved collections:", error);
    }
  }, []);

  // Wallet connection
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or another Web3 wallet");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        alert("No accounts found");
        return;
      }

      const userAccount = accounts[0];
      setAccount(userAccount);

      const userWeb3 = new Web3(window.ethereum);
      setWeb3(userWeb3);

      // Load approved collections after wallet is connected
      await loadApprovedCollections(userWeb3);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (newAccounts) => {
        if (newAccounts.length === 0) {
          setAccount(null);
          setWeb3(null);
          setApprovedCollections([]);
          setUserNfts({});
        } else {
          setAccount(newAccounts[0]);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet: " + error.message);
    }
  }, [loadApprovedCollections]);

  // Load user's NFTs from a specific collection
  const loadUserNfts = useCallback(async (collectionAddress) => {
    if (!account || !collectionAddress) return;

    try {
      const settings = {
        apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
      };
      const alchemy = new Alchemy(settings);

      // Fetch NFTs owned by the user from this collection
      const response = await alchemy.nft.getNftsForOwner(account, {
        contractAddresses: [collectionAddress],
        pageSize: 100
      });

      const nfts = response.ownedNfts.map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name || `#${nft.tokenId}`,
        image: nft.image?.originalUrl || nft.image?.pngUrl || nft.image?.cachedUrl || null,
        collection: collectionAddress
      }));

      setUserNfts(prev => ({
        ...prev,
        [collectionAddress]: nfts
      }));
    } catch (error) {
      console.error("Error loading user NFTs:", error);
      alert("Failed to load NFTs: " + error.message);
    }
  }, [account]);

  // Transfer NFT to Country Club
  const transferToCountryClub = useCallback(async () => {
    if (!web3 || !account || !selectedNft || !selectedCollection) {
      alert("Please select an NFT to deposit");
      return;
    }

    setTransferring(true);
    setTransferStatus("");

    try {
      // Create ERC721 contract instance
      const nftContract = new web3.eth.Contract(ERC721_ABI, selectedCollection);

      // Call safeTransferFrom
      const tx = await nftContract.methods.safeTransferFrom(
        account,
        COUNTRY_CLUB_ADDRESS,
        selectedTokenId
      ).send({
        from: account,
        gas: 200000 // Adjust gas limit as needed
      });

      setTransferStatus(`Success! Transaction: ${tx.transactionHash}`);
      
      // Reset selection
      setSelectedCollection("");
      setSelectedTokenId("");
      setSelectedNft(null);
      
      // Reload Country Club data after a delay
      setTimeout(() => {
        loadContractData();
      }, 3000);

    } catch (error) {
      console.error("Error transferring NFT:", error);
      setTransferStatus(`Error: ${error.message}`);
    } finally {
      setTransferring(false);
    }
  }, [web3, account, selectedNft, selectedCollection, selectedTokenId, loadContractData]);

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
                              Grandpa Coin ($GRANDPA) is a revolutionary token that powers the Grandpa Ape ecosystem through an innovative buy-and-burn strategy. With each purchase, 6% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs.
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
                                <div className="col-lg-3 col-md-6 col-12 mb-4">
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
                                <div className="col-lg-3 col-md-6 col-12 mb-4">
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
                                <div className="col-lg-3 col-md-6 col-12 mb-4">
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
                                <div className="col-lg-3 col-md-6 col-12 mb-4">
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '30px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    height: '100%'
                                  }}>
                                    <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold'}}>Additional Wallet</h3>
                                    <p style={{color: 'black', fontSize: '1.8rem', fontWeight: 'bold', margin: 0, lineHeight: '1.2'}}>
                                      {formatNumber(additionalWalletBalance)} $GRANDPA
                                    </p>
                                    <p style={{color: '#666', fontSize: '0.9rem', marginTop: '10px', margin: 0}}>
                                      <a href={`https://etherscan.io/address/${ADDITIONAL_WALLET_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{color: '#977039'}}>
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
                                    6%
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
                                    0%
                                  </p>
                                  <p style={{color: '#666', fontSize: '1rem', margin: '10px 0 0 0'}}>
                                    No sell tax
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
                                src="https://dexscreener.com/ethereum/0xc2f9673849ea38fae55c29e18e797f36b18a3078?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
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

                  {/* Deposit NFT Section */}
                  <div id="deposit-nft" className="mb-5 row">
                    <div className="col">
                      <div className="common-container">
                        <div className="row">
                          <div className="mb-4 col-lg-12 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>DEPOSIT NFT TO COUNTRY CLUB</h2>
                            <p className="common-p mb-4" style={{color: 'black'}}>
                              Connect your wallet and deposit an approved NFT to the Country Club. Once deposited, your NFT will be enshrined eternally and cannot be removed.
                            </p>
                            
                            {!account ? (
                              <div style={{
                                backgroundColor: 'white',
                                padding: '40px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                              }}>
                                <button
                                  className="bayc-button mint"
                                  type="button"
                                  onClick={connectWallet}
                                  style={{
                                    backgroundColor: '#977039',
                                    color: 'white',
                                    border: 'none',
                                    padding: '15px 30px',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  CONNECT WALLET
                                </button>
                                <p style={{color: '#666', fontSize: '0.9rem', marginTop: '15px'}}>
                                  Connect your wallet to deposit NFTs to the Country Club
                                </p>
                              </div>
                            ) : (
                              <div style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                borderRadius: '10px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                              }}>
                                <div style={{marginBottom: '20px'}}>
                                  <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '5px'}}>Connected Wallet:</p>
                                  <p style={{color: 'black', fontSize: '1rem', fontWeight: 'bold'}}>
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                  </p>
                                </div>

                                {/* Collection Selector */}
                                <div style={{marginBottom: '20px'}}>
                                  <label style={{color: '#977039', fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>
                                    Select Collection:
                                  </label>
                                    <select
                                      value={selectedCollection}
                                      onChange={async (e) => {
                                        setSelectedCollection(e.target.value);
                                        setSelectedTokenId("");
                                        setSelectedNft(null);
                                        if (e.target.value) {
                                          await loadUserNfts(e.target.value);
                                        }
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '2px solid #977039',
                                        fontSize: '1rem',
                                        backgroundColor: 'white',
                                        color: 'black'
                                      }}
                                    >
                                      <option value="" style={{color: 'black'}}>-- Select a collection --</option>
                                      {approvedCollections.map((collection, index) => (
                                        <option key={index} value={collection.address} style={{color: 'black'}}>
                                          {collection.name || `${collection.address.slice(0, 6)}...${collection.address.slice(-4)}`}
                                        </option>
                                      ))}
                                    </select>
                                    {selectedCollection && !userNfts[selectedCollection] && (
                                      <p style={{color: '#666', fontSize: '0.9rem', marginTop: '10px', fontStyle: 'italic'}}>
                                        Loading your NFTs...
                                      </p>
                                    )}
                                    {selectedCollection && userNfts[selectedCollection] && userNfts[selectedCollection].length === 0 && (
                                      <p style={{color: '#d32f2f', fontSize: '0.9rem', marginTop: '10px'}}>
                                        You don't own any NFTs from this collection.
                                      </p>
                                    )}
                                </div>

                                {/* Token Selector */}
                                {selectedCollection && userNfts[selectedCollection] && (
                                  <div style={{marginBottom: '20px'}}>
                                    <label style={{color: '#977039', fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>
                                      Select NFT:
                                    </label>
                                    <select
                                      value={selectedTokenId}
                                      onChange={(e) => {
                                        setSelectedTokenId(e.target.value);
                                        if (e.target.value) {
                                          const nft = userNfts[selectedCollection].find(n => n.tokenId === e.target.value);
                                          setSelectedNft(nft);
                                        } else {
                                          setSelectedNft(null);
                                        }
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '2px solid #977039',
                                        fontSize: '1rem',
                                        backgroundColor: 'white',
                                        color: 'black'
                                      }}
                                    >
                                      <option value="" style={{color: 'black'}}>-- Select an NFT --</option>
                                      {userNfts[selectedCollection].map((nft, index) => (
                                        <option key={index} value={nft.tokenId} style={{color: 'black'}}>
                                          {nft.name || `#${nft.tokenId}`}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {/* NFT Preview */}
                                {selectedNft && (
                                  <div style={{
                                    marginBottom: '20px',
                                    padding: '20px',
                                    backgroundColor: '#f9edcd',
                                    borderRadius: '10px',
                                    textAlign: 'center'
                                  }}>
                                    <h3 style={{color: '#977039', fontSize: '1.2rem', marginBottom: '15px'}}>Preview</h3>
                                    {selectedNft.image && (
                                      <img
                                        src={selectedNft.image}
                                        alt={selectedNft.name || `NFT #${selectedNft.tokenId}`}
                                        style={{
                                          maxWidth: '300px',
                                          width: '100%',
                                          height: 'auto',
                                          borderRadius: '8px',
                                          marginBottom: '15px',
                                          border: '2px solid #977039'
                                        }}
                                      />
                                    )}
                                    <p style={{color: 'black', fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px'}}>
                                      {selectedNft.name || `NFT #${selectedNft.tokenId}`}
                                    </p>
                                    <p style={{color: '#666', fontSize: '0.9rem'}}>
                                      Collection: {selectedCollection.slice(0, 6)}...{selectedCollection.slice(-4)}
                                    </p>
                                  </div>
                                )}

                                {/* Transfer Button */}
                                {selectedNft && (
                                  <div style={{textAlign: 'center'}}>
                                    <button
                                      className="bayc-button mint"
                                      type="button"
                                      onClick={transferToCountryClub}
                                      disabled={transferring}
                                      style={{
                                        backgroundColor: transferring ? '#ccc' : '#977039',
                                        color: 'white',
                                        border: 'none',
                                        padding: '15px 40px',
                                        fontSize: '1.1rem',
                                        cursor: transferring ? 'not-allowed' : 'pointer',
                                        opacity: transferring ? 0.6 : 1
                                      }}
                                    >
                                      {transferring ? 'TRANSFERRING...' : 'DEPOSIT TO COUNTRY CLUB'}
                                    </button>
                                    {transferStatus && (
                                      <p style={{
                                        color: transferStatus.includes('Error') ? '#d32f2f' : '#2e7d32',
                                        fontSize: '0.9rem',
                                        marginTop: '15px'
                                      }}>
                                        {transferStatus}
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
                                    {loadingMetadata && (
                                      <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center'}}>
                                        Loading NFT images...
                                      </p>
                                    )}
                                    <div className="row">
                                      {nftList.slice(0, 12).map((nft, index) => {
                                        const metadataKey = `${nft.collection}-${nft.tokenId}`;
                                        const metadata = nftMetadata[metadataKey];
                                        const senderInfo = nftSenders[metadataKey];
                                        
                                        // Process image URL - handle IPFS and other formats
                                        let imageUrl = null;
                                        if (metadata?.image) {
                                          imageUrl = metadata.image;
                                          // Convert IPFS URLs to HTTP gateway
                                          if (imageUrl.startsWith('ipfs://')) {
                                            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                                          }
                                          // Handle relative URLs
                                          if (imageUrl.startsWith('//')) {
                                            imageUrl = 'https:' + imageUrl;
                                          }
                                        }
                                        
                                        const nftName = metadata?.name || `${nft.collection === GACC_COLLECTION_ADDRESS ? 'GACC' : 'NFT'} #${nft.tokenId}`;
                                        
                                        return (
                                          <div key={index} className="col-lg-3 col-md-4 col-6 mb-4">
                                            <div style={{
                                              backgroundColor: 'white',
                                              padding: '15px',
                                              borderRadius: '10px',
                                              textAlign: 'center',
                                              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                              height: '100%',
                                              display: 'flex',
                                              flexDirection: 'column'
                                            }}>
                                              <NftImage 
                                                imageUrl={imageUrl}
                                                nftName={nftName}
                                                loadingMetadata={loadingMetadata}
                                              />
                                              <h4 style={{
                                                color: '#977039', 
                                                fontSize: '1rem', 
                                                marginBottom: '8px', 
                                                fontWeight: 'bold',
                                                minHeight: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                              }}>
                                                {nftName}
                                              </h4>
                                              <div style={{marginTop: 'auto', paddingTop: '10px'}}>
                                                <p style={{color: '#666', fontSize: '0.8rem', margin: '5px 0'}}>
                                                  Source: {nft.source}
                                                </p>
                                                {senderInfo && (
                                                  <p style={{color: '#666', fontSize: '0.8rem', margin: '5px 0'}}>
                                                    From: <a 
                                                      href={`https://etherscan.io/address/${senderInfo.sender}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      style={{color: '#977039', textDecoration: 'underline'}}
                                                      title={senderInfo.sender}
                                                    >
                                                      {senderInfo.senderLabel || senderInfo.senderEntity || `${senderInfo.sender.slice(0, 6)}...${senderInfo.sender.slice(-4)}`}
                                                    </a>
                                                  </p>
                                                )}
                                                {loadingSenders && !senderInfo && (
                                                  <p style={{color: '#999', fontSize: '0.7rem', margin: '5px 0', fontStyle: 'italic'}}>
                                                    Loading sender...
                                                  </p>
                                                )}
                                                <p style={{color: '#666', fontSize: '0.8rem', margin: 0}}>
                                                  Joined: {nft.joinedAtFormatted || new Date(nft.joinedAt * 1000).toLocaleDateString()}
                                                </p>
                                                <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                                  <a 
                                                    href={`https://opensea.io/assets/ethereum/${nft.collection}/${nft.tokenId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                      color: '#977039',
                                                      fontSize: '0.8rem',
                                                      textDecoration: 'underline'
                                                    }}
                                                  >
                                                    View on OpenSea
                                                  </a>
                                                  {senderInfo?.transactionHash && (
                                                    <a 
                                                      href={`https://etherscan.io/tx/${senderInfo.transactionHash}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      style={{
                                                        color: '#977039',
                                                        fontSize: '0.8rem',
                                                        textDecoration: 'underline'
                                                      }}
                                                    >
                                                      View Transaction
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
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

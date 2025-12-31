import React, { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import '../styles/style.css'


// Subdomain Claimer Contract ABI
const SUBDOMAIN_CLAIMER_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "currentLabelOf",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "label", "type": "string"}],
    "name": "claim",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "release",
    "outputs": [],
    "type": "function"
  }
];

// Contract address
const SUBDOMAIN_CLAIMER_ADDRESS = "0x4E82641c6d4f24b066abF6E14DBB498476fcF656";

function Home () {

  const [apeSelection, setApeSelection] = useState(null);
  const [rankToShow, setRankToShow] = useState(null);
  
  // Subdomain state
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [ensName, setEnsName] = useState(null);
  const [subdomainInput, setSubdomainInput] = useState("");
  const [currentSubdomain, setCurrentSubdomain] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState("");
  const [loadingSubdomain, setLoadingSubdomain] = useState(false);

  function isPositiveInteger(n) {
      return n >>> 0 === parseFloat(n);
  }

  function setStateValues(token) {
    setApeSelection(token);
    setGaccRank(token);
  }

  async function setGaccRank(token_id) {
    if (token_id) {
      const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      const response = await fetch(process.env.REACT_APP_BASE_API_URL + '/api/gacc/ranks/' + token_id, requestOptions);
      const result = await response.json();
      let rank = result['rank'];
      setRankToShow(rank);
    }
  }

  // Resolve ENS name for address using reverse lookup
  const resolveEnsName = useCallback(async (web3Instance, address) => {
    if (!web3Instance || !address) {
      setEnsName(null);
      return;
    }

    try {
      // Use HTTP provider for ENS lookup (more reliable)
      const rpcUrl = process.env.REACT_APP_ALCHEMY_URL || process.env.REACT_APP_INFURA_URL;
      const readWeb3 = rpcUrl 
        ? new Web3(new Web3.providers.HttpProvider(rpcUrl))
        : web3Instance;

      // Normalize address to lowercase (remove 0x prefix for reverse lookup)
      const addressLower = address.toLowerCase().replace('0x', '');
      
      // Reverse the address for ENS reverse lookup: {reversed}.addr.reverse
      const reversedAddress = addressLower.split('').reverse().join('');
      const reverseName = reversedAddress + '.addr.reverse';
      
      // ENS Registry contract address (mainnet)
      const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
      const ENS_REGISTRY_ABI = [
        {
          "constant": true,
          "inputs": [{"name": "node", "type": "bytes32"}],
          "name": "resolver",
          "outputs": [{"name": "", "type": "address"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [{"name": "node", "type": "bytes32"}],
          "name": "owner",
          "outputs": [{"name": "", "type": "address"}],
          "type": "function"
        }
      ];

      // ENS Public Resolver ABI (supports both old and new resolvers)
      const RESOLVER_ABI = [
        {
          "constant": true,
          "inputs": [{"name": "node", "type": "bytes32"}],
          "name": "name",
          "outputs": [{"name": "", "type": "string"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [{"name": "node", "type": "bytes32"}],
          "name": "text",
          "outputs": [{"name": "", "type": "string"}],
          "type": "function",
          "payable": false,
          "stateMutability": "view"
        }
      ];

      // Calculate namehash for the reverse name
      // namehash function implementation (Web3.js doesn't have it built-in)
      function namehash(name) {
        const parts = name.split('.');
        let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
        for (let i = parts.length - 1; i >= 0; i--) {
          const labelHash = readWeb3.utils.keccak256(parts[i]);
          node = readWeb3.utils.keccak256(node + labelHash.slice(2));
        }
        return node;
      }
      
      const registry = new readWeb3.eth.Contract(ENS_REGISTRY_ABI, ENS_REGISTRY);
      const reverseNode = namehash(reverseName);
      
      const resolverAddress = await registry.methods.resolver(reverseNode).call();
      
      if (resolverAddress && resolverAddress !== "0x0000000000000000000000000000000000000000") {
        const resolver = new readWeb3.eth.Contract(RESOLVER_ABI, resolverAddress);
        
        // Try to get the name from the resolver
        let name = "";
        try {
          name = await resolver.methods.name(reverseNode).call();
        } catch (error) {
          // If name() doesn't work, try text() with "name" key (for newer resolvers)
          try {
            name = await resolver.methods.text(reverseNode, "name").call();
          } catch (textError) {
            // Both methods failed
          }
        }
        
        if (name && name.length > 0 && name.trim() !== "" && name !== "0x") {
          // Verify forward resolution to ensure it's correct
          try {
            const forwardAddress = await readWeb3.eth.ens.getAddress(name);
            if (forwardAddress && forwardAddress.toLowerCase() === address.toLowerCase()) {
              setEnsName(name);
            } else {
              setEnsName(null);
            }
          } catch (verifyError) {
            // If forward verification fails, still use the name
            setEnsName(name);
          }
        } else {
          setEnsName(null);
        }
      } else {
        setEnsName(null);
      }
    } catch (error) {
      console.error("Error resolving ENS name:", error);
      setEnsName(null);
    }
  }, []);

  // Check current subdomain
  const checkCurrentSubdomain = useCallback(async (web3Instance, userAccount) => {
    if (!userAccount) {
      return;
    }
    
    if (!SUBDOMAIN_CLAIMER_ADDRESS) {
      return;
    }
    
    setLoadingSubdomain(true);
    try {
      // Use HTTP provider (Alchemy/Infura) for read operations, same as GrandpaCoin.jsx
      // This is more reliable than using window.ethereum for read-only calls
      const rpcUrl = process.env.REACT_APP_ALCHEMY_URL || process.env.REACT_APP_INFURA_URL;
      const readWeb3 = rpcUrl 
        ? new Web3(new Web3.providers.HttpProvider(rpcUrl))
        : (web3Instance || new Web3(window.ethereum));
      
      // Normalize address to checksummed format
      const checksummedAddress = readWeb3.utils.toChecksumAddress(userAccount);
      
      const contract = new readWeb3.eth.Contract(SUBDOMAIN_CLAIMER_ABI, SUBDOMAIN_CLAIMER_ADDRESS);
      const label = await contract.methods.currentLabelOf(checksummedAddress).call();
      
      // Check if label exists and is not empty
      // Handle both string and other types, and check for empty strings
      let labelStr = "";
      
      if (label !== null && label !== undefined) {
        labelStr = String(label).trim();
      }
      
      if (labelStr.length > 0 && labelStr !== "null" && labelStr !== "undefined") {
        setCurrentSubdomain(labelStr);
      } else {
        setCurrentSubdomain(null);
      }
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setCurrentSubdomain(null);
    } finally {
      setLoadingSubdomain(false);
    }
  }, []);

  // Connect wallet for subdomain claiming
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

      // Resolve ENS name
      await resolveEnsName(userWeb3, userAccount);

      // Check for existing subdomain
      await checkCurrentSubdomain(userWeb3, userAccount);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (newAccounts) => {
        if (newAccounts.length === 0) {
          setAccount(null);
          setWeb3(null);
          setCurrentSubdomain(null);
        } else {
          const newWeb3 = new Web3(window.ethereum);
          setAccount(newAccounts[0]);
          setWeb3(newWeb3);
          resolveEnsName(newWeb3, newAccounts[0]);
          checkCurrentSubdomain(newWeb3, newAccounts[0]);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet: " + error.message);
    }
  }, [checkCurrentSubdomain]);

  // Claim or switch subdomain
  const claimSubdomain = useCallback(async () => {
    if (!web3 || !account || !subdomainInput.trim()) {
      alert("Please enter a subdomain name");
      return;
    }


    setClaiming(true);
    setClaimStatus("");

    try {
      const contract = new web3.eth.Contract(SUBDOMAIN_CLAIMER_ABI, SUBDOMAIN_CLAIMER_ADDRESS);
      
      // Let the wallet estimate gas automatically for optimal cost
      // Don't set gas limit - let wallet handle it
      const tx = await contract.methods.claim(subdomainInput.trim()).send({
        from: account
      });

      setClaimStatus(`Success! Transaction: ${tx.transactionHash}`);
      setSubdomainInput("");
      
      // Refresh subdomain after a delay
      setTimeout(() => {
        checkCurrentSubdomain(web3, account);
      }, 3000);

    } catch (error) {
      console.error("Error claiming subdomain:", error);
      setClaimStatus(`Error: ${error.message}`);
    } finally {
      setClaiming(false);
    }
  }, [web3, account, subdomainInput, checkCurrentSubdomain]);

  // Check subdomain and resolve ENS when account and web3 are available
  useEffect(() => {
    if (web3 && account) {
      if (SUBDOMAIN_CLAIMER_ADDRESS) {
        checkCurrentSubdomain(web3, account);
      }
      resolveEnsName(web3, account);
    }
  }, [web3, account, checkCurrentSubdomain, resolveEnsName]);

  function imageToShow() {
    if (!apeSelection) {
      return (
        <div className="my-auto col-lg-4 col-12 offset-lg-1">
          <img className="img-fluid w-100" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Sneak_Peek_Preview.gif'} alt="mystery token" />
          </div>
        )
    }
    let token_id = Number(apeSelection) + 1;
    if (apeSelection && isPositiveInteger(apeSelection) && token_id <= 5000 && rankToShow) {
      return (
        <div className="my-auto col-lg-4 col-12 offset-lg-1">
          <div className="imageItem">
        <img className="img-fluid w-100" style={{borderRadius: '5px'}} src={`https://ipfs.io/ipfs/QmY6CdW5UGJPu76qm6SkBBiWPBcnH7sr4JMBcA9mjuaNSU/${token_id}.png`} alt="mystery token" />
        <span className="caption">{`Rank #${rankToShow}`}</span>
        </div>
        </div>
      )
    }
    else {
    return (
    <div className="my-auto col-lg-4 col-12 offset-lg-1">
      <img className="img-fluid w-100" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Sneak_Peek_Preview.gif'} alt="mystery token" />
      </div>
    )
  }
  }
  
    return (
        <div>
        <div id="root">
          <div className="app" style={{backgroundColor: '#f9edcd'}}>
          <nav id="nav" className="navbar navbar-expand-md navbar-light" style={{backgroundColor: '#f9edcd'}}>
              <a href="/home" id="bayc-brand" className="navbar-brand"><img src={process.env.PUBLIC_URL + '/assets/images/GACC-Banner-Black-V6.png'} className="d-inline-block align-top" alt="bored ape logo" width="auto" height="70px" /></a>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span className="navbar-toggler-icon" /></button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <div className="navbar-nav" id="nav-bar">
                  <a id="nav-link" title="BUY A GACC" href="/home#buy-a-gacc" style={{color: 'black'}} className="nav-link">BUY A GACC</a>
                  <a id="nav-link" title="ROADMAP" href="/home#roadmap" style={{color: 'black'}} className="nav-link">ROADMAP</a>
                  <a id="nav-link" style={{color: 'black'}} title="TEAM" href="/home#team" className="nav-link">TEAM</a>
                  <a id="nav-link" style={{color: 'black'}} title="MACC" href="/macc" data-rb-event-key="/macc" className="nav-link">MACC</a>
                  <a id="nav-link" style={{color: 'black'}} title="GAKC" href="/kitten-club" data-rb-event-key="/kitten-club" className="nav-link">KITTENS</a>
                  <a id="nav-link" style={{color: 'black'}} title="$GRANDPA" href="/grandpacoin" className="nav-link">$GRANDPA</a>
                </div>
                <div className="navbar-nav" id="nav-social"><a href="https://discord.gg/8uuhkZ2TA2"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a></div>
              </div>
            </nav>
            <div>
              <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
                <div className="common-container">
                  <div className="mb-4 mb-lg-5 container">
                    <div className="row">
                      <div className="px-0 col-12"><img src={process.env.PUBLIC_URL + '/assets/images/GACC_COVER-2.png'} className="img-fluid px-0" useMap="#mutant" alt=""/></div>
                    </div>
                  </div>
                  <div className="px-4 mt-md-4 container">
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="mb-4 row">
                          <div className="mb-4 col-lg-7 col-12">
                            <h1 className="d-flex font-italic welcome-title mb-3" style={{color: 'black'}}>WELCOME TO THE<br />GRANDPA APE COUNTRY CLUB</h1>
                            <p className="common-p mb-0" style={{color: 'black'}}>Grandpa Ape Country Club ("GACC") is a collection of 5,000 Grandpa Ape NFTs, unique digital collectibles living on the Ethereum blockchain. Your Grandpa Ape doubles as your Country Club membership card, and grants access to members-only benefits, including airdrops and exclusive mints, in-person and virtual events, never ending games, and more. The GACC community is global and diverse, representing NFT investors of all shapes and forms. We welcome everyone to join us on this adventure!</p>
                          </div>
                          <div className="my-lg-auto col-lg-4 col-12 offset-lg-1">
                            <div className="common-container">
                              <div className="row">
                                <div className="pb-2 pr-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Ape_1-scaled.jpg'} alt="ape1" aria-label="ape1" /></div>
                                <div className="pb-2 pl-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Ape_4-scaled.jpg'} alt="ape2" aria-label="ape2" /></div>
                              </div>
                              <div className="row">
                                <div className="pt-2 pr-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Ape_6-scaled.jpg'} alt="ape3" aria-label="ape3" /></div>
                                <div className="pt-2 pl-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Ape_2-scaled.jpg'} aria-label="ape4" /></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-5 row">
                      <div className="col">
                        <div id="buy-a-gacc" className="buy-token-container">
                          <div className="bayc-bg p-4 m-auto row" style={{backgroundColor: 'white'}}>
                            <div className="m-auto col-lg-3 col-12">
                              <h3 className="buy-ape-title">BUY A GACC</h3>
                            </div>
                            <div className="m-auto col-lg-4 col-12 offset-lg-1">
                              <p className="common-p mb-lg-0">The initial sale has sold out. To get your Grandpa Ape, check out the collection on OpenSea, or any other major NFT marketplace.</p>
                            </div>
                            <div className="m-auto col-lg-2 col-12 offset-lg-1">
                              <a href="https://opensea.io/collection/grandpaapecountryclub" target="_blank" rel="noopener noreferrer"><button className="bayc-button mint" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>VISIT OPENSEA</button></a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="common-container">
                          <div className="row">
                            <div className="mb-3 col-lg-7 col-12">
                              <h2 className="common-title mb-3" style={{color: 'black'}}>THE SPECS</h2>
                              <p className="common-p" style={{color: 'black'}}>Each Grandpa Ape is unique and programmatically generated from over 200 possible traits, including expression, headwear, clothing, and more. All apes are spiffy, but some are rarer than others.<br /><br />The apes are stored as ERC-721 tokens on the Ethereum blockchain and hosted on IPFS.</p>
                              <form>
                                 <div className="form-group">
                                 <label htmlFor="apeId" className="common-p mb-2"  style={{color: 'black', fontWeight: 'bold'}}>Lookup Rarity</label>
                              <input className="form-control" name='apeId' id='apeId' placeholder="1" style={{textAlign: 'center'}} onChange={(e) => setStateValues(e.target.value)}></input>
                              </div>
                                </form>
                            </div>
                            {imageToShow()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="common-container">
                          <div className="row">
                            <div className="mb-3 col-lg-7 col-12">
                              <h2 className="common-title mb-3" style={{color: 'black'}}>GRANDPA STRATEGY</h2>
                              <p className="common-p" style={{color: 'black'}}>Grandpa Coin ($GRANDPA) is a strategy token that powers the Grandpa Ape Country Club ecosystem through an innovative buy-burn-lock strategy. With each purchase, 6% of the transaction goes directly to a Strategy Vault contract, where an autonomous bot continuously monitors the floor price of Grandpa NFTs and burns a perentage of $GRANDPA each time.</p>
                              <p className="common-p mb-0" style={{color: 'black'}}>This creates a perpetual buy pressure mechanism that strengthens the Grandpa Ape collection while rewarding holders through the deflationary nature of the token.</p>
                            </div>
                            <div className="m-lg-auto col-lg-3 col-12 offset-lg-1">
                              <div className="d-flex row">
                                <div className="mx-auto col-lg-12 col-md-6 col-sm-12">
                                  <a href="/grandpacoin">
                                    <button className="bayc-button w-100" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>GRANDPA COIN</button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    
                    {/* The Grandpa Subdomains Section */}
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="common-container">
                          <div className="row">
                            <div className="mb-4 col-lg-12 col-12">
                              <h2 className="common-title mb-3" style={{color: 'black'}}>THE GRANDPA SUBDOMAINS</h2>
                              <p className="common-p" style={{color: 'black'}}>
                                Claim your <strong style={{color: '#977039'}}>thegrandpa.eth</strong> subdomain! Own a piece of the Grandpa Ape Country Club identity on the Ethereum Name Service (ENS). Your subdomain will be yours forever, letting you show your grandpa pride wherever you go.
                              </p>
                              <p className="common-p" style={{color: 'black'}}>
                                Each wallet can claim one subdomain under <strong style={{color: '#977039'}}>thegrandpa.eth</strong>. Once claimed, you can switch to a new name anytime, but your previous subdomain will be released. Snag your subdomain today and rock out with your ...grandpa...name out!
                              </p>
                              <p className="common-p" style={{color: 'black'}}>
                                Connect your wallet to start! To set your grandpa ENS as your primary name head to the{' '}
                                <a 
                                  href="https://app.ens.domains/thegrandpa.eth?tab=subnames" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#977039',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  ENS subdomain page
                                </a>
                                {' '}and find yours.
                              </p>
                              <p className="common-p" style={{color: 'black', fontSize: '0.9rem', marginTop: '15px', marginBottom: 0}}>
                                <strong style={{color: '#977039'}}>Contract:</strong>{' '}
                                <a 
                                  href="https://etherscan.io/address/0x4E82641c6d4f24b066abF6E14DBB498476fcF656" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#977039',
                                    textDecoration: 'underline',
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  0x4E82641c6d4f24b066abF6E14DBB498476fcF656
                                </a>
                              </p>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-lg-8 col-md-10 col-12 mx-auto">
                              <div style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                borderRadius: '10px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                border: '2px solid #977039'
                              }}>
                                {!account ? (
                                  <div style={{textAlign: 'center'}}>
                                    <button
                                      className="bayc-button mint"
                                      type="button"
                                      onClick={connectWallet}
                                      style={{
                                        backgroundColor: '#977039',
                                        color: '#f9edcd',
                                        border: 'none',
                                        padding: '15px 30px',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        width: '100%',
                                        marginBottom: '15px',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      CONNECT WALLET
                                    </button>
                                    <p style={{color: '#666', fontSize: '0.9rem', margin: 0}}>
                                      Connect to claim your subdomain
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{
                                      marginBottom: '20px',
                                      padding: '12px',
                                      backgroundColor: '#f9edcd',
                                      borderRadius: '8px',
                                      border: '1px solid #977039'
                                    }}>
                                      <p style={{
                                        color: '#977039', 
                                        fontSize: '0.95rem', 
                                        fontWeight: 'bold', 
                                        margin: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        Connected Wallet: {ensName || account}
                                      </p>
                                    </div>

                                    {loadingSubdomain ? (
                                      <div style={{
                                        backgroundColor: '#f9edcd',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                        textAlign: 'center',
                                        border: '2px solid #83D8FC'
                                      }}>
                                        <p style={{color: '#977039', fontSize: '0.9rem', fontWeight: 'bold', margin: 0}}>
                                          Checking subdomain...
                                        </p>
                                      </div>
                                    ) : currentSubdomain && currentSubdomain.trim().length > 0 ? (
                                      <div style={{
                                        background: 'linear-gradient(135deg, #f9edcd 0%, #e8d9b0 100%)',
                                        padding: '20px',
                                        borderRadius: '10px',
                                        marginBottom: '20px',
                                        textAlign: 'center',
                                        border: '3px solid #977039',
                                        boxShadow: '0 4px 15px rgba(151, 112, 57, 0.2)'
                                      }}>
                                        <p style={{color: '#977039', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold', textTransform: 'uppercase'}}>Your Subdomain:</p>
                                        <p style={{
                                          color: '#977039', 
                                          fontSize: '1.4rem', 
                                          fontWeight: 'bold', 
                                          margin: 0,
                                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                          wordBreak: 'break-word'
                                        }}>
                                          {currentSubdomain}.thegrandpa.eth
                                        </p>
                                      </div>
                                    ) : (
                                      <div style={{
                                        backgroundColor: '#f9edcd',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                        textAlign: 'center',
                                        border: '2px dashed #977039'
                                      }}>
                                        <p style={{color: '#666', fontSize: '0.9rem', margin: 0, fontStyle: 'italic'}}>
                                          Get yo subdomain!
                                        </p>
                                      </div>
                                    )}

                                    <div style={{marginBottom: '20px'}}>
                                      <label style={{
                                        color: '#977039',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        display: 'block'
                                      }}>
                                        Subdomain Name:
                                      </label>
                                      <input
                                        type="text"
                                        value={subdomainInput}
                                        onChange={(e) => setSubdomainInput(e.target.value)}
                                        placeholder={currentSubdomain ? "Enter new subdomain" : "Enter subdomain name"}
                                        style={{
                                          width: '100%',
                                          padding: '12px',
                                          borderRadius: '8px',
                                          border: '2px solid #977039',
                                          fontSize: '1rem',
                                          backgroundColor: '#f9edcd',
                                          color: 'black',
                                          transition: 'all 0.3s ease'
                                        }}
                                        disabled={claiming}
                                        onFocus={(e) => {
                                          e.target.style.borderColor = '#83D8FC';
                                          e.target.style.backgroundColor = 'white';
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.borderColor = '#977039';
                                          e.target.style.backgroundColor = '#f9edcd';
                                        }}
                                      />
                                      <style>{`
                                        input::placeholder {
                                          color: #999 !important;
                                          opacity: 1 !important;
                                        }
                                        input::-webkit-input-placeholder {
                                          color: #999 !important;
                                          opacity: 1 !important;
                                        }
                                        input::-moz-placeholder {
                                          color: #999 !important;
                                          opacity: 1 !important;
                                        }
                                        input:-ms-input-placeholder {
                                          color: #999 !important;
                                          opacity: 1 !important;
                                        }
                                      `}</style>
                                      <p style={{
                                        color: '#977039', 
                                        fontSize: '0.8rem', 
                                        marginTop: '8px', 
                                        marginBottom: 0,
                                        fontStyle: 'italic'
                                      }}>
                                        {currentSubdomain ? 'Enter a new name to switch' : '1-63 characters, no spaces at start/end'}
                                      </p>
                                    </div>

                                    <button
                                      className="bayc-button mint"
                                      type="button"
                                      onClick={claimSubdomain}
                                      disabled={claiming || !subdomainInput.trim()}
                                      style={{
                                        backgroundColor: claiming || !subdomainInput.trim() ? '#ccc' : '#977039',
                                        color: '#f9edcd',
                                        border: 'none',
                                        padding: '15px 30px',
                                        fontSize: '1.1rem',
                                        cursor: claiming || !subdomainInput.trim() ? 'not-allowed' : 'pointer',
                                        width: '100%',
                                        opacity: claiming || !subdomainInput.trim() ? 0.6 : 1,
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {claiming ? 'PROCESSING...' : currentSubdomain ? 'SWITCH SUBDOMAIN' : 'CLAIM SUBDOMAIN'}
                                    </button>

                                    {claimStatus && (
                                      <div style={{
                                        marginTop: '15px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        backgroundColor: claimStatus.includes('Error') ? '#ffe6e6' : '#e6f7e6',
                                        border: `2px solid ${claimStatus.includes('Error') ? '#d32f2f' : '#2e7d32'}`,
                                        textAlign: 'center'
                                      }}>
                                        <p style={{
                                          color: claimStatus.includes('Error') ? '#d32f2f' : '#2e7d32',
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          margin: 0,
                                          wordBreak: 'break-word'
                                        }}>
                                          {claimStatus}
                                        </p>
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

                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                      <div id="roadmap" className="common-container">
                          <div className="row">
                            <div className="mb-3 col-lg-9 col-12">
                              <h2 className="common-title mb-3" style={{color: 'black'}}>THE FRONT NINE</h2>
                              <p className="common-p" style={{color: 'black'}}>We're in this for the long haul.</p>
                              <p className="common-p" style={{color: 'black'}}>Just like the front nine of a golf course, our roadmap is a set of holes were working to complete and achieve together. Where the back nine takes us, only time will tell!</p>
                            </div>
                            <div className="mb-3 mb-md-0 col-lg-8 col-12">
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">1</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>The Grandpa Ape Country Club ("GACC") is minted.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">2</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>Holders only GACC Merchandise is available for a limited time.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">3</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>GACC Laboratory will open and begin airdropping Mutant Serums to GACC holders.</p>
                                </div>
                              </div>

                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">4</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>The Mutant Ape Country Club ("MACC") is minted and the mutation laboratory opens.</p>
                                </div>
                              </div>
                              <div className="row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">5</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>Holders begin accruing Grandpa Points ("GP") for buying and holding NFTs. Join the Discord to enroll!</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">6</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>The GACC Pro Shop will open, offering MACC merch, limited-edition drops, and GACC classics.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">7</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>The Grandpa Ape Country Club V1 Toys collection is launched and the top 50 holders receive one for free.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">8</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="common-sub-p" style={{color: 'black'}}>Lünagems are mined and the Grandpa Ape Kitten Club ("GAKC") is born.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">9</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="common-sub-p" style={{color: 'black'}}>The GACC Laboratory experimentations reveal something spectacular...</p>
                                </div>
                              </div>
                            </div>
                            <div className="shirt-container mx-auto mb-5 my-lg-auto col-lg-3 col-12 offset-lg-1"><img className="shirt-mask" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Road_Map.png'} alt="shirt" /><img className="shirt" style={{borderRadius: '5px'}} src={process.env.PUBLIC_URL + '/assets/images/Road_Map.png'} alt="shirt" /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="row">
                          <div className="mb-4 mb-lg-0 col-lg-8 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>THE GREENS</h2>
                            <p className="common-p mb-0" style={{color: 'black'}}>The Greens is the main Discord channel, where the community voice lives and breathes. In the Discord is where we collaborate, earn Grandpa Points ("GP") for games and prizes, share our love for the NFT art, and hang out with friends. Join us anytime! New members get 250 GP just for joining!</p>
                          </div>
                          <div className="m-lg-auto col-lg-3 col-12 offset-lg-1">
                            <div className="d-flex row">
                              <div className="mx-auto col-lg-12 col-md-6 col-sm-12"><a href="https://discord.gg/8uuhkZ2TA2"><button className="bayc-button w-100" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>DISCORD</button></a></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="row">
                          <div className="mb-4 mb-lg-0 col-lg-8 col-12">
                            <h2 className="common-title mb-3" id="merch" style={{color: 'black'}}>GACC PRO SHOP (MERCH)</h2>
                            <p className="common-p mb-0" style={{color: 'black'}}>The GACC NFT ecosystem brand looks incredible on merchandise. The GACC Pro Shop is always open but keep an eye out for weekly one-of-a-kind merch drops only avaiable for a short period.</p>
                          </div>
                          <div className="m-lg-auto col-lg-3 col-12 offset-lg-1">
                            <div className="d-flex row">
                              <div className="mx-auto col-lg-12 col-md-6 col-sm-12"><a href="https://gaccproshop.com/"><button className="bayc-button w-100" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>GACC PRO SHOP</button></a></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="row">
                          <div className="mb-4 mb-lg-0 col-lg-8 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>GACC LOUNGE ALPHA BOT</h2>
                            <p className="common-p mb-0" style={{color: 'black'}}>GACC holders with five or more grandpas get access to an exclusive Discord channel with a bot that pulls down and analyzes code from any ERC271 and ERC1155 contract. The bot allows holders to gain deep insights into an NFT contract before investing at the touch of a button.</p>
                          </div>
                          <div className="m-lg-auto col-lg-3 col-12 offset-lg-1">
                            <div className="d-flex row">
                            <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/lightspeed_gacc_2561.gif'} alt="robot" aria-label="robot" style={{borderRadius: '5px'}} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div id="team" className="common-container">
                          <div className="row">
                            <div className="mb-2 col-lg-7 col-12" style={{top: '-10px'}}>
                              <h2 className="common-title mb-3" style={{color: 'black'}}>THE TEAM</h2>
                              <p className="common-p" style={{color: 'black'}}>GACC is run by a team of hard-working collectors, focused on returning value and fun to the GACC NFT community.</p>
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>SWIRL</span> <span className="font-italic" style={{color: 'black', textAlign: 'left'}}>CEO AND CHIEF DJ&nbsp; <a href="https://twitter.com/SwirlOne"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>CARTOON</span> <span className="font-italic" style={{color: 'black'}}>CODE MONKEY&nbsp; <a href="https://twitter.com/cartoonitunes"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>DARK</span> <span className="font-italic" style={{color: 'black'}}>ALL THINGS DESIGN&nbsp; <a href="https://twitter.com/StudioDarkk"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>KEIKORU</span> <span className="font-italic" style={{color: 'black'}}>CODE MONKEY&nbsp; <a href="https://twitter.com/KeikoruOne"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
                            </div>
                            <div className="my-lg-auto col-lg-4 col-12 offset-lg-1">
                              <div className="common-container">
                                <div className="row">
                                  <div className="pb-2 pr-2 col-6">
                                    <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/swirl.png'} alt="swirl" aria-label="swirl" style={{borderRadius: '5px'}} />
                                  </div>
                                  <div className="pb-2 pl-2 col-6">
                                    <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/cartoon.png'} alt="cartoon" aria-label="cartoon" style={{borderRadius: '5px'}} />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="pt-2 pr-2 col-6">
                                    <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/dark.png'} alt="dark" aria-label="dark" style={{borderRadius: '5px'}} />
                                  </div>
                                  <div className="pt-2 pl-2 col-6">
                                    <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/keikoru.jpg'} alt="keikoru" aria-label="keikoru" style={{borderRadius: '5px'}} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  <div></div>
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="row">
                          <div className="mb-4 mb-lg-0 col-lg-8 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>THE ARTIST</h2>
                            <p className="common-p mb-0" style={{color: 'black'}}>Naro, a.k.a. Kuchuya, is the artist behind the immaculate GACC NFT ecosystem. Naro has been drawing for 25+ years and draws inpiration from films, video games, and Japanese anime. Naro has an amazing story and an even more amazing heart.</p>
                          </div>
                          <div className="m-lg-auto col-lg-3 col-12 offset-lg-1">
                            <div className="d-flex row">
                            <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/kuchuya.jpg'} alt="kuchuya" aria-label="kuchuya" style={{borderRadius: '5px'}} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="d-flex justify-content-center">
                          <p className="common-p text-center text-break mb-0"><span className="bold-text" style={{color: 'black'}}>VERIFIED SMART CONTRACT ADDRESS: </span><a title="0x4B103d07C18798365946E76845EDC6b565779402" href="https://etherscan.io/address/0x4b103d07c18798365946e76845edc6b565779402" className="link" style={{color: '#977039'}}>0x4B103d07C18798365946E76845EDC6b565779402</a></p>
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
                  <div className="col-12 col-lg-4 order-first"><img className="img-fluid footer-logo" src="https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0" alt="logo" /></div>
                  <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
                    <div className="row">
                    <div className="text-lg-right col-sm-12 col-12"><a href="https://discord.gg/8uuhkZ2TA2"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a></div>
                      <div className="col-lg-12 col-sm-6 col-6">
                        <p className="copyright text-right"><span className="copy-left" style={{color: 'black'}}>© 2023 Grandpa Ape Country Club</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container-fluid m-0 p-0" style={{borderBottom: 'white'}}><span className="last-line" style={{borderBottom: 'white'}} /></div>
            </footer>
          </div>
        </div>
      </div>);
}
 
export default Home;



   

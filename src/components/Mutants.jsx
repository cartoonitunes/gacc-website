import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectMACC } from "../redux/blockchain/blockchainActions";
import { fetchData } from "../redux/data/dataActions";
import '../styles/style.css'
require('dotenv').config();


function Mutants() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  // eslint-disable-next-line
  const data = useSelector((state) => state.data);
  const [feedback, setFeedback] = useState("");
  const [apeSelection, setApeSelection] = useState(null);
  const [mintingNft, setMintingNft] = useState(false);
  const legendaries = ["0","1","2","3","4","5","6","7","8","9","156","576","1713","2976","3023","3622","3767","3867"];

  const mintMutant = async (serumId=null, apeId=null, numMints=null) => {
    if (data.saleFreeWhitelistActive) {
      freeWhiteListMint(numMints)
    }
    else if (data.saleWhitelistActive) {
      whiteListMint()
    }
    else if (data.publicSaleActive) {
      dutchAuctionMint(numMints)
    }
    else if (data.serumMutationActive) {
      mutationCaller(serumId, apeId)
    }
  };

  const maccLabels = () => {
    if (data.saleFreeWhitelistActive) {
      return (
        {
          'title': 'MINT A MUTANT',
          'subTitle': 'Connect your wallet to mint a MACC.',
          'connectedSubTitle': `Free Whitelist Mint. ${5000 - data.apesMinted} left!`
        }
      )
    }
    else if (data.saleWhitelistActive) {
     return (
      {
        'title': 'MINT A MUTANT',
        'subTitle': 'Connect your wallet to mint a MACC.',
        'connectedSubTitle': `Whitelist Mint. ${5000 - data.apesMinted} left!`
      }
     )
    }
    else if (data.publicSaleActive) {
      let remainingTime = new Date(data.remainingSaleTime * 1000).toISOString().substr(11, 8);
      return (
        {
          'title': 'MINT A MUTANT',
          'subTitle': 'Connect your wallet to mint a MACC.',
          'connectedSubTitle': `Dutch Auction. ${5000 - data.apesMinted} left!\nPrice: ${((data.currentPrice/1000000000000000000)).toFixed(3)}Ξ\nTime remaining: ${remainingTime}.`
        }
      )
    }
    else if (data.serumMutationActive) {
      return (
        {
          'title': `MUTATE A GRANDPA APE`,
          'subTitle': 'Connect your wallet to mutate a GACC.',
          'connectedSubTitle': ''
        }
      )
    }
    else {
      return({})
    }
  };

  const processErrorMessage = (errorMessage) => {
    const endIndex = errorMessage.message.search('{')
    if (endIndex === -1) {
      return('Insufficient Funds to Mint.')
    } else {
      let err_message = errorMessage.message.substring(0, endIndex)
      let execution = 'execution reverted: '
      let executionIndex = err_message.indexOf(execution)
      if (executionIndex === -1) {
        return(err_message);
      }
      else {
        let cleaned_error = err_message.slice(executionIndex + execution.length)
        return(cleaned_error);
      }
    }
  }

  const freeWhiteListMint = async (numMints) => {
    setFeedback(`Minting your MACC...`);
    setMintingNft(true);
    blockchain.smartContract.methods
      .mintFreeWhitelist(numMints)
      .call({
        to: process.env.REACT_APP_MACC_ADDRESS,
        from: blockchain.account
      })
      .then(() => {
        blockchain.smartContract.methods
        .mintFreeWhitelist(numMints)
        .send({ 
          to: process.env.REACT_APP_MACC_ADDRESS,
          from: blockchain.account
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `Congratulations and welcome to the Mutant Ape Country Club! Go visit Opensea.io and holler in the Discord.`
          );
          setMintingNft(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingNft(false);
        });
      })
      .catch(err => {
        setFeedback(processErrorMessage(err))
        setMintingNft(false);
      });
  }

  const whiteListMint = async () => {
    let cost = process.env.REACT_APP_WL_PRICE;
    let totalCostWei = String(cost);
    setFeedback(`Minting your MACC...`);
    setMintingNft(true);
    blockchain.smartContract.methods
      .mintWhitelist()
      .call({
        to: process.env.REACT_APP_MACC_ADDRESS,
        from: blockchain.account,
        value: totalCostWei
      })
      .then(() => {
        blockchain.smartContract.methods
        .mintWhitelist()
        .send({ 
          to: process.env.REACT_APP_MACC_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `Congratulations and welcome to the Mutant Ape Country Club! Go visit Opensea.io and holler in the Discord.`
          );
          setMintingNft(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingNft(false);
        });
      })
      .catch(err => {
        setFeedback(processErrorMessage(err))
        setMintingNft(false);
      });
  }

  const dutchAuctionMint = async (numMints) => {
    let cost = await blockchain.smartContract.methods.getMintPrice().call()
    console.log(`The contract says ${cost}`)
    cost = cost * numMints
    console.log(`Multiplied by ${numMints} its ${cost}`)
    console.log(`As a string its ${String(cost)}`)
    let buffer = 20000
    let totalCostWei = String(cost + buffer);
    setFeedback(`Minting your MACC...`);
    setMintingNft(true);
    blockchain.smartContract.methods
      .mintMutants(numMints)
      .call({
        to: process.env.REACT_APP_MACC_ADDRESS,
        from: blockchain.account,
        value: totalCostWei
      })
      .then(() => {
        blockchain.smartContract.methods
        .mintMutants(numMints)
        .send({ 
          to: process.env.REACT_APP_MACC_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `Congratulations and welcome to the Mutant Ape Country Club! Go visit Opensea.io and holler in the Discord.`
          );
          setMintingNft(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingNft(false);
        });
      })
      .catch(err => {
        let prettyCost = ((cost/1000000000000000000)).toFixed(3);
        let priceInfo = ` The price to mint ${numMints} mutants is ${prettyCost}ETH.`
        setFeedback(processErrorMessage(err)+priceInfo)
        setMintingNft(false);
      });
  }

  const mutationCaller = (serumId, apeId) => {

    if (!serumId && legendaries.includes(apeId)) {
      mutateLegendary(apeId)
    }
    else {
      mutateGrandpa(serumId, apeId)
    }
  }

  const mutateGrandpa = async (serumId, apeId) => {
    setFeedback(`Mutating your GACC...`);
    setMintingNft(true);
    blockchain.smartContract.methods
      .mutateApeWithSerum(serumId, apeId)
      .call({
        to: process.env.REACT_APP_MACC_ADDRESS,
        from: blockchain.account
      })
      .then(() => {
        blockchain.smartContract.methods
        .mutateApeWithSerum(serumId, apeId)
        .send({ 
          to: process.env.REACT_APP_MACC_ADDRESS,
          from: blockchain.account
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `Congratulations and welcome to the Mutant Ape Country Club! Go visit Opensea.io and holler in the Discord.`
          );
          setMintingNft(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingNft(false);
        });
      })
      .catch(err => {
        setFeedback(processErrorMessage(err))
        setMintingNft(false);
      });
  }

  const mutateLegendary = async (apeId) => {
    setFeedback(`Mutating your Legendary GACC...`);
    setMintingNft(true);
    blockchain.smartContract.methods
      .mutateApeWithoutSerum(apeId)
      .call({
        to: process.env.REACT_APP_MACC_ADDRESS,
        from: blockchain.account
      })
      .then(() => {
        blockchain.smartContract.methods
        .mutateApeWithoutSerum(apeId)
        .send({ 
          to: process.env.REACT_APP_MACC_ADDRESS,
          from: blockchain.account
        })
        .then((receipt) => {
          console.log(receipt);
          setFeedback(
            `Congratulations you legend! Go visit Opensea.io and holler in the Discord.`
          );
          setMintingNft(false);
          dispatch(fetchData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingNft(false);
        });
      })
      .catch(err => {
        setFeedback(processErrorMessage(err))
        setMintingNft(false);
      });
  }

  const titleText = () => {
    return (
      <div className="d-flex justify-content-center">
        {(blockchain.account === "" || blockchain.smartContract === null) ? (
        <p className="common-p mint-subtitle">{maccLabels()['subTitle']}</p>): (
          <p className="common-p mint-subtitle">{maccLabels()['connectedSubTitle']}</p>
        )}
        </div>
    )
  }

  function updateTextInput(val) {
    document.getElementById('textLabel').value=val; 
  }

  const connectAndMintButton = () => {
    if (blockchain.account === "" || blockchain.smartContract === null) {
      return (
        <div className="d-flex justify-content-center"><button 
        className="bayc-button " 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          dispatch(connectMACC());
          setFeedback(data.errorMsg);
          getData();
        }}
        style={{backgroundColor: '#83D8FC', color: 'black'}}>
          CONNECT WALLET
        </button></div>
      )
    }
    else if (data.saleWhitelistActive) {
      return (
      <div className="d-flex justify-content-center">
        <button 
          className="bayc-button " 
          type="button"
          disabled={mintingNft ? 1 : 0}
          onClick={(e) => {
            e.preventDefault();
            mintMutant();
            getData();
          }}
          >
            {mintingNft ? "Minting..." : "Mint 1 MACC"}
        </button>
      </div>
      )
    }
    else if (data.saleFreeWhitelistActive) {
      return (
        <div className="d-flex justify-content-center">
        <form>
          <div className="form-group">
            <label htmlFor="formControlRange" className="form-label mint-subtitle">How many do you want to mint? (max either 1 or 5 depending on your WL)</label>
            <input type="range" className="form-range" defaultValue="1" min="1" max="5" id="mintQuantity" onChange={(e) => updateTextInput(e.target.value)}/>
            <input type="text" id="textLabel" defaultValue="1" readOnly></input>
          </div>
          <button type="submit" className="bayc-button" disabled={mintingNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault();
              mintMutant(null, null, document.getElementById("mintQuantity").value);
              getData();
            }}>Mint</button>
        </form>
      </div>
      )
    }
    else if (data.publicSaleActive) {
      return (
      <div className="d-flex justify-content-center">
        <form>
          <div className="form-group">
            <label htmlFor="formControlRange" className="form-label mint-subtitle">How many do you want to mint? (max 20)</label>
            <input type="range" className="form-range mint-input" defaultValue="1" min="1" max="20" id="mintQuantity" onChange={(e) => updateTextInput(e.target.value)}/>
            <input type="text" className="mint-input" id="textLabel" defaultValue="1" readOnly></input>
          </div>
          <button type="submit" className="bayc-button mint-button" disabled={mintingNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault();
              mintMutant(null, null, document.getElementById("mintQuantity").value);
              getData();
            }}>Mutate</button>
        </form>
      </div>
      )
    }
    else if (data.serumMutationActive) {
      return (
      <div className="d-flex justify-content-center">
        <form>
          <div className="form-group">
            <label htmlFor="exampleInputEmail1 mint-subtitle">Enter Ape ID to Mutate</label>
            <input className="form-control bayc-button mint-input" name='apeId' id='apeId' onChange={(e) => setApeSelection(e.target.value)}></input>
          </div>
          {!legendaries.includes(apeSelection) && (
              <div className="form-group">
              <label htmlFor="exampleInputPassword1">Select Serum</label>
              <select className="form-control bayc-button " id='serumId'>
                <option value="1" name='serumId'>M1 Serum</option>
                <option value="2" name='serumId'>M2 Serum</option>
                <option value="69" name='serumId'>M3 Serum</option>
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary bayc-button " disabled={mintingNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault();
              if (document.getElementById("serumId")) {
                mintMutant(document.getElementById("serumId").value, document.getElementById("apeId").value);
              }
              else {
                mintMutant(null, document.getElementById("apeId").value);
              }
              getData();
            }}>Mutate</button>
        </form>
      </div>
      )
    }
    else {
      return (
      <div className="d-flex justify-content-center">
       No minting or mutating at the moment. Stay tuned.
      </div>
      )
    }
  }

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData());
    }
  };

  useEffect(() => {
  }, [feedback]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, [blockchain.account]);

  return (
    <div>
      <div id="root">
        <div className="app">
          <nav id="nav" className="navbar navbar-expand navbar-light sticky-top">
            <a href="/home" id="bayc-brand" className="navbar-brand">
              <img src={process.env.PUBLIC_URL + '/assets/images/MACC_LOGO.png'} className="d-inline-block align-top" alt="bored ape logo" width="auto" height="75px" />
            </a>
            <button aria-controls="responsive-navbar-nav" id="nav-toggle" type="button" aria-label="Toggle navigation" className="navbar-dark navbar-toggler collapsed">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="navbar-collapse">
              <div className="navbar-nav" id="nav-bar">
                <a id="nav-link" title="BUY AN APE" href="/home#buy-an-ape" className="nav-link">BUY AN APE</a>
                <a id="nav-link" title="BUY A SERUM" href="/macc#buy-a-serum" className="nav-link">BUY A SERUM</a>
                <a id="nav-link" title="ROADMAP" href="/home#roadmap" className="nav-link">ROADMAP</a>
                <a id="nav-link" title="TEAM" href="/home#team" className="nav-link">TEAM</a>
              </div>
              <div className="navbar-nav" id="nav-social">
                <a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg">
                  <i className="fa fa-youtube-play social-icon pr-lg-0" />
                </a>
                <a href="https://www.instagram.com/grandpaapecountryclubofficial">
                  <i className="fa fa-instagram social-icon pr-lg-0" />
                </a>
                <a href="https://discord.com/invite/gacc">
                  <i className="fa fa-discord-alt social-icon pr-lg-0" />
                </a>
                <a href="https://twitter.com/GrandpaApeCC">
                  <i className="fa fa-twitter social-icon pr-lg-0" />
                </a>
              </div>
            </div>
          </nav>
          <div>
            <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
              <div className="common-container">
                <div className="mb-4 mb-lg-5 container">
                  <div className="row">
                    <div className="px-0 col-12">
                      <img src={process.env.PUBLIC_URL + '/assets/images/MACC_COVER.png'} className="img-fluid px-0" useMap="#mutant" alt=""/>
                    </div>
                  </div>
                </div>
                <hr className="gray-line mb-5" />
                  <div>
                    <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
                      <div className="mb-5  row">
                        <div className="col">
                          <div className="d-flex justify-content-center w-100 col-12">
                            <div className="MuiPaper-root MuiCard-root jss12 MuiPaper-outlined MuiPaper-rounded" style={{opacity: 1, transform: 'none', transition: 'opacity 291ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 194ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'}}>
                              <div className="MuiCardContent-root">
                                <h2 className="d-flex justify-content-center common-sub-title mint-title">{maccLabels()['title']}</h2>
                                <hr className="black-line" /><center>
                                {titleText()}
                                {connectAndMintButton()}</center>
                                <br></br>
                                <div className="mint-feedback">{feedback}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div></div>
                    {/* <div className="mb-5 row">
                      <div className="col">
                        <div className="d-flex justify-content-center">
                          <p className="common-p text-center text-break mb-0"><span className="bold-text">VERIFIED SMART CONTRACT ADDRESS: </span><a title="0x4B103d07C18798365946E76845EDC6b565779402" href="https://etherscan.io/address/0x4B103d07C18798365946E76845EDC6b565779402" className="link" style={{color: '#977039'}}>0x4B103d07C18798365946E76845EDC6b565779402</a></p>
                        </div>
                      </div>
                    </div> */}
                <hr className="gray-line mb-5" />
                <div className="px-4 mt-md-4 container">
                  <div className="mb-5  row">
                    <div className="mb-5 mb-lg-0 col-lg-7 col-12">
                      <h1 className="common-title mb-3">THE MACC</h1>
                      <p className="common-p  text-justify">The MUTANT GRANDPA APE COUNTRY CLUB is a collection of up to 10,000 Mutant Apes that can only be created by exposing an existing Grandpa Ape to a vial of MUTANT SERUM or by minting a Mutant Ape in the public sale.</p>
                      <p className="common-p text-justify">The MACC is a way to reward our ape holders with an entirely new NFT—a “mutant” version of their ape—while also allowing newcomers into the GACC ecosystem at a lower tier of membership. Mutants represent the final tier of membership; everything going forward occurs with the intention of accruing utility and member’s-only benefits to Grandpa Apes foremost, but also Mutants, and to a lesser extent, Grandpa Apes with GAKC companions.</p>
                    </div>
                    <div className="my-lg-auto col-lg-4 col-12 offset-lg-1">
                      <div className="common-container">
                        <div className="row">
                          <div className="pb-2 pr-2 col-6">
                            <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/ASTRONAUT.jpg'} alt="mutant-1" aria-label="mutant-1" style={{borderRadius: '5px'}} />
                          </div>
                          <div className="pb-2 pl-2 col-6">
                            <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/SUSHI.jpg'} alt="mutant-2" aria-label="mutant-2" style={{borderRadius: '5px'}} />
                          </div>
                        </div>
                        <div className="row">
                          <div className="pt-2 pr-2 col-6">
                            <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/RAINBOW_GRILL.jpg'} alt="mutant-3" aria-label="mutant-3" style={{borderRadius: '5px'}} />
                          </div>
                          <div className="pt-2 pl-2 col-6">
                            <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/deathbot.jpg'} aria-label="mutant-4" style={{borderRadius: '5px'}} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="gray-line mb-5" />
                  <div className="mb-5  row">
                    <div className="col-12">
                      <h1 className="common-title mb-3">SERUMS 
                        <span className="bayc-color"> (FOR GACC MEMBERS)</span>
                      </h1>
                    </div>
                    <div className="mb-4 mb-lg-5 col-lg-7 col-12">
                      <p className="common-p">One way to create a MUTANT is when a Grandpa Ape ingests a vial of mutant serum. There are three tiers of mutant serum vials: M1, M2, and Mega Mutant (M3). A snapshot of all Grandpa Ape token holders was taken at 5pm PST on 2/28/22, and all mutant serums that will exist have been airdropped at a random distribution to corresponding wallets.</p>
                      <p className="common-p">If a Grandpa Ape ingests an M1 or M2 serum, the resulting MUTANT will retain traits of the original ape.</p>
                      <p className="common-p mb-0">If a Grandpa Ape ingests an M3 serum? Who knows.</p>
                    </div>
                    <div className="mb-5 mb-lg-0 col-lg-4 col-12 offset-lg-1">
                      <p className="common-sub-p font-italic mb-0">
                        <span className="bayc-color bold-text">NOTE:</span> Serum vials are burned upon use, and a Grandpa Ape can only ingest a serum of a given vial-type once. This means that any given Grandpa Ape can be exposed to an M1, M2, or M3 vial, resulting in three different mutations of that Grandpa Ape. Vials are nasty stuff however. An ape will never ingest a vial of a given type after it has consumed one before.
                      </p>
                    </div>
                    <div className="col-lg-6 col-12 order-lg-2">
                      <div className="row">
                        <div className="col-lg-6 col-6 order-lg-2 offset-lg-0 offset-3">
                          <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/ASLAN.png'} alt="" style={{borderRadius: '5px'}} />
                          <p className="mt-2 mb-0 text-center">Aslan</p>
                        </div>
                        <div className="my-lg-3 d-lg-flex justify-content-center align-items-center col-lg-3 col-3 offset-lg-0 offset-2">
                          <div className="mb-4 m-lg-4 sw">
                            <span className="m_scroll_arrows_down first mx-auto" />
                            <span className="m_scroll_arrows_down second mx-auto" />
                            <span className="m_scroll_arrows_down third mx-auto" />
                          </div>
                        </div>
                        <div className="my-lg-3 d-lg-flex justify-content-center align-items-center col-lg-3 col-3 order-lg-3 offset-lg-0 offset-2">
                          <div className="mb-4 m-lg-4 se">
                            <span className="m_scroll_arrows_down first mx-auto" />
                            <span className="m_scroll_arrows_down second mx-auto" />
                            <span className="m_scroll_arrows_down third mx-auto" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-3 col-6 order-lg-1">
                      <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/M1_ASLAN.png'} alt="" style={{borderRadius: '5px'}} />
                      <p className="mt-2 mb-0 text-center">M1 Aslan</p>
                    </div>
                    <div className="col-lg-3 col-6 order-lg-3">
                      <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/M2_ASLAN.png'} alt="" style={{borderRadius: '5px'}} />
                      <p className="mt-2 mb-0 text-center">M2 Aslan</p>
                    </div>
                  </div>
                  <hr className="gray-line mb-5" />
                  <div className="mb-5  row">
                    <div className="mb-5 mb-lg-0 col-lg-7 col-12 order-lg-last">
                      <h1 className="common-title mb-3">DISTRIBUTION &amp; PRICING</h1>
                      <p className="common-p text-justify">A total of 5,000 Mutant Serums have been airdropped to all GACC token holders.</p>
                      <p className="common-p text-justify">2,500 Mutant Apes will be reserved for Whitelist Wallets to be minted during the Whitelist Minting period, and it will cost “X” ETH to mint a Mutant. After the Whitelist Mint period closes, 2,500 more Mutant Apes will be available to mint in a public Dutch Auction. The price to mint a Mutant will start at “X” ETH, and gradually reduce to .01 ETH over the course of 3 hours. This is to allow the community to set a fair starting price and, hopefully, avoid any gas war.</p>
                      <p className="common-p text-justify">At the time of minting, Mutant Apes will be unrevealed. Once the public sale has concluded, all Mutant Apes will be revealed.</p>
                      <p className="common-p text-justify mb-0">After the mutants are revealed, GACC members will be able to begin mutating their apes with serums here on the site.</p>
                    </div>
                    <div className="mb-0 my-lg-auto col-lg-5 col-12 offset-lg-0">
                      <img src={process.env.PUBLIC_URL + '/assets/images/serum.gif'} className="img-fluid rounded" alt="" />
                    </div>
                  </div>
                  <div className="mb-5 row">
                      <div className="col">
                        <div id="buy-a-serum" className="buy-token-container">
                          <div className="bayc-bg p-4 m-auto row">
                            <div className="m-auto col-lg-3 col-12">
                              <h3 className="buy-ape-title">BUY A SERUM</h3>
                            </div>
                            <div className="m-auto col-lg-4 col-12 offset-lg-1">
                              <p className="common-p mb-lg-0">The serum snapshot and airdrop has ended. To get your M1, M2, or Mega Serum, check out the collection on OpenSea.</p>
                            </div>
                            <div className="m-auto col-lg-3 col-12 offset-lg-1"><a href="https://opensea.io/collection/grandpaapechemistryclub"><button className="bayc-button mint" type="button">BUY A SERUM ON OPENSEA</button></a></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  <hr className="gray-line mb-5" />
                  <div className="mb-5  row">
                    <div>
                      <h1 className="common-title mb-3">MUTATION 
                        <span className="bayc-color"> (FOR GACC MEMBERS)</span>
                      </h1>
                      <p className="common-p text-justify">GACC token holders will be able to begin applying their airdropped serums to their Grandpa Apes upon completion of the public sale. The exact time will be announced on Twitter (
                        <a href="https://twitter.com/GrandpaApeCC" className="link">@GrandpaApeCC</a>) and in our&nbsp;
                        <a href="https://discord.com/invite/gacc" className="link">Discord</a>. Applying a serum to a Grandpa Ape will burn that serum, and result in a MUTANT NFT which may retain aspects of the original Grandpa Ape. The Grandpa Ape NFT will not be harmed.
                      </p>
                      <p className="common-p bold-text text-justify">THERE IS NO SET TIME LIMIT FOR APPLYING SERUMS.</p>
                      <p className="common-p text-justify mb-0">Remember, a Grandpa Ape can only be mutated via a vial of a certain type once. We will introduce a method for checking whether a Grandpa Ape has been exposed to a given vial type.</p>
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
                </div>
                <div className="col-12 col-lg-4 order-first">
                  <img className="img-fluid footer-logo" src={process.env.PUBLIC_URL + '/assets/images/MACC_LOGO.png'} alt="logo" />
                </div>
                <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
                  <div className="row">
                    <div className="text-lg-right col-sm-12 col-12">
                      <a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg">
                        <i className="fa fa-youtube-play social-icon pr-lg-0" />
                      </a>
                      <a href="https://www.instagram.com/grandpaapecountryclubofficial">
                        <i className="fa fa-instagram social-icon pr-lg-0" />
                      </a>
                      <a href="https://discord.com/invite/gacc">
                        <i className="fa fa-discord-alt social-icon pr-lg-0" />
                      </a>
                      <a href="https://twitter.com/GrandpaApeCC">
                        <i className="fa fa-twitter social-icon pr-lg-0" />
                      </a>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-6">
                      <p className="copyright text-right">
                        <span className="copy-left">© 2022 Grandpa Ape Country Club</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="container-fluid m-0 p-0">
              <span className="last-line" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Mutants;

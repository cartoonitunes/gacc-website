import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectGAKC } from "../redux/blockchain/blockchainActions";
import { fetchKittenData } from "../redux/data/dataActions";
import { Network, Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";
import { DelegateCash } from "delegatecash";
import '../styles/style.css'

require('dotenv').config();

function KittenClub() {

  const dispatch = useDispatch();
  const p = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ALCHEMY_URL, 'any');
  const dc = new DelegateCash(p);
  const blockchain = useSelector((state) => state.blockchain);
  // eslint-disable-next-line
  const data = useSelector((state) => state.data);
  const [feedback, setFeedback] = useState("");
  const [apeSelection, setApeSelection] = useState(null);
  const [miningLunagemNft, setMiningLunagemNft] = useState(false);
  const [callingKittenNft, setCallingKittenNft] = useState(false);
  const settings = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
  };
  const alchemy = new Alchemy(settings);


  const lunagemActionCaller = async (numLunagems=null, apeIds=null, pullIds=false) => {
    if (data.kittenCallActive) {
      callKittens(apeIds, pullIds)
  }
  };

  const fetchData = async (account) => {
    if (data.kittenCallActive) {
      dispatch(fetchKittenData(account));
    }
  }

  const getVaultsFromDelegations = async (account) => {
    let vaults = []
    const delegationsByDelegate = await dc.getDelegationsByDelegate(account);
    delegationsByDelegate.forEach((delegation, i) => vaults.push(delegation['vault']));
    let uniqueVaults = vaults.filter(onlyUnique);
    return uniqueVaults
  }

  const lunagemLabels = () => {
    if (data.kittenCallActive) {
      return (
        {
          'title': 'CALL A KITTEN',
          'title_two': '',
          'status': 'Open',
          'subTitle': 'Connect your wallet to call a Kitten using a Lünagem.',
          'connectedSubTitle': ``,
          'connectedSubTitleTwo': ``
        }
      )
    }
    else {
      return({'title': 'GRANDPA APE KITTEN CLUB',})
    }
  };

  const processErrorMessage = (errorMessage) => {
    const endIndex = errorMessage.message.search('{')
    if (endIndex === -1) {
      return('Insufficient Funds to Mint.')
    } else {
      let err_message = errorMessage.message.substring(0, endIndex)
      let execution = 'execution reverted: '
      let executionIndex = errorMessage.message.indexOf(execution)
      if (executionIndex === -1) {
        let cleaned_error = err_message.replace('Internal JSON-RPC error.','')
        return(cleaned_error);
      }
      else {
        let cleaned_error = errorMessage.message.slice(executionIndex + execution.length).replace('Internal JSON-RPC error.','').replace('"', '').replace('}', '')
        return(cleaned_error);
      }
    }
  }

  async function getOwnedNfts(addresses, contractAddress, checkMineStatus=true) {
    let res = [];
    for (const address of addresses) {
      let pageKey = 'abc123';
      let nextPageKey = 'abc123'
      while (pageKey) {
        pageKey = nextPageKey;
        let response = await alchemy.nft.getNftsForOwner(
          address,
          {
            contractAddresses: [contractAddress],
            pageSize: 100,
            pageKey: pageKey,
            omitMetadata: true
          }
        );
        await new Promise(r => setTimeout(r, 1000));
        response.ownedNfts.forEach(function (nftResp) {
          let tokenId = parseInt(nftResp.tokenId);
          if (contractAddress === process.env.REACT_APP_GACC_ADDRESS) {
            if (checkMineStatus === true) {
              blockchain.lunagemSmartContract.methods.grandpaMines(tokenId).call().then((isUsed) => {
                if (!isUsed) {
                  res.push(tokenId);
                }
              })
            }
            else {
              res.push(tokenId);
            }
          }
          else if (contractAddress === process.env.REACT_APP_LUNAGEM_ADDRESS) {
            blockchain.kittenSmartContract.methods.lunagemCalls(tokenId).call().then((isUsed) => {
              if (!isUsed) {
                res.push(tokenId);
              }
            })
          }
        });
        nextPageKey = response.pageKey;
      }
    }
    
    return res
  }

  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }

  async function getKittensToReveal(receipt) {
    let transferEvents = receipt.events.Transfer;
    let kittensIDs = []
    transferEvents.forEach(function (e) {
      if (e.address === process.env.REACT_APP_KITTEN_ADDRESS) {
        kittensIDs.push(e.returnValues.tokenId);
      }
    });
    return kittensIDs
  }

  async function revealKittenMetadata(address, receipt) {
    let kittenIds = await getKittensToReveal(receipt);
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address, tokens: kittenIds})
    };
    const response = await fetch(process.env.REACT_APP_BASE_API_URL + '/api/kittens/claim_tokens', requestOptions);
    const result = await response;
    return result
  }

  const callKittens = async (lunagemIds, pullIds) => {
    setFeedback(`Kitten call vetting in progress...`);
    let vaults = await getVaultsFromDelegations(blockchain.account);
    let vault = '0x0000000000000000000000000000000000000000'
    if (vaults.length > 0) {
      vault = vaults[0];
    }
    vaults.push(blockchain.account);
    if (pullIds) {
      lunagemIds = await getOwnedNfts(vaults, process.env.REACT_APP_LUNAGEM_ADDRESS);
      lunagemIds = lunagemIds.map(Number);
      setFeedback(`Found ${lunagemIds.length} Lünagem(s) to call Kittens with...`);
    }
    else {
      lunagemIds = lunagemIds.split(',').map(Number);
      lunagemIds = lunagemIds.filter(onlyUnique);
    }
    
    setCallingKittenNft(true);
    if (lunagemIds.length === 0) {
      if (pullIds) {
        setFeedback(`All of your Lünagems have been used!`);
        setCallingKittenNft(false);
        return
      }
      else {
        setFeedback(`Lüngem IDs are required...`);
        setCallingKittenNft(false);
        return
      }
    }
    if (lunagemIds.some((e) => e < 0) || lunagemIds.some((e) => e > 2221)) {
        setFeedback(`Lüngem IDs need to be between 0 and 2221`);
        setCallingKittenNft(false);
        return
    }
    else {
      setFeedback(`Performing the ancient Kitten Call...`);
        blockchain.kittenSmartContract.methods
      .callKitten(vault, lunagemIds)
      .call({
        to: process.env.REACT_APP_KITTEN_ADDRESS,
        from: blockchain.account
      })
      .then(() => {
        blockchain.kittenSmartContract.methods
        .callKitten(vault, lunagemIds)
        .send({ 
          to: process.env.REACT_APP_KITTEN_ADDRESS,
          from: blockchain.account
        })
        .then((receipt) => {
          setFeedback(
            `Flipping your new kitten metadata!...`
          );
          let transactionHash = receipt.transactionHash;
          revealKittenMetadata(blockchain.account, receipt).then((response) => {
            console.log(response);
            if (response.status === 200) {
              setFeedback(
                `Congratulations, you have successfully called ${lunagemIds.length} GAKC kitten(s)!`
              );
            }
            else {
              setFeedback(
                `Congratulations, you have successfully called ${lunagemIds.length} GAKC kitten(s)! We had an issue flipping metadata. Can you please reach out to Discord support with the following transaction hash: ${transactionHash}.`
              );
            }
            setCallingKittenNft(false);
            fetchData(blockchain.account);
          })
          .catch(err => {
            setFeedback(
              `Congratulations, you have successfully called ${lunagemIds.length} GAKC kitten(s)! We had an issue flipping metadata. Can you please reach out to Discord support with the following transaction hash: ${transactionHash}.`
            );
            setCallingKittenNft(false);
            fetchData(blockchain.account);
          })
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setCallingKittenNft(false);
        });
      })
      .catch(err => {
        console.log(err)
        setFeedback(processErrorMessage(err))
        setCallingKittenNft(false);
      });
    }
  }


  const titleText = () => {
    return (
      <div className="d-flex justify-content-center">
        {(blockchain.account === "" || blockchain.kittenSmartContract === null) ? (
        <p className="common-p mint-subtitle">{lunagemLabels()['subTitle']}</p>): (
          <p className="common-p mint-subtitle">{lunagemLabels()['connectedSubTitle']}</p>
        )}
        </div>
    )
  }


  const connectAndMintButton = () => {
    return (
      <div>
        <div>
            <p className="common-p text-break mb-3">
            Kitten calling has not yet commenced. Check out the Lünagem collection on OpenSea, you'll need one to call a Kitten.
            </p>
            </div>
            <div className="d-flex justify-content-center">
            <a href="https://opensea.io/collection/lunagems">
                <button className="btn btn-primary bayc-button" type="button" style={{backgroundColor: '#977039', borderBottomColor: 'black', borderRightColor: 'black', borderWidth: '5px'}}>
                BUY A LÜNAGEM ON OPENSEA
                </button>
            </a>
            </div>
        </div>
      )
    // if (blockchain.account === "" || blockchain.kittenSmartContract === null) {
    //   return (
    //     <div className="d-flex justify-content-center"><button 
    //     className="btn btn-primary bayc-button" 
    //     type="button"
    //     style={{backgroundColor: '#977039', borderBottomColor: 'black', borderRightColor: 'black', borderWidth: '5px'}}
    //     onClick={(e) => {
    //       e.preventDefault();
    //       dispatch(connectGAKC());
    //       setFeedback(data.errorMsg);
    //       getData();
    //     }}
    //     >
    //       CONNECT WALLET
    //     </button></div>
    //   )
    // }
    // else if (data.kittenCallActive) {
    //   return (
    //   <div className="d-flex justify-content-center">
    //     <form>
    //       <div className="form-group">
    //         <label htmlFor="exampleInputEmail1">Enter Lünagem IDs to Call a Kitten</label>
    //         <input className="form-control bayc-button" name='apeId' id='apeId' placeholder="1, 2, 3" onChange={(e) => setApeSelection(e.target.value)}></input>
    //       </div>
    //       <button type="submit" className="btn btn-primary bayc-button " style={{backgroundColor: '#977039', borderBottomColor: 'black', borderRightColor: 'black', borderWidth: '5px'}} disabled={miningLunagemNft ? 1 : 0}
    //         onClick={(e) => {
    //           e.preventDefault();
    //           if (document.getElementById("apeId").value) {
    //             lunagemActionCaller(null, document.getElementById("apeId").value, false);
    //           }
    //           getData();
    //         }}>Call</button>
    //         <button type="submit" className="btn btn-primary bayc-button " style={{backgroundColor: '#977039', borderBottomColor: 'black', borderRightColor: 'black', borderWidth: '5px'}} disabled={callingKittenNft ? 1 : 0}
    //           onClick={(e) => {
    //             e.preventDefault();
    //             lunagemActionCaller(null, [], true);
    //             getData();
    //           }}>Call All In Wallet</button>
    //     </form>
    //   </div>
    //   )
    // }
    // else {
    //   return (
    //   <div>
    //     <div>
    //         <p className="common-p text-break mb-3">
    //         Kitten calling has not yet commenced. Check out the Lünagem collection on OpenSea, you'll need one to call a Kitten.
    //         </p>
    //         </div>
    //         <div className="d-flex justify-content-center">
    //         <a href="https://opensea.io/collection/lunagems">
    //             <button className="btn btn-primary bayc-button" type="button" style={{backgroundColor: '#977039', borderBottomColor: 'black', borderRightColor: 'black', borderWidth: '5px'}}>
    //             BUY A LÜNAGEM ON OPENSEA
    //             </button>
    //         </a>
    //         </div>
    //     </div>
    //   )
    // }
  }

  const getData = () => {
    if (blockchain.account !== "" && blockchain.kittenSmartContract !== null) {
      // dispatch(fetchLunagemData());
      dispatch(fetchKittenData());
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
                <div className="app"  style={{backgroundImage: `url(${process.env.PUBLIC_URL + '/assets/images/starry.jpg'})`, backgroundColor: 'black'}}>
                <nav id="nav" className="navbar navbar-expand-md navbar-light" >
                    <a href="/" id="bayc-brand" className="navbar-brand"><img src={process.env.PUBLIC_URL + '/assets/images/gakc_banner_white.png'} className="d-inline-block align-top" alt="bored ape logo" width="auto" height="70px" /></a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span className="" role="button" ><i className="fa fa-bars" aria-hidden="true" style={{color:"#ffffff"}}></i></span></button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <div className="navbar-nav" id="nav-bar">
                        <a id="nav-link" title="BUY A GACC" href="/#buy-a-gacc" className="nav-link">BUY A GACC</a>
                        <a id="nav-link" title="ROADMAP" href="/#roadmap" className="nav-link">ROADMAP</a>
                        <a id="nav-link" title="TEAM" href="/#team" className="nav-link">TEAM</a>
                        <div className="nav-item dropdown" style={{color: '#f9edcd'}}>
                          <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style={{color: 'white'}}>MEMBERS</a>
                            <div aria-labelledby="nav-dropdown" className="dropdown-menu home-dropdown" style={{margin: '0px', color: 'white', backgroundColor: 'black'}}>
                                <a id="nav-link" title="MACC" href="/macc" className="dropdown-item active"  style={{color: 'white', backgroundColor: 'black'}}>MACC</a>
                                <a id="nav-link-active" title="Kitten Club" href="/kitten-club" className="dropdown-item"  style={{color: 'white', backgroundColor: 'black'}}>KITTEN CLUB</a>
                                <a id="nav-link" title="MERCH" href="/#merch" className="dropdown-item"  style={{color: 'white', backgroundColor: 'black'}}>MERCH</a>
                            </div>
                          </div>
                        </div>
                        <div className="navbar-nav" id="nav-social">
                        <a href="https://discord.com/invite/gacc">
                        <i className="fa fa-discord-alt social-icon pr-lg-0" />
                        </a>
                        <a href="https://twitter.com/GrandpaApeCC">
                        <i className="fa fa-twitter social-icon pr-lg-0" />
                        </a>
                        <a href="https://www.instagram.com/grandpaapecountryclubofficial">
                        <i className="fa fa-instagram social-icon pr-lg-0" />
                        </a>
                    </div>
                    </div>
                </nav>
                <div>
                    <div
                    style={{
                        transition: "opacity 400ms ease 0s, transform 400ms ease 0s",
                        transform: "none",
                        opacity: 1
                    }}
                    >
                    <div className="common-container">
                        <div className="mb-4 mb-lg-5 container">
                        <div className="row">
                            <div className="px-0 col-12">
                            <img
                                src='https://cdn.discordapp.com/attachments/937225793602474005/1097800393964146728/IMG_2832.png'
                                className="img-fluid px-0"
                                useMap="#mutant"
                                alt=""
                            />
                            </div>
                        </div>
                        </div>
                        <div className="px-4 container">
                        <div className="mb-5 row">
                            <div className="mb-4 mb-lg-0 col-lg-7 col-12">
                            <h1 className="common-title mb-3">
                            THE<br />GRANDPA APE KITTEN CLUB
                            </h1>
                            <p className="common-p">
                            On their third year of adventuring through the depths of the unexplored world, the apes discovered an alien utopia of wonders. A world filled with adorable kittens of all shapes and colors, with magical powers and hearts that instantly filled their longing souls with warmth.
                            </p>
                            <p className="common-p">
                            The kittens proved to be kind and generous, immediately taking to the wandering apes. The apes shared their stories to thousands of perked up ears. Word traveled fast through the land of the kittens, reaching areas even seldom visited by their own kind.
                            </p>
                            <p className="common-p mb-0">
                            Together the apes and kittens felt renewed. Empowered by the magic of the kitten realm, the apes thirst for adventure was fulfilled, their curiosity for the unknown repeatedly quenched. Kittens felt comfort in the apes, as if a long lost friend had been returned. Together the Grandpas and the kittens built the Grandpa Ape Kitten Club.
                            </p>
                            </div>
                            <div className="col-lg-5 col-12">
                            <img
                                src={process.env.PUBLIC_URL + '/assets/images/kitten_promo_1.jpg'}
                                className="img-fluid rounded"
                                alt=""
                            />
                            </div>
                        </div>
                        <div className="mb-5 row">
                            <div className="mb-4 mb-lg-0 col-lg-7 col-12">
                            <h2 className="d-flex common-sub-title font-italic mb-2 bayc-color">
                            LÜNAGEMS
                            </h2>
                            <p className="common-p">
                            Upon returning to the ape country, the adventurers and kittens inspired apes to explore the unknown. However, it turned out that happening upon the Land of Kittens was not so simple.
                            </p>
                            <p className="common-p">
                            It was then when the kittens taught the apes how to summon a kitten from the land. An ancient call, an enchantment of sorts, which seems unworldly to the apes, would summon a kitten to their side. To work, a unique resource, found deep within the mountains, was needed: a Lünagem.
                            </p>
                            <p className="common-p">
                            It was this day, when apes and kittens were forever bounded — their worlds united and the future looked bright. Magic filled the air as kittens brought unseen beauty and discovery with their abilities.
                            </p>
                            <p className="common-p">
                            The joy was, however, not shared by all. The companionship that Mutant apes felt for their kin had begun to wane. A longing for a kitten companion had filled their ever-waking thoughts.
                            </p>
                            <p className="common-p mb-0">
                            The laboratory on Mount Naro heard their calls…
                            </p>
                            </div>
                            <div className="my-auto my-lg-0 col-lg-5 col-12 order-lg-first">
                                    <img
                                        src='https://cdn.discordapp.com/attachments/935552546158817331/1098049698159398994/image.png'
                                        className="img-fluid"
                                        alt=""
                                        />
                            </div>
                        </div>
                        <div className="mb-5 row">
                            <div className="mb-4 mb-lg-0 col-lg-7 col-12">
                            <h2 className="d-flex common-sub-title font-italic mb-2 bayc-color">
                            LÜNAGEM DISTRIBUTION &amp; PRICING
                            </h2>
                            <p className="common-p">
                                For a limited time, each and every club member will be able to
                                mine a Lünagem NFT from the Grandpa Ape Kitten Club.
                                Mining the token is free; you'll only have to pay gas.
                            </p>
                            <p className="common-p">
                                In order to mine a Lünagem, one must
                                have a Grandpa Ape in their wallet. You can mine
                                one Lünagem NFT for each Grandpa Ape that you own. Once a Lünagem
                                has been mined by a Grandpa Ape, that Grandpa Ape cannot be used
                                to mine again.
                            </p>
                            <p className="common-p">
                                Once the mining window is closed, there will be a public sale
                                for the remaining Lünagems. This mining phase will require owning a Grandpa Ape. 
                                The mint price for a Lünagem will be 0.03 ETH. The public sale 
                                will last for 24 hours before it is closed forever.
                            </p>
                            <p className="common-p mb-0">
                                The ending supply of Lünagems, with a maximum of 5,000, will determine the maximum supply of Grandpa Ape Kittens.
                            </p>
                            </div>
                            <div className="col-lg-5 col-12">
                                    <img
                                        src='https://cdn.discordapp.com/attachments/937225793602474005/1097640752139481210/image0.gif'
                                        className="img-fluid"
                                        alt=""
                                        />
                            </div>
                        </div>
                        <div className="mb-5 row">
                            <div className="mb-4 mb-lg-0 col-lg-7 col-12">
                            <div className="mb-0">
                                <h2 className="d-flex common-sub-title font-italic mb-2 bayc-color">
                                THE GRANDPA APE KITTEN CLUB SPECS
                                </h2>
                                <p className="common-p">
                                There are up to 5,000 total Grandpa Ape Kitten Club (GAKC) NFTs. The total supply will depend on the supply of Lünagems. After the Lünagem mining phase, 
                                the kitten calling phase will commence. During this never-ending phase, a Lünagem can be used 
                                to call a random kitten from the land of the kittens. Using a Lünagem will destroy the Lünagem, 
                                burning it from the collection and removing it from your wallet.
                                </p>
                                <p className="common-p mb-0">
                                Kittens come with a variety of traits, some rarer than others. A few lucky Lünagem callers will make contact with a legendary kitten, mystical and ancient.
                                </p>
                            </div>
                            </div>
                            <div className="my-auto my-lg-0 col-lg-5 col-12 order-lg-first">
                            <img
                                src={process.env.PUBLIC_URL + '/assets/images/kitten_promo_2.jpg'}
                                className="img-fluid rounded"
                                alt="kitten_promo"
                            />
                            </div>
                        </div>
                        <hr className="gray-line mb-5" />
                        <div className="mb-5 row">
                            <div className="col-12">
                            <div className="d-flex justify-content-center col">
                                <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
                                <div className="mb-5  row">
                                    <div className="col">
                                    <div className="d-flex justify-content-center w-100 col-12">
                                        <div className="MuiPaper-root MuiCard-root jss12 MuiPaper-outlined MuiPaper-rounded" style={{opacity: 1, transform: 'none', transition: 'opacity 291ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 194ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'}}>
                                        <div className="MuiCardContent-root">
                                            <h2 className="d-flex justify-content-center common-sub-title"><center>{lunagemLabels()['title']}</center></h2>
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
                            </div>
                        </div>
                        <div className="mb-5 row">
                            <div className="col-12">
                            <div className="d-flex justify-content-center">
                                <p className="common-p text-center text-break mb-0">
                                <span className="bold-text">
                                    VERIFIED LÜNAGEM SMART CONTRACT ADDRESS:&nbsp;
                                </span>
                                <a
                                    title="0xAAb6E53554e56513FE5825738C950Bd3812B38c6"
                                    href="https://etherscan.io/address/0xAAb6E53554e56513FE5825738C950Bd3812B38c6"
                                    className="link"
                                >
                                    0xAAb6E53554e56513FE5825738C950Bd3812B38c6
                                </a>
                                </p>
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
                </div>
                <div className="col-12 col-lg-4 order-first">
                  <img className="img-fluid footer-logo" src={process.env.PUBLIC_URL + '/assets/images/GACC_WHITE_2.png'} alt="logo" />
                </div>
                <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
                  <div className="row">
                    <div className="text-lg-right col-sm-12 col-12">
                      <a href="https://discord.com/invite/gacc">
                        <i className="fa fa-discord-alt social-icon pr-lg-0" />
                      </a>
                      <a href="https://twitter.com/GrandpaApeCC">
                        <i className="fa fa-twitter social-icon pr-lg-0" />
                      </a>
                      <a href="https://www.instagram.com/grandpaapecountryclubofficial">
                        <i className="fa fa-instagram social-icon pr-lg-0" />
                      </a>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-6">
                      <p className="copyright text-right">
                        <span className="copy-left">© 2023 Grandpa Ape Country Club</span>
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
 
export default KittenClub;
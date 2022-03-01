import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import './styles/maccStyle.css'


function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const serumType = 1;
  const apeNum = 4;
  const [feedback, setFeedback] = useState("What mutation will your GACC have?");
  const [claimingNft, setClaimingNft] = useState(false);

  const claimNFTs = (_amount) => {
    if (_amount <= 0) {
      return;
    }
    setFeedback("Mutating your GACC...");
    setClaimingNft(true);
    blockchain.smartContract.methods
      .mutateApeWithSerum(serumType, apeNum)
      .send({
        from: blockchain.account
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("It seems the transaction was cancelled.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        setFeedback(
          "Woohoo! You just mutated your GACC! Visit Opensea.io to view your mutated NFT!"
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

  const getData = () => {
    console.log(blockchain.smartContract)
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData());
      console.log(data.totalSupply);
    }
  };

  useEffect(() => {
    getData();
  }, [blockchain.account]);


  return (
    <div>
      <div id="root">
        <div className="app">
          <nav id="nav" className="navbar navbar-expand-md navbar-light sticky-top">
            <a href="#/" id="bayc-brand" className="navbar-brand">
              <img src="https://ik.imagekit.io/l7p0svlzgvd/gacc_logo_white_B26qrGJUj.png" className="d-inline-block align-top" alt="bored ape logo" width="auto" height="75px" />
            </a>
            <button aria-controls="responsive-navbar-nav" id="nav-toggle" type="button" aria-label="Toggle navigation" className="navbar-dark navbar-toggler collapsed">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="navbar-collapse collapse">
              <div className="navbar-nav" id="nav-bar">
                <a id="nav-link" title="BUY AN APE" href="#/home#buy-an-ape" className="nav-link">BUY AN APE</a>
                <a id="nav-link" title="ROADMAP" href="#/home#roadmap" className="nav-link">ROADMAP</a>
                <a id="nav-link" title="TEAM" href="#/home#team" className="nav-link">TEAM</a>
                <a id="nav-link" title="GALLERY" href="#/gallery" data-rb-event-key="/gallery" className="nav-link">GALLERY</a>
                <a id="nav-link" title="PROVENANCE" href="#/provenance" data-rb-event-key="/provenance" className="nav-link">PROVENANCE</a>
                <div className="nav-item dropdown">
                  <a aria-haspopup="true" aria-expanded="false" id="nav-dropdown" href="#" className="dropdown-toggle nav-link" role="button">MEMBERS</a>
                </div>
              </div>
              <div className="navbar-nav" id="nav-social">
                <a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg">
                  <i className="fa fa-youtube-play social-icon pr-lg-0" />
                </a>
                <a href="https://www.instagram.com/grandpaapecountryclub">
                  <i className="fa fa-instagram social-icon pr-lg-0" />
                </a>
                <a href="https://discord.gg/uHXUsYuZ">
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
                      <img src="https://ik.imagekit.io/bayc/assets/mayc-hero.jpg" className="img-fluid px-0" useMap="#mutant" alt=""/>
                    </div>
                  </div>
                </div>
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
                            <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/ASTRONAUT_xtactOiZGcq.jpg" alt="mutant-1" aria-label="mutant-1" style={{borderRadius: '5px'}} />
                          </div>
                          <div className="pb-2 pl-2 col-6">
                            <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/SUSHI_OPxFeVzqD.jpg" alt="mutant-2" aria-label="mutant-2" style={{borderRadius: '5px'}} />
                          </div>
                        </div>
                        <div className="row">
                          <div className="pt-2 pr-2 col-6">
                            <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/RAINBOW_GRILL_xwe6HMyEI.jpg" alt="mutant-3" aria-label="mutant-3" style={{borderRadius: '5px'}} />
                          </div>
                          <div className="pt-2 pl-2 col-6">
                            <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/deathbot_0ggqQrsQn.jpg" aria-label="mutant-4" style={{borderRadius: '5px'}} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="gray-line mb-5" />
                  <div className="mb-5  row">
                    <div className="col-12">
                      <h1 className="common-title mb-3">SERUMS
                        <span className="bayc-color">(FOR GACC MEMBERS)</span>
                      </h1>
                    </div>
                    <div className="mb-4 mb-lg-5 col-lg-7 col-12">
                      <p className="common-p">One way to create a MUTANT is when a Grandpa Ape ingests a vial of mutant serum. There are three tiers of mutant serum vials: M1, M2, and Mega Mutant (M3). A snapshot of all Grandpa Ape token holders was taken at 4pm ET on 8/28/21, and all mutant serums that will exist have been airdropped at a random distribution to corresponding wallets.</p>
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
                          <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/3748_f7Oesc6B_.png" alt="" style={{borderRadius: '5px'}} />
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
                      <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/M1_3748_Nc70YtxYa.jpg" alt="" style={{borderRadius: '5px'}} />
                      <p className="mt-2 mb-0 text-center">M1 Aslan</p>
                    </div>
                    <div className="col-lg-3 col-6 order-lg-3">
                      <img className="img-fluid" src="https://ik.imagekit.io/l7p0svlzgvd/M2_3748_pNQmWkmsA.jpg" alt="" style={{borderRadius: '5px'}} />
                      <p className="mt-2 mb-0 text-center">M2 Aslan</p>
                    </div>
                  </div>
                  <hr className="gray-line mb-5" />
                  <div className="mb-5  row">
                    <div className="mb-5 mb-lg-0 col-lg-7 col-12 order-lg-last">
                      <h1 className="common-title mb-3">DISTRIBUTION &amp; PRICING</h1>
                      <p className="common-p text-justify">A total of 5,000 Mutant Serums have been airdropped to all GACC token holders.</p>
                      <p className="common-p text-justify">5,000 Mutant Apes will be available to mint in a public Dutch Auction. The price to mint a Mutant will start ??? ETH, and gradually reduce to .01 ETH over the course of 3 hours. This is to allow the community to set a fair starting price and, hopefully, avoid any gas war.</p>
                      <p className="common-p text-justify">At the time of minting, Mutant Apes will be unrevealed. Once the public sale has concluded, a randomized starting index will be set and all Mutant Apes will be revealed. This is to prevent anyone, including the founders, from knowing which mutant will be minted during the sale.</p>
                      <p className="common-p text-justify mb-0">After the starting index is set and the mutants are revealed, GACC members will be able to begin mutating their apes with serums here on the site.</p>
                    </div>
                    <div className="mb-0 my-lg-auto col-lg-5 col-12 offset-lg-0">
                      <img src="https://ik.imagekit.io/bayc/assets/mystery-serums.gif" className="img-fluid rounded" alt="" />
                    </div>
                  </div>
                  <hr className="gray-line mb-5" />
                  <div className="mb-5  row">
                    <div className="mb-5 mb-lg-0 col-lg-7 col-12">
                      <h1 className="common-title mb-3">MUTATION
                        <span className="bayc-color">(FOR GACC MEMBERS)</span>
                      </h1>
                      <p className="common-p text-justify">GACC token holders will be able to begin applying their airdropped serums to their Grandpa Apes upon completion of the public sale. The exact time will be announced on Twitter (
                        <a href="https://twitter.com/GrandpaApeCC" className="link">@GrandpaApeCC</a>) and in our
                        <a href="https://discord.gg/uHXUsYuZ" className="link">Discord</a>. Applying a serum to a Grandpa Ape will burn that serum, and result in a MUTANT NFT which may retain aspects of the original Grandpa Ape. The Grandpa Ape NFT will not be harmed.
                      </p>
                      <p className="common-p bold-text text-justify">THERE IS NO SET TIME LIMIT FOR APPLYING SERUMS.</p>
                      <p className="common-p text-justify mb-0">Remember, a Grandpa Ape can only be mutated via a vial of a certain type once. We will introduce a method for checking whether a Grandpa Ape has been exposed to a given vial type.</p>
                    </div>
                    <div className="my-auto col-lg-5 col-12 offset-lg-0">
                      <img src="https://ik.imagekit.io/bayc/assets/serum-machine.gif" className="img-fluid rounded" alt=""/>
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
                                <h2 className="d-flex justify-content-center common-sub-title">CONNECT WALLET</h2>
                                <hr className="white-line" />
                                {/* <div>
                                  <p className="common-p">You need to connect your wallet before you can mutate an ape.</p>
                                </div>
                                <div>
                                Serum: <input value={serumType} type="text" />
                                </div>
                                <div >
                                GACC: <input value={apeNum} type="text"  />
                                </div> */}
                                {/* <div className="d-flex justify-content-center">
                                {blockchain.account === "" || blockchain.smartContract === null ? (
                                  <>
                                  <button 
                                  className="bayc-button " 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    dispatch(connect());
                                    getData();
                                  }}>
                                    CONNECT WALLET
                                  </button>
                                  {blockchain.errorMsg !== "" ? (
                                    <>
                                        {blockchain.errorMsg}
                                    </>
                                  ) : null}</>
                                  ) : (
                                    <button 
                                  className="bayc-button " 
                                  type="button"
                                  disabled={claimingNft ? 1 : 0}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    claimNFTs(1);
                                    getData();
                                  }}
                                  >
                                    {claimingNft ? "Mutating..." : "Mutate 1 GACC"}
                                    </button>
                                  )}
                                </div> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
                      <div className="mb-5  row">
                        <div className="col">
                          <div className="d-flex justify-content-center">
                            <p className="common-p text-center text-break mb-0">
                              <span className="bold-text">VERIFIED SMART CONTRACT ADDRESS:</span>
                              <a title="MACC CONTRACT HERE" href="LINK TO ETHERSCAN" className="link">MACC CONTRACT HERE</a>
                            </p>
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
                </div>
                <div className="col-12 col-lg-4 order-first">
                  <img className="img-fluid footer-logo" src="https://ik.imagekit.io/l7p0svlzgvd/gacc_logo_white_B26qrGJUj.png" alt="logo" />
                </div>
                <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
                  <div className="row">
                    <div className="text-lg-right col-sm-12 col-12">
                      <a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg">
                        <i className="fa fa-youtube-play social-icon pr-lg-0" />
                      </a>
                      <a href="https://www.instagram.com/grandpaapecountryclub">
                        <i className="fa fa-instagram social-icon pr-lg-0" />
                      </a>
                      <a href="https://discord.gg/uHXUsYuZ">
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

export default App;

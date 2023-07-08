import React, { useState } from "react";
import '../styles/style.css'
const ranks = require('../ranks/gacc');


function Home () {

  const [apeSelection, setApeSelection] = useState(null);

  function isPositiveInteger(n) {
      return n >>> 0 === parseFloat(n);
  }

  function imageToShow() {
    let token_id = Number(apeSelection) + 1;
    if (apeSelection && isPositiveInteger(apeSelection) && token_id <= 5000) {
      return (
        <div className="my-auto col-lg-4 col-12 offset-lg-1">
          <div className="imageItem">
        <img className="img-fluid w-100" style={{borderRadius: '5px'}} src={`https://ipfs.io/ipfs/QmY6CdW5UGJPu76qm6SkBBiWPBcnH7sr4JMBcA9mjuaNSU/${token_id}.png`} alt="mystery token" />
        <span className="caption">{`Rank #${ranks[apeSelection]}`}</span>
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
                  <div className="nav-item dropdown" style={{color: '#f9edcd'}}>
                    <a className="nav-link dropdown-toggle black-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style={{color: 'black'}}>MARKETPLACES</a>
                        <div aria-labelledby="nav-dropdown" className="dropdown-menu home-dropdown" style={{margin: '0px', color: 'black', backgroundColor: '#F9EDCD'}}>
                            <a id="nav-link" title="GACC" href="/gacc-marketplace" className="dropdown-item" style={{color: 'black'}}>GACC</a>
                            <a id="nav-link" title="SERUMS" href="/serum-marketplace" className="dropdown-item" style={{color: 'black'}}>SERUMS</a>
                            <a id="nav-link" title="MACC" href="/macc-marketplace" className="dropdown-item" style={{color: 'black'}}>MACC</a>
                        </div>
                        </div>
                </div>
                <div className="navbar-nav" id="nav-social"><a href="https://discord.com/invite/gacc"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a></div>
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
                              <p className="common-p mb-lg-0">The initial sale has sold out. To get your Grandpa Ape, check out the collection on our marketplace, or any other major NFT marketplace.</p>
                            </div>
                            <div className="m-auto col-lg-2 col-12 offset-lg-1">
                              <a href="/gacc-marketplace"><button className="bayc-button mint" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>VISIT THE MARKETPLACE</button></a>
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
                                 <label for="staticEmail2" className="common-p mb-2"  style={{color: 'black', fontWeight: 'bold'}}>Lookup Rarity</label>
                              <input className="form-control" name='apeId' id='apeId' placeholder="1" style={{textAlign: 'center'}} onChange={(e) => setApeSelection(e.target.value)}></input>
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
                              <div className="mx-auto col-lg-12 col-md-6 col-sm-12"><a href="https://discord.com/invite/gacc"><button className="bayc-button w-100" type="button" style={{backgroundColor: '#83D8FC', color: 'black'}}>DISCORD</button></a></div>
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
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>CARTOON</span> <span className="font-italic" style={{color: 'black'}}>ALL THINGS CODE&nbsp; <a href="https://twitter.com/cartoonitunes"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>DIEF</span> <span className="font-italic" style={{color: 'black', textAlign: 'left'}}>ALL THINGS FINANCE AND COMMUNICATIONS&nbsp; <a href="https://twitter.com/TheDiefCollect"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
                              <p className="common-p" style={{color: '#977039'}}><span className="bayc-color bold-text" style={{color: '#977039'}}>DARK</span> <span className="font-italic" style={{color: 'black'}}>ALL THINGS DESIGN&nbsp; <a href="https://twitter.com/StudioDarkk"><i className="fa fa-twitter" style={{color: 'black'}} /></a></span></p>
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
                                    <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/dief.png'} alt="dief" aria-label="dief" style={{borderRadius: '5px'}} />
                                  </div>
                                  <div className="pt-2 pl-2 col-6">
                                    <img className="img-fluid" src={process.env.PUBLIC_URL + '/assets/images/dark.png'} alt="dark" aria-label="dark" style={{borderRadius: '5px'}} />
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
                    <div className="text-lg-right col-sm-12 col-12"><a href="https://discord.com/invite/gacc"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a></div>
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



   

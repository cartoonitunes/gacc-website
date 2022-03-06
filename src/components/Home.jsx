import React from 'react';
import '../styles/style.css'

function Home () {
    return (
        <div>
        <div id="root">
          <div className="app" style={{backgroundColor: '#f9edcd'}}>
            <nav id="nav" className="navbar navbar-expand navbar-light sticky-top" style={{backgroundColor: '#f9edcd'}}>
              <a href="/home" id="bayc-brand" className="navbar-brand"><img src="https://ik.imagekit.io/l7p0svlzgvd/GACC-Banner-Black-V6_W5ylOt1lF.png" className="d-inline-block align-top" alt="bored ape logo" width="auto" height="75px" /></a>
              <button aria-controls="responsive-navbar-nav" id="nav-toggle" type="button" aria-label="Toggle navigation" className="navbar-dark navbar-toggler collapsed" data-toggle="collapse" data-target="#navbar"><span className="navbar-toggler-icon" /></button>
              <div className="navbar-collapse collapse" data-toggle="collapse">
                <div className="navbar-nav" id="nav-bar">
                  <a id="nav-link" title="BUY AN APE" href="/home#buy-an-ape" style={{color: 'black'}} className="nav-link">BUY AN APE</a><a id="nav-link" title="ROADMAP" href="/home#roadmap" style={{color: 'black'}} className="nav-link">ROADMAP</a><a id="nav-link" style={{color: 'black'}} title="TEAM" href="/home#team" className="nav-link">TEAM</a><a id="nav-link" style={{color: 'black'}} title="MACC" href="/macc" data-rb-event-key="/macc" className="nav-link">MACC</a>
                </div>
                <div className="navbar-nav" id="nav-social"><a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg"><i className="fa fa-youtube-play black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a><a href="https://discord.com/invite/gacc"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a></div>
              </div>
            </nav>
            <div>
              <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
                <div className="common-container">
                  <div className="mb-4 mb-lg-5 container">
                    <div className="row">
                      <div className="px-0 col-12"><img src="https://ik.imagekit.io/l7p0svlzgvd/GACC_COVER_osNu3h9kq7V.png" className="img-fluid px-0" useMap="#mutant" alt=""/></div>
                    </div>
                  </div>
                  <div className="px-4 mt-md-4 container">
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="mb-4 row">
                          <div className="mb-4 col-lg-7 col-12">
                            <h1 className="d-flex font-italic welcome-title mb-3" style={{color: 'black'}}>WELCOME TO THE<br />GRANDPA APE COUNTRY CLUB</h1>
                            <p className="common-p mb-0" style={{color: 'black'}}>GACC is a collection of 5,000 Grandpa Ape NFTs—unique digital collectibles living on the Ethereum blockchain. Your Grandpa Ape doubles as your Country Club membership card, and grants access to members-only benefits, the first of which is access to THE GREENS, a place where you can just hang with the boys. Future areas and perks can be unlocked by the community through roadmap activation.</p>
                          </div>
                          <div className="my-lg-auto col-lg-4 col-12 offset-lg-1">
                            <div className="common-container">
                              <div className="row">
                                <div className="pb-2 pr-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/Ape_1-scaled_rFyJJKpBkA.jpg" alt="ape1" aria-label="ape1" /></div>
                                <div className="pb-2 pl-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/Ape_4-scaled__PH2KKJgugJ.jpg" alt="ape2" aria-label="ape2" /></div>
                              </div>
                              <div className="row">
                                <div className="pt-2 pr-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/Ape_6-scaled_V7Saf7x7A.jpg" alt="ape3" aria-label="ape3" /></div>
                                <div className="pt-2 pl-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/Ape_2-scaled_ZzL7VWhBO.jpg" aria-label="ape4" /></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-5 row">
                      <div className="col">
                        <div id="buy-an-ape" className="buy-token-container">
                          <div className="bayc-bg p-4 m-auto row">
                            <div className="m-auto col-lg-3 col-12">
                              <h3 className="buy-ape-title">BUY AN APE</h3>
                            </div>
                            <div className="m-auto col-lg-4 col-12 offset-lg-1">
                              <p className="common-p mb-lg-0">The initial sale has sold out. To get your Grandpa Ape, check out the collection on OpenSea.</p>
                            </div>
                            <div className="m-auto col-lg-3 col-12 offset-lg-1"><a href="https://opensea.io/collection/grandpaapecountryclub"><button className="bayc-button mint" type="button">BUY AN APE ON OPENSEA</button></a></div>
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
                            </div>
                            <div className="my-auto col-lg-4 col-12 offset-lg-1"><img className="img-fluid w-100" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/Sneak_Peek_Preview_Au2e37ixO.gif" alt="mystery token" /></div>
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
                              <h2 className="common-title mb-3" style={{color: 'black'}}>ROADMAP ACTIVATIONS</h2>
                              <p className="common-p" style={{color: 'black'}}>We’re in this for the long haul.</p>
                              <p className="common-p" style={{color: 'black'}}>We’ve set up some goalposts for ourselves. Once we hit a target sell through percentage, we will begin to work on realizing the stated goal.</p>
                            </div>
                            <div className="mb-3 mb-md-0 col-lg-8 col-12">
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">10%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>We pay back our Grandpas.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">20%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>We mint 10 Grandpa Apes and airdrop them to random GACC holders.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">30%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>We airdrop 1 ETH to three random GACC holders.</p>
                                </div>
                              </div>

                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">40%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>We create a community wallet and fill it with 3 ETH.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">60%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>GACC Merch Store will launch and offer limited edition clothing and accessories.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">70%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>We add 3 more ETH to the Community Wallet.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">80%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>GACC Laboratory will open and begin testing Mutant Serums to be ready for an airdrop.</p>
                                </div>
                              </div>
                              <div className="mb-3 mb-lg-1 row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">90%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="text-decoration-line-through common-sub-p" style={{color: 'black'}}>We add 3 more ETH to the Community Wallet and GACC holders will decide on use and distribution amongst holders.</p>
                                </div>
                              </div>
                              <div className="row">
                                <div className="m-auto col-lg-1 col-2 offset-lg-1 offset-1">
                                  <p className="goal">100%</p>
                                </div>
                                <div className="m-auto col-lg-10 col-9">
                                  <p className="common-sub-p" style={{color: 'black'}}>The Grandpa Ape Kitten Club opens its doors for adoption.</p>
                                </div>
                              </div>
                            </div>
                            <div className="shirt-container mx-auto mb-5 my-lg-auto col-lg-3 col-12 offset-lg-1"><img className="shirt-mask" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/gacc-tee_bb3i6vBD7Jh.png" alt="shirt" /><img className="shirt" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/gacc-tee_bb3i6vBD7Jh.png" alt="shirt" /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="gray-line mb-5" />
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="row">
                          <div className="mb-4 mb-lg-0 col-lg-8 col-12">
                            <h2 className="common-title mb-3" style={{color: 'black'}}>COMMUNITY TOOLS</h2>
                            <p className="common-p mb-0" style={{color: 'black'}}>Here are some helpful tools created by the Grandpa Ape Country Club community. Please note that these are unofficial in nature. Every assignment of an ape's overall value or rarity is inherently subjective.</p>
                          </div>
                          <div className="m-lg-auto col-lg-3 col-12 offset-lg-1">
                            <div className="d-flex row">
                              <div className="mx-auto col-lg-12 col-md-6 col-sm-12"><a href="https://rarity.tools/grandpaapecountryclub"><button className="bayc-button w-100" type="button">RARITY.TOOLS</button></a></div>
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
                              <p className="common-p" style={{color: 'black'}}>GACC was created by two friends who set out to make some spiffy apes, test our skills, and try to build something (very silly).</p>
                              <p className="common-p" style={{color: 'black'}}><span className="bayc-color bold-text">ASLAN.</span> <span className="font-italic" style={{color: 'black', textAlign: 'left'}}>POKEMON MASTER. HARD DEGEN.</span></p>
                              <p className="common-p" style={{color: 'black'}}><span className="bayc-color bold-text">KUCHUYA.</span> <span className="font-italic" style={{color: 'black'}}>FORCED TO BE BROUGHT ALONG, BUT EXTREMELY HANDSOME.</span></p>
                            </div>
                            <div className="col-lg-4 col-12 offset-lg-1">
                              <div className="common-container">
                                <div className="row">
                                  <div className="pb-2 pr-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/aslan_6zbw_17Jlup.jpg" alt="aslan" aria-label="aslan" /></div>
                                  <div className="pb-2 pl-2 col-6"><img className="img-fluid" style={{borderRadius: '5px'}} src="https://ik.imagekit.io/l7p0svlzgvd/kuchuya_NSSE2ZSX5.jpg" alt="kuchuya" aria-label="kuchuya" /></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-5 row">
                      <div className="col">
                        <div className="d-flex justify-content-center">
                          <p className="common-p text-center text-break mb-0"><span className="bold-text" style={{color: 'black'}}>VERIFIED SMART CONTRACT ADDRESS: </span><a title="0x656B9E24de2e41a94A7dBbaeb3937777Cf34E448" href="https://etherscan.io/address/0x656b9e24de2e41a94a7dbbaeb3937777cf34e448" className="link">0x656B9E24de2e41a94A7dBbaeb3937777Cf34E448</a></p>
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
                  <img className="col-12 col-lg-8 order-first" src="https://ik.imagekit.io/l7p0svlzgvd/GACC-Banner-Black-V6_W5ylOt1lF.png" alt=""></img>
                  </div>
                  <div className="col-12 col-lg-4 order-first"><img className="img-fluid footer-logo" src="https://lh3.googleusercontent.com/n9HKrkgouw_PsI79-XDrbfeomqcpVDXwDuJTKykWQjxVIOitQeDongPHwap1SbsFb_X0mVyoNGzztJPIV776N0kmnFkApZa-JBxyMA=s0" alt="logo" /></div>
                  <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
                    <div className="row">
                    <div className="text-lg-right col-sm-12 col-12"><a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg"><i className="fa fa-youtube-play black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a><a href="https://discord.com/invite/gacc"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a></div>
                      <div className="col-lg-12 col-sm-6 col-6">
                        <p className="copyright text-right"><span className="copy-left">© 2022 Grandpa Ape Country Club</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container-fluid m-0 p-0"><span className="last-line" /></div>
            </footer>
          </div>
        </div>
      </div>);
}
 
export default Home;



   

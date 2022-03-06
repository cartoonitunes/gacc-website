import React from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/style.css'

function Landing () {
    const history = useHistory();
    return (
        <div>
        <div id="root">
          <div className="app" style={{backgroundColor: '#f9edcd'}}>
            <div>
              <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1, backgroundColor: '#f9edcd'}}>
                <div className="common-container">
                  <div className="container">
                    <div className="mb-5 mb-lg-0 row">
                      <div className="col-lg-4 col-12 offset-lg-4"><img className="img-fluid d-block mx-auto custom-logo pt-4" src="https://ik.imagekit.io/l7p0svlzgvd/GACC-Banner-Black-V6_W5ylOt1lF.png" alt="gacc header logo" width="300px" height="300px" /></div>
                      <div className="d-none d-lg-flex justify-content-end social-icons col-lg-4"><a href="https://www.youtube.com/channel/UCkiX36fFF4xekyRVTWDKIXg"><i className="fa fa-youtube-play black-social-icon pr-lg-0" /></a><a href="https://www.instagram.com/grandpaapecountryclubofficial"><i className="fa fa-instagram black-social-icon pr-lg-0" /></a><a href="https://discord.com/invite/gacc"><i className="fa fa-discord-alt black-social-icon pr-lg-0" /></a><a href="https://twitter.com/GrandpaApeCC"><i className="fa fa-twitter black-social-icon pr-lg-0" /></a></div>
                      <div className="px-0 col-12">
                        <div className="mb-4 mb-lg-5 container">
                          <div className="row">
                            <div className="px-0 col-12">
                                <img className="mx-auto w-100" src="https://ik.imagekit.io/l7p0svlzgvd/GACC_COVER_osNu3h9kq7V.png" alt=""></img>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4 col-12">
                        <div className="welcome pt-lg-4 row" style={{backgroundColor: '#f9edcd'}}>
                          <div className="px-0 ml-3 ml-lg-0 col-9">
                            <h1 className="common-title mb-3" style={{color: 'black'}}>WELCOME TO<br />THE GRANDPA APE<br />COUNTRY CLUB</h1>
                            <button className="bayc-button mb-4 w-100" style={{backgroundColor: '#83D8FC'}} type="button" onClick={() => history.push('/home')}>ENTER</button>
                          </div>
                          <div className="scroll m-auto pr-0 col-2">
                            <div className="rotate my-auto">← SCROLL DOWN</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <footer className="footer" style={{backgroundColor: '#f9edcd'}}>
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
                        <p className="copyright text-right"><span className="copy-left" style={{color: 'black'}}>© 2022 Grandpa Ape Country Club</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="container-fluid m-0 p-0"><span className="last-line" /></div>
            </footer>
          </div>
        </div>
      </div>
    );
}
 
export default Landing;

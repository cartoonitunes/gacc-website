import React from 'react';
import '../styles/style.css'

function GaccMarketplace () {
    return (
        <div>
            <nav id="nav" className="navbar navbar-expand-md navbar-light">
          <a href="/" id="bayc-brand" className="navbar-brand"><img src={process.env.PUBLIC_URL + '/assets/images/GACC_WHITE_2.png'} className="d-inline-block align-top" alt="gacc logo" width="auto" height="70px" /></a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span className="" role="button" ><i className="fa fa-bars" aria-hidden="true" style={{color:"#ffffff"}}></i></span></button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <div className="navbar-nav" id="nav-bar">
              <a id="nav-link" title="HOME" href="/" className="nav-link">HOME</a>
              <a id="nav-link" title="ROADMAP" href="/#roadmap" className="nav-link">ROADMAP</a>
              <a id="nav-link" title="TEAM" href="/#team" className="nav-link">TEAM</a>
              <a id="nav-link" title="$GRANDPA" href="/grandpacoin" className="nav-link" style={{color: 'white'}}>$GRANDPA</a>
              </div>
              <div className="navbar-nav" id="nav-social">
              <a href="https://discord.gg/8uuhkZ2TA2">
              <i className="fa fa-discord-alt social-icon pr-lg-0" />
              </a>
              <a href="https://twitter.com/GrandpaApeCC">
              <i className="fa fa-twitter social-icon pr-lg-0" />
              </a>
              <a href="https://www.instagram.com/grandpaapecountryclubofficial">
              <i className="fa fa-instagram social-icon pr-lg-0" />
              </a>
              <a href="mailto:thegrandpacoin@gmail.com">
              <i className="fa fa-envelope social-icon pr-lg-0" />
              </a>
          </div>
          </div>
      </nav>
            <iframe title="OANC" src="https://grandpaapechemistryclub.wlbl.xyz/"></iframe>
        </div>
    );
}
 
export default GaccMarketplace;

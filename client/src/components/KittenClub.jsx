import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectGAKC } from "../redux/blockchain/blockchainActions";
import { fetchKittenData } from "../redux/data/dataActions";
import '../styles/style.css'

require('dotenv').config();

function KittenClub() {

  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  // eslint-disable-next-line
  const data = useSelector((state) => state.data);
  const [feedback, setFeedback] = useState("");
  const [apeSelection, setApeSelection] = useState(null);
  const [mintingKittenNft, setMintingKittenNft] = useState(false);


  const kittenActionCaller = async (numKittens=null, apeIds=null) => {
    if (data.kittenAdoptionActive) {
        adoptKittens(apeIds)
    }
    else if (data.kittenMintActive) {
        mintKittens(numKittens)
    }
  };

  const kittenLabels = () => {
    if (data.kittenMintActive) {
      return (
        {
          'title': 'MINT A KITTEN',
          'title_two': 'Public Dutch Auction Status: ',
          'status': 'Open',
          'subTitle': 'Connect your wallet to mint a Kitten.',
          'connectedSubTitle': ``,
          'connectedSubTitleTwo': ``
        }
      )
    }
    else if (data.kittenAdoptionActive) {
      return (
        {
          'title': `ADOPT A KITTEN`,
          'title_two': '',
          'status': '',
          'subTitle': 'Connect your wallet to adopt a Kitten.',
          'connectedSubTitle': '',
          'connectedSubTitleTwo': ''
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
      let executionIndex = errorMessage.message.indexOf(execution)
      if (executionIndex === -1) {
        return(err_message);
      }
      else {
        let cleaned_error = errorMessage.message.slice(executionIndex + execution.length).replace('"', '').replace('}', '')
        return(cleaned_error);
      }
    }
  }

  const mintKittens = async (numKittens) => {
    let cost = 30000000000000000;
    cost = cost * numKittens
    let totalCostWei = String(cost);
    setFeedback(`Minting your Kitten(s)...`);
    setMintingKittenNft(true);
    blockchain.smartContract.methods
      .purchaseKittens(numKittens)
      .call({
        to: process.env.REACT_APP_KITTEN_ADDRESS,
        from: blockchain.account,
        value: totalCostWei
      })
      .then(() => {
        blockchain.smartContract.methods
        .purchaseKittens(numKittens)
        .send({ 
          to: process.env.REACT_APP_KITTEN_ADDRESS,
          from: blockchain.account,
          value: totalCostWei,
        })
        .then((receipt) => {
          setFeedback(
            `Congratulations and welcome to the Grandpa Ape Kitten Club!`
          );
          setMintingKittenNft(false);
          dispatch(fetchKittenData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingKittenNft(false);
        });
      })
      .catch(err => {
        let prettyCost = ((cost/1000000000000000000)).toFixed(3);
        let priceInfo = ` The price to mint ${numKittens} kittens is ${prettyCost}ETH.`
        setFeedback(processErrorMessage(err)+priceInfo)
        setMintingKittenNft(false);
      });
  }


  const adoptKittens = async (apeIds) => {
    setFeedback(`Kitten adoption vetting in progress...`);
    setMintingKittenNft(true);
    apeIds = apeIds.split(',').map(Number);
    if (apeIds.some((e) => e < 0) || apeIds.some((e) => e > 4999)) {
        setFeedback(`GACC IDs need to be between 0 and 4999`);
        setMintingKittenNft(false);
    }
    else {
        blockchain.smartContract.methods
      .adoptKitten(apeIds)
      .call({
        to: process.env.REACT_APP_KITTEN_ADDRESS,
        from: blockchain.account
      })
      .then(() => {
        blockchain.smartContract.methods
        .adoptKitten(apeIds)
        .send({ 
          to: process.env.REACT_APP_KITTEN_ADDRESS,
          from: blockchain.account
        })
        .then((receipt) => {
          setFeedback(
            `Congratulations, you have successfully adopted ${apeIds.length} kittens!`
          );
          setMintingKittenNft(false);
          dispatch(fetchKittenData(blockchain.account));
        })
        .catch(err => {
          const endIndex = err.message.search('{')
          setFeedback(err.message.substring(0, endIndex));
          setMintingKittenNft(false);
        });
      })
      .catch(err => {
        setFeedback(processErrorMessage(err))
        setMintingKittenNft(false);
      });
    }
  }


  const titleText = () => {
    return (
      <div className="d-flex justify-content-center">
        {(blockchain.account === "" || blockchain.smartContract === null) ? (
        <p className="common-p mint-subtitle">{kittenLabels()['subTitle']}</p>): (
          <p className="common-p mint-subtitle">{kittenLabels()['connectedSubTitle']}</p>
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
        className="bayc-button mint-button" 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          dispatch(connectGAKC());
          setFeedback(data.errorMsg);
          getData();
        }}
        >
          CONNECT WALLET
        </button></div>
      )
    }
    else if (data.kittenMintActive) {
      return (
      <div className="d-flex justify-content-center">
        <form>
          <div className="form-group">
            <div>{kittenLabels()['connectedSubTitleTwo']}</div>
            <input type="range" className="form-range" defaultValue="1" min="1" max="20" id="mintQuantity" onChange={(e) => updateTextInput(e.target.value)}/>
            <input type="text"  className="mint-input-read" id="textLabel" defaultValue="1" readOnly></input>
          </div>
          <button type="submit" className="bayc-button mint-button" disabled={mintingKittenNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault();
              kittenActionCaller(document.getElementById("mintQuantity").value, null);
              getData();
            }}>Mint</button>
        </form>
      </div>
      )
    }
    else if (data.kittenAdoptionActive) {
      return (
      <div className="d-flex justify-content-center">
        <form>
          <div className="form-group">
            <label htmlFor="exampleInputEmail1">Enter GACC IDs to Adopt Kittens</label>
            <input className="form-control bayc-button" name='apeId' id='apeId' placeholder="1, 2, 3" onChange={(e) => setApeSelection(e.target.value)}></input>
          </div>
          <button type="submit" className="btn btn-primary bayc-button " disabled={mintingKittenNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault();
              if (document.getElementById("apeId").value) {
                kittenActionCaller(null, document.getElementById("apeId").value);
              }
              getData();
            }}>Adopt</button>
        </form>
      </div>
      )
    }
    else {
      return (
      <div>
        <div>
            <p className="common-p text-break mb-3">
            The adoption drive has come to a close. To get your Kitten Club, check out the collection on OpenSea
            </p>
            </div>
            <div className="d-flex justify-content-center">
            <a href="https://opensea.io/collection/grandpaapecountryclub">
                <button className="bayc-button " type="button">
                BUY A KITTEN ON OPENSEA
                </button>
            </a>
            </div>
        </div>
      )
    }
  }

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
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
                <div className="app">
                <nav id="nav" className="navbar navbar-expand-md navbar-light">
                    <a href="/" id="bayc-brand" className="navbar-brand"><img src={process.env.PUBLIC_URL + '/assets/images/GACC_WHITE_2.png'} className="d-inline-block align-top" alt="bored ape logo" width="auto" height="70px" /></a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span className="" role="button" ><i className="fa fa-bars" aria-hidden="true" style={{color:"#ffffff"}}></i></span></button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <div className="navbar-nav" id="nav-bar">
                        <a id="nav-link" title="BUY AN APE" href="/#buy-an-ape" className="nav-link">BUY AN APE</a>
                        <a id="nav-link" title="ROADMAP" href="/#roadmap" className="nav-link">ROADMAP</a>
                        <a id="nav-link" title="TEAM" href="/#team" className="nav-link">TEAM</a>
                        <div className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">MEMBERS</a>
                            <div aria-labelledby="nav-dropdown" className="dropdown-menu" style={{margin: '0px'}}>
                                <a id="nav-link" title="MACC" href="/macc" className="dropdown-item">MACC</a>
                                <a id="nav-link-active" title="Kitten Club" href="/kitten-club" className="dropdown-item active">KITTEN CLUB</a>
                                <a id="nav-link" title="MERCH" href="/#merch" className="dropdown-item">MERCH</a>
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
                                src="https://ik.imagekit.io/bayc/assets/pets-welcome.png"
                                className="img-fluid d-flex w-50 mx-auto my-5"
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
                            WELCOME TO THE<br />GRANDPA APE KITTEN CLUB
                            </h1>
                            <p className="common-p">
                                The curiosity of the original Grandpa Ape travelers never waned. On their third year of adventuring through the depths of the unexplored world, the apes discovered an alien utopia of wonders. A world filled with adorable kittens of all shapes and colors, with magical powers and hearts that instantly filled their longing souls with warmth.
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
                            DISTRIBUTION &amp; PRICING
                            </h2>
                            <p className="common-p">
                                For a limited time, each and every club member will be able to
                                adopt a Club Kitten NFT from the Grandpa Ape Kitten Club.
                                Claiming the token is free; you'll only have to pay gas.
                            </p>
                            <p className="common-p">
                                The only way to adopt one is to
                                claim it by having a Grandpa Ape in your wallet. You can claim
                                one random Club Kitten for each Grandpa Ape you own. Once a kitten
                                has been claimed by a Grandpa Ape, that token cannot be used
                                to claim another feline again.
                            </p>
                            <p className="common-p">
                                At the time of minting, the kittens will be unrevealed. Once the adoption 
                                window is closed, there will be a public sale for the remaining kittens. 
                                The mint price for a Grandpa Ape Kitten will be 0.03 ETH. The public sale 
                                will last for a X hours before it is closed forever.
                            </p>
                            <p className="common-p mb-0">
                                The unclaimed kittens? They'll return to the kitten realm,
                                never to be seen again.
                            </p>
                            </div>
                            <div className="my-auto my-lg-0 col-lg-5 col-12 order-lg-first">
                                    <img
                                        src={process.env.PUBLIC_URL + '/assets/images/kitten_promo_2.jpg'}
                                        className="img-fluid"
                                        alt=""
                                        />
                            </div>
                        </div>
                        <div className="mb-5 row">
                            <div className="mb-4 mb-lg-0 col-lg-7 col-12">
                            <div className="mb-0">
                                <h2 className="d-flex common-sub-title font-italic mb-2 bayc-color">
                                SPECS
                                </h2>
                                <p className="common-p mb-0">
                                There are up to 5,000 total Grandpa Ape Kitten Club NFTs. Each
                                GAKC dog is stored as an ERC-721 token on the Ethereum
                                blockchain and hosted on IPFS. Every kitten in the kitten
                                club is unique and programmatically-generated from over
                                200 possible traits. Some traits are rarer than others.
                                </p>
                            </div>
                            </div>
                            <div className="col-lg-5 col-12">
                            <img
                                src="https://ik.imagekit.io/bayc/assets/mystery-shiba.gif"
                                className="img-fluid rounded"
                                alt="shiba"
                            />
                            </div>
                        </div>
                        <hr className="gray-line mb-5" />
                        <div className="mb-5 row">
                            <div className="col-12">
                            <div className="d-flex justify-content-center col">
                            <div>
                                <div style={{transition: 'opacity 400ms ease 0s, transform 400ms ease 0s', transform: 'none', opacity: 1}}>
                                <div className="mb-5  row">
                                    <div className="col">
                                    <div className="d-flex justify-content-center w-100 col-12">
                                        <div className="MuiPaper-root MuiCard-root jss12 MuiPaper-outlined MuiPaper-rounded" style={{opacity: 1, transform: 'none', transition: 'opacity 291ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 194ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'}}>
                                        <div className="MuiCardContent-root">
                                            <h2 className="d-flex justify-content-center common-sub-title">{kittenLabels()['title']}</h2>
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
                        </div>
                        <div className="mb-5 row">
                            <div className="col-12">
                            <div className="d-flex justify-content-center">
                                <p className="common-p text-center text-break mb-0">
                                <span className="bold-text">
                                    VERIFIED SMART CONTRACT ADDRESS:{" "}
                                </span>
                                <a
                                    title="0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623"
                                    href="https://etherscan.io/address/0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623"
                                    className="link"
                                >
                                    0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623
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
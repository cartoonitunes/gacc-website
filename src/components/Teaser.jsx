import React from "react";
import ReactPlayer from "react-player";
import "../styles/style.css";

function calculateTimeLeft() {
  const difference = +new Date(`2022-06-8`) - +new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
}

function Teaser() {
  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  React.useEffect(() => {
    const id = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearTimeout(id);
    };
  });

  const timerComponents = Object.keys(timeLeft).map((interval) => {
    if (!timeLeft[interval]) {
      return null;
    }

    return (
      <span>
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  const discordButton = () => {
    return (
      <div className="container">
        <div className="row">
          <div className="teaser-btn-box">
            <a href="https://discord.com/invite/gacc">
              <button className="teaser-button" type="button">
                JOIN US ON DISCORD{" "}
                <i className="fa fa_appended   fa-arrow-right"></i>
              </button>
            </a>
            <br />
            <br />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
        <div>
          <img
            className="img-fluid teaser-logo"
            src={process.env.PUBLIC_URL + "/assets/images/MACC_LOGO.png"}
            alt="logo"
          />
        </div>
        <div className="teaser-video">
          <ReactPlayer
            className="react-player"
            url={process.env.PUBLIC_URL + "/assets/images/MACC_PROMO.mp4"}
            controls={true}
            playing={true}
            width="100%"
            height="100%"
          />
        </div>
        <br />
        {discordButton()}
        <div className="teaser-countdown mb-5">
          <center>
            {timerComponents.length ? timerComponents : <span>Time's up!</span>}
          </center>
        </div>
      </div>
      <hr className="gray-line mb-5" />
      <div className="container">
        <div className="row text-center">
          <div className="col-sm">
            <h3 className="common-title mb-3">Holes 1-6</h3>
            <div>
              <img
                className="roadmap"
                style={{ borderRadius: "5px" }}
                src={process.env.PUBLIC_URL + "/assets/images/Road_Map.png"}
                alt="shirt"
              />
            </div>
            <br />
            <p className="common-sub-title mb-3" key="uniqueId1">Hole 1: OG Grandpas</p>
            <p className="common-text mb-3" key="uniqueId2">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 2: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 3: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 4: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 5: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 6: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
          </div>
          <div className="col-sm">
            <h3 className="common-title mb-3">Holes 7-12</h3>
            <div>
              <img
                className="roadmap"
                style={{ borderRadius: "5px" }}
                src={process.env.PUBLIC_URL + "/assets/images/Road_Map_CS.png"}
                alt="shirt"
              />
            </div>
            <br />
            <p className="common-sub-title mb-3">Hole 7: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 8: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 9: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 10: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 11: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 12: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
          </div>
          <div className="col-sm">
            <h3 className="common-title mb-3">Holes 13-18</h3>
            <div>
              <img
                className="roadmap"
                style={{ borderRadius: "5px" }}
                src={process.env.PUBLIC_URL + "/assets/images/Road_Map_CS.png"}
                alt="shirt"
              />
            </div>
            <br />
            <p className="common-sub-title mb-3">Hole 13: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 14: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 15: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 16: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 17: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
            <p className="common-sub-title mb-3">Hole 18: OG Grandpas</p>
            <p className="common-text mb-3">Release Og Grandpas to</p>
          </div>
        </div>
      </div>
      <br />
      {discordButton()}
      <footer>
        <div className="container-fluid footer-line">
          <hr className="p-0 line" />
          <div className="row mx-0 footer-padding">
            <div className="col-12 col-lg-4 order-lg-first my-lg-auto"></div>
            <div className="col-12 col-lg-4 order-first">
              <img
                className="img-fluid footer-logo"
                src={process.env.PUBLIC_URL + "/assets/images/MACC_LOGO.png"}
                alt="logo"
              />
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
                    <span className="copy-left">
                      © 2022 Grandpa Ape Country Club
                    </span>
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
    </>
  );
}

export default Teaser;

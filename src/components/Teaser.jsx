import React from "react";
import ReactPlayer from "react-player";
import "../styles/style.css";

function calculateTimeLeft() {
  const difference = +Date.parse("Jun 18, 2022 00:00:00") - +new Date();
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

  const timerComponents = Object.keys(timeLeft).map((interval, index) => {
    if (!timeLeft[interval]) {
      return null;
    }

    return (
      <span key={index}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  const discordButton = () => {
    return (
      <div className="container">
        <div className="row">
          <div className="teaser-btn-box text-center">
            <a href="https://discord.com/invite/gacc">
              <button className="teaser-button" type="button">
                JOIN US ON DISCORD{" "}
                <i
                  className="fa fa_appended   fa-arrow-right"
                  style={{ color: "black" }}
                ></i>
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
      <div className="mb-5">
        <div className="video-section">
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
          <div className="mb-5 ">
          {discordButton()}
          </div>
          <div className="mb-5 teaser-countdown">
            <center>
              {timerComponents.length ? (
                timerComponents
              ) : (
                <span>Are you ready for MACC?</span>
              )}
            </center>
          </div>
        </div>
      </div>
      <footer>
        <div className="container-fluid footer-line">
          <hr className="p-0 line" />
          <div className="row mx-0 footer-padding">
            <div className="col-12 col-lg-4 order-lg-first my-lg-auto"></div>
            <div className="col-12 col-lg-4 order-first">
              <img
                className="img-fluid"
                src={process.env.PUBLIC_URL + "/assets/images/MACC_LOGO.png"}
                alt="logo"
              />
            </div>
            <div className="order-last my-auto text-center col-lg-4 col-sm-12 col-12">
              <div className="row">
                <div className="col-lg-12 col-sm-6 col-8">
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

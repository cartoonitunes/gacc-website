import React from 'react'
import '../styles/style.css'

function calculateTimeLeft() {
  const year = new Date().getFullYear();
  const difference = +new Date(`2022-06-8`) - +new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  return timeLeft;
}

function Teaser () {

  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  React.useEffect(() => {
    const id = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearTimeout(id);
    };
  });

  const timerComponents = Object.keys(timeLeft).map(interval => {
    if (!timeLeft[interval]) {
      return;
    }

    return (
       <span>
        {timeLeft[interval]} {interval}{" "}
      </span>
    )
  });

    return (
      <>
        <div>
          <img className="img-fluid teaser-logo" src={process.env.PUBLIC_URL + '/assets/images/MACC_LOGO.png'} alt="logo" />
        </div>
        <div className="teaser-video">
          <iframe height="360" allow="autoplay" src="https://www.youtube.com/embed/E_g236gQtmo?mute=1&amp;autoplay=1&amp;&amp;modestbranding=1&amp;controls=0&amp;showinfo=0&amp;rel=0&amp;hd=1&amp;wmode=transparent" frameborder="0" allowfullscreen="" wmode="opaque" title='iframe'></iframe>
        </div><br />
        <div className="teaser-btn-box">
        <a href="https://discord.com/invite/gacc"><button className="teaser-button" type="button">JOIN US ON DISCORD <i className="fa fa_appended   fa-arrow-right"></i></button></a>
        <br /><br />
        </div>
        <div className='teaser-countdown'><center>{timerComponents.length ? timerComponents : <span>Time's up!</span>}</center></div>
      </>
    );
}
 
export default Teaser;

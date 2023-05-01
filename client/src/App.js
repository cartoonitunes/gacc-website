import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
 
import Mutants from './components/Mutants';
import Home from './components/Home';
import KittenClub from './components/KittenClub';
import GaccMarketplace from './components/GaccMarketplace';
import SerumMarketplace from './components/SerumMarketplace';
import MaccMarketplace from './components/MaccMarketplace';
import Teaser from './components/Teaser';
import Navigation from './components/Navigation';
 
class App extends Component {
  render() {
    return (      
       <BrowserRouter>
        <div>
          <Navigation />
            <Switch>
             <Route path="/" component={Home} exact/>
             <Route path="/home" component={Home}/>
             <Route path="/gacc-marketplace" component={GaccMarketplace}/>
             <Route path="/serum-marketplace" component={SerumMarketplace}/>
             <Route path="/macc-marketplace" component={MaccMarketplace}/>
             <Route path="/macc" component={Mutants}/>
             <Route path="/kitten-club" component={KittenClub}/>
             <Route path="/thelab" component={Teaser}/>
           </Switch>
        </div> 
      </BrowserRouter>
    );
  }
}
 
export default App;


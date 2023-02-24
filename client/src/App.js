import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
 
import Mutants from './components/Mutants';
import Home from './components/Home';
import Marketplace from './components/Marketplace';
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
             <Route path="/marketplace" component={Marketplace}/>
             {/* <Route path="/marketplace" component={() => {
              window.location.href = 'https://0xe6b3f6b1fb201.wlbl.xyz/explore/POLYGON:0x06e6f338a2c6bc8d0578e045c3f346c112cb0a25';
              return null;
             }}/> */}
             <Route path="/macc" component={Mutants}/>
             <Route path="/thelab" component={Teaser}/>
           </Switch>
        </div> 
      </BrowserRouter>
    );
  }
}
 
export default App;


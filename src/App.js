import React, { Component } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
 
import Mutants from './components/Mutants';
import Home from './components/Home';
import Landing from './components/Landing';
import Teaser from './components/Teaser';
import Error from './Error';
import Navigation from './components/Navigation';
 
class App extends Component {
  render() {
    return (      
       <BrowserRouter>
        <div>
          <Navigation />
            <Switch>
             <Route path="/" component={Landing} exact/>
             <Route path="/home" component={Home}/>
             <Route path="/macc" component={Mutants}/>
             <Route path="/thelab" component={Teaser}/>
             <Redirect to="/" />
           </Switch>
        </div> 
      </BrowserRouter>
    );
  }
}
 
export default App;


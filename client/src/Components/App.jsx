import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import RoomBase from './Room/Base';
import BreadCrumbs from './UI/BreadCrumbs';
import RoomListBase from './RoomList/Base';

class App extends Component {
  render() {
    return (
      <React.Fragment>
        <ToastContainer />
        <div className="top-nav">
          <BreadCrumbs />
          <h1 className="room_movie-name">190303 우주소녀 보나 콘서트 해피 HAPPY WJSN BONA</h1>
        </div>
        {/* <NavBar /> */}
        <Switch>
          <Route path="/r/:id" component={RoomBase} />
          <Route exact path="/" component={RoomListBase} />
          <Route path="/" render={() => <h1>404</h1>} />
        </Switch>
      </React.Fragment>
    );
  }
}

export default App;

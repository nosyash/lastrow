import React, { Component } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { connect } from 'react-redux';
import RoomBase from './Room/Base';
import RoomListBase from './RoomList/Base';
import FixedComponents from './UI/FixedComponents';
import * as types from '../constants/ActionTypes';
import { getProfile } from '../utils/apiRequests';

class App extends Component {
  async componentDidMount() {
    const { updateProfile } = this.props;
    const profile = await getProfile();
    if (!profile) return updateProfile({ logged: false });
    updateProfile({ ...profile.data, logged: true });
  }

  render() {
    return (
      <BrowserRouter>
        <React.Fragment>
          <ToastContainer />
          <FixedComponents />
          <div className="top-nav">
            {/* <BreadCrumbs /> */}
            {/* <h1 className="room_movie-name">190303 우주소녀 보나 콘서트 해피 HAPPY WJSN BONA</h1> */}
          </div>
          {/* <NavBar /> */}
          <Switch>
            <Route path="/r/:id" component={RoomBase} />
            <Route exact path="/" component={RoomListBase} />
            <Route path="/" render={() => <h1>404</h1>} />
          </Switch>
        </React.Fragment>
      </BrowserRouter>
    );
  }
}

const mapDispatchToProps = {
  updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
};

const mapStateToProps = state => ({
  profile: state.profile,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

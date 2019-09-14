import React, { useState, useEffect } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { connect } from 'react-redux';
import ls from 'local-storage';
import RoomBase from './scenes/Room';
import RoomListBase from './scenes/Home/index';
import Popups from './components/Popups';
import * as types from './constants/ActionTypes';
import { getProfile } from './utils/apiRequests';
import { getRandom } from './utils';

function App(props) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        handleProfile();
        if (!ls.get('notifications-requested')) Notification.requestPermission();
    }, []);

    async function handleProfile() {
        const { updateProfile } = props;
        const profile = await getProfile();

        if (profile) {
            updateProfile({ ...profile.data, logged: true });
        } else {
            const uuid = getRandom(64);
            updateProfile({ logged: false, uuid, guest: true });
        }

        setLoaded(true);
    }

    return (
        <BrowserRouter>
            {loaded && (
                <React.Fragment>
                    <ToastContainer />
                    <Popups />
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
            )}
        </BrowserRouter>
    );
}

const mapDispatchToProps = {
    updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
    addPopup: payload => ({ type: types.ADD_POPUP, payload }),
};

const mapStateToProps = state => ({
    profile: state.profile,
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

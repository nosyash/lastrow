import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Route, Switch, Redirect, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { connect, Provider } from 'react-redux';
import { get as lsGet } from 'local-storage';
import { get } from 'lodash'
// import RoomBase from './scenes/Room';
// import RoomListBase from './scenes/Home/index';
const RoomBase = lazy(() => import(/* webpackChunkName: "room" */ './scenes/Room/index'));
const RoomList = lazy(() => import(/* webpackChunkName: "home-page" */ './scenes/Home/index'));


import Popups from './components/Popups';
import * as types from './constants/actionTypes';
import { getProfile } from './utils/apiRequests';
import { getRandom, getCookie, getJWTBody } from './utils';
import { store } from './store';
import { Profile } from './reducers/profile';

const RoomSuspended = (props) =>
    <Suspense fallback={<div />}>
        <RoomBase {...props} />
    </Suspense>


const RoomListSuspended = (props) =>
    <Suspense fallback={<div />}>
        <RoomList {...props} />
    </Suspense>



function App(props: any) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        initProfile();

        if (!lsGet('notifications-requested')) {
            Notification.requestPermission();
        }
    }, []);

    function initProfile() {
        getProfile()
            .then(handleUserProfile)
            .catch(handleAnonymousProfile)
            .finally(() => setLoaded(true))
    }

    function handleUserProfile(profile: Profile) {
        const { updateProfile, setRoles, setCurrentLevel } = props;

        updateProfile({ ...profile, logged: true });
        const jwt = getJWTBody(getCookie('jwt'));
        const roles = get(jwt, 'roles', [])
        
        if (roles.length === 0) {
            setCurrentLevel(1)
        }

        setRoles(roles);
    }

    function handleAnonymousProfile() {
        const { updateProfile } = props;

        const uuid = getRandom(64);
        updateProfile({ logged: false, uuid, guest: true });
    }

    return (
        <BrowserRouter>
            {loaded && (
                <React.Fragment>
                    <ToastContainer />
                    <Popups />
                    <div className="top-nav">
                    </div>
                    <Switch>
                        <Route path="/r/:id" component={RoomSuspended} />
                        <Route exact path="/" component={RoomListSuspended} />
                        <Route path="/"><Redirect to="/" /></Route>
                    </Switch>
                </React.Fragment>
            )}
        </BrowserRouter>
    );
}

const mapDispatchToProps = {
    updateProfile: (payload: any) => ({ type: types.UPDATE_PROFILE, payload }),
    addPopup: (payload: any) => ({ type: types.ADD_POPUP, payload }),
    setRoles: (payload: any) => ({ type: types.SET_ROLES, payload }),
    setCurrentLevel: (payload: any) => ({ type: types.SET_CURRENT_LEVEL, payload }),
};

const mapStateToProps = (state: any) => ({
    profile: state.profile,
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

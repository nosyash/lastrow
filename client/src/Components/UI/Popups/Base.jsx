import React, { useRef, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { throttle } from 'lodash';
import cn from 'classnames';
import ls from 'local-storage';
import { getCenteredRect } from '../../../utils/base';
import * as types from '../../../constants/ActionTypes';
import {
    POPUP_HEADER,
    COLOR_PICKER,
    GUEST_AUTH,
    IMAGE_PICKER,
    LOG_FORM,
    NEW_ROOM,
    PLAYLIST,
    PROFILE_SETTINGS,
    SETTINGS,
} from '../../../constants';
import AddMedia from './AddMedia';
import ColorPicker from './ColorPicker';
import GuestAuth from './GuestAuth';
import ImagePicker from './ImagePicker';
import LogForm from './LogForm';
import NewRoom from './NewRoom';
import Playlist from './Playlist';
import ProfileSettings from './ProfileSettings';
import Settings from './Settings';

function Popups({ popups, removePopup }) {
    const handleResizeTh = throttle(handleResize, 16);
    useEffect(() => {
        addEvents();

        return () => {
            removeEvents();
        };
    }, []);

    function addEvents() {
        document.addEventListener('keydown', handleKey);
        window.addEventListener('resize', handleResizeTh);
    }

    function removeEvents() {
        document.removeEventListener('keydown', handleKey);
        window.removeEventListener('resize', handleResizeTh);
    }

    function handleResize() {}

    function handleKey(e) {
        const { keyCode } = e;
        const lastPopup = popups[popups.length - 1];
        if (keyCode !== 27) return;
        if (lastPopup) {
            if (lastPopup.id === 'profile-settings') return;
            removePopup(lastPopup.id);
        }
    }
    const p = popups;
    return (
        <div className="popups_container">
            {p.profileSettings && wrapper(<ProfileSettings />, 'profileSettings')}
            {p.colorPicker && wrapper(<ColorPicker />, 'colorPicker')}
            {p.guestAuth && wrapper(<GuestAuth />, 'guestAuth')}
            {p.imagePicker && wrapper(<ImagePicker />, 'imagePicker')}
            {p.logForm && wrapper(<LogForm />, 'logForm')}
            {p.newRoom && wrapper(<NewRoom />, 'newRoom')}
            {p.playlist && wrapper(<Playlist />, 'playlist')}
            {p.settings && wrapper(<Settings />, 'settings')}
        </div>
    );

    function wrapper(popup, name) {
        return (
            <Popup removePopup={() => removePopup(name)} popupElement={popup} name={name} />
        );
    }
}

let clientX = null;
let clientY = null;

function Popup(props) {
    const [width, setWidth] = useState(getPosition('width') || 0);
    const [top, setTop] = useState(getPosition('top') || 0);
    const [left, setLeft] = useState(getPosition('left') || 0);
    const [moving, setMoving] = useState(false);
    const [show, setShow] = useState(false);
    const popupEl = useRef(null);

    useEffect(() => {
        if (!getPosition('left')) {
            const { width: w, height: h } = popupEl.current.getBoundingClientRect();
            setStates({ ...getCenteredRect(w, h) });
        }
        setShow(true);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        removeEvents();
        addEvents();
        return () => {
            removeEvents();
        };
    }, [width, top, left, moving]);

    function setStates(states) {
        if (states.width) setWidth(states.width);
        if (states.top) setTop(states.top);
        if (states.left) setLeft(states.left);
        if (states.moving) setMoving(states.moving);
    }

    function addEvents() {
        document.addEventListener('mousemove', handleMouseMove);
    }

    function removeEvents() {
        document.removeEventListener('mousemove', handleMouseMove);
    }

    function handleMouseDown(e) {
        if (moving) return;
        const { left: left_, top: top_ } = popupEl.current.getBoundingClientRect();
        const { target, clientX: clientX_, clientY: clientY_ } = e;
        clientX = clientX_ - left_;
        clientY = clientY_ - top_;
        if (target.closest(POPUP_HEADER)) {
            setMoving(true);
        }
    }

    function handleMouseMove(e) {
        if (!moving) return;

        const { clientX: clientX_, clientY: clientY_ } = e;

        const { left: left_, top: top_ } = popupEl.current.getBoundingClientRect();
        const offsetX = left_ + (clientX_ - (left_ + clientX));
        const offsetY = top_ + (clientY_ - (top_ + clientY));
        setStates({ left: offsetX, top: offsetY });
    }

    function savePosition() {
        ls.set(`${props.name}Popup`, { width, top, left });
    }

    function getPosition(key) {
        try {
            return ls.get(`${props.name}Popup`)[key];
        } catch (error) {}
    }

    function handleMouseUp() {
        setMoving(false);
        savePosition();
    }

    function getTitle() {
        switch (name) {
        case COLOR_PICKER:
            return 'Color picker';
        case GUEST_AUTH:
            return 'Guest authorization';
        case IMAGE_PICKER:
            return 'Image picker';
        case LOG_FORM:
            return 'Sign in';
        case NEW_ROOM:
            return 'New room';
        case PLAYLIST:
            return 'Playlist';
        case PROFILE_SETTINGS:
            return 'Profile settings';
        case SETTINGS:
            return 'Settings';
        default:
            return '';
        }
    }

    const { removePopup, popupElement, name } = props;
    const visibility = show ? 'visible' : 'hidden';
    return (
        <div
            ref={popupEl}
            style={{
                width: width || 'auto',
                top: top || 'auto',
                left: left || 'auto',
                visibility,
            }}
            className={cn(['popup', name])}
        >
            <div data-id={0} onMouseDown={handleMouseDown} className="popup-header">
                <h3 className="popup-title">{getTitle()}</h3>
                <div className="header-controls controls-container">
                    <span onClick={() => removePopup()} className="control">
                        <i className="fas fa-times" />
                    </span>
                </div>
            </div>
            {popupElement}
        </div>
    );
}

const mapStateToProps = state => ({
    popups: state.Popups,
});

const mapDispatchToProps = {
    removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Popups);

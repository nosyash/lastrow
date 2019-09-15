import React, { useRef, useEffect, useState, CSSProperties, ReactElement } from 'react';
import { connect } from 'react-redux';
import { throttle } from 'lodash';
import cn from 'classnames';
import ls from 'local-storage';
import { getCenteredRect } from '../../utils';
import * as types from '../../constants/actionTypes';
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
} from '../../constants';
import ColorPicker from './ColorPicker';
import GuestAuth from './GuestAuth';
import ImagePicker from './ImagePicker';
import LogForm from './LogForm';
import NewRoom from './NewRoom';
import Playlist from './Playlist';
import ProfileSettings from './ProfileSettings';
import Settings from './Settings/index';

interface WrapperProps {
    popup: ReactElement;
    name: string;
    opts?: { fixed?: boolean; esc?: boolean; };
}

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

    function handleResize() { }

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
            {p.profileSettings && wrapper({ popup: <ProfileSettings />, name: PROFILE_SETTINGS })}
            {p.colorPicker && wrapper({ popup: <ColorPicker />, name: COLOR_PICKER })}
            {p.guestAuth && wrapper({ popup: <GuestAuth />, name: GUEST_AUTH })}
            {p.imagePicker && wrapper({ popup: <ImagePicker />, name: IMAGE_PICKER })}
            {p.logForm && wrapper({ popup: <LogForm />, name: LOG_FORM })}
            {p.newRoom && wrapper({ popup: <NewRoom />, name: NEW_ROOM })}
            {p.playlist && wrapper({ popup: <Playlist />, name: PLAYLIST })}
            {p.settings && wrapper({ popup: <Settings />, name: SETTINGS, opts: { fixed: true, esc: true } })}
        </div>
    );

    function wrapper({ popup, name, opts = {} }: WrapperProps) {
        const { fixed, esc } = opts;
        return (
            <Popup
                fixed={fixed}
                esc={esc}
                removePopup={() => removePopup(name)}
                popupElement={popup}
                name={name}
            />
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

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        }
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

    function handleKeyDown({ code }) {
        if (!props.esc) return;
        if (code === 'Escape') props.removePopup()
    }

    function addEvents() {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function removeEvents() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
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
        (ls as any).set(`${props.name}Popup`, { width, top, left });
    }

    function getPosition(key) {
        try {
            return (ls as any).get(`${props.name}Popup`)[key];
        } catch (error) { }
    }

    function handleMouseUp() {
        if (moving) {
            setMoving(false);
            savePosition();
        }
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

    function getStyles() {
        if (props.fixed) return {};
        const visibility = show ? 'visible' : 'hidden';
        return {
            width: width || 'auto',
            top: top || 'auto',
            left: left || 'auto',
            visibility,
        } as CSSProperties;
    }

    const { removePopup, popupElement, name } = props;
    return (
        <div
            ref={popupEl}
            style={{ ...getStyles() }}
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
    popups: state.popups,
});

const mapDispatchToProps = {
    removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Popups);

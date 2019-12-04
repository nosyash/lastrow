import React, { useRef, useEffect, useState, CSSProperties, ReactElement } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { throttle, get } from 'lodash';
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
    CHAT_FLOAT,
    POPUP_SURFACE,
} from '../../constants';
import ColorPicker from './ColorPicker';
import GuestAuth from './GuestAuth';
import ImagePicker from './ImagePicker';
import LogForm from './LogForm';
import NewRoom from './NewRoom';
import Playlist from './Playlist';
import Settings from './Settings/index';
import ChatContainer from '../../scenes/Room/scenes/Chat';
import { MainStates } from '../../reducers/mainStates';
import { Rooms } from '../../reducers/rooms';
import ResizeObserver from 'resize-observer-polyfill'
import { State } from '../../reducers';

interface WrapperProps {
    popup: ReactElement;
    name: string;
    opts?: { fixed?: boolean; esc?: boolean; hideClose?: boolean };
    show: boolean;
}

function Popups({ popups, cinemaMode, removePopup, insideOfRoom }) {
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
        if (keyCode !== 27) {
            return;
        }
        if (lastPopup && lastPopup.id !== 'profile-settings') {
            removePopup(lastPopup.id);
        }
    }

    const p = popups;
    return (
        <div className="popups_container">
            {wrapper({ popup: <ColorPicker />, name: COLOR_PICKER, show: p.colorPicker })}
            {wrapper({ popup: <GuestAuth />, name: GUEST_AUTH, show: p.guestAuth })}
            {wrapper({ popup: <ImagePicker />, name: IMAGE_PICKER, show: p.imagePicker })}
            {wrapper({ popup: <LogForm />, name: LOG_FORM, show: p.logForm })}
            {wrapper({ popup: <NewRoom />, name: NEW_ROOM, show: p.newRoom })}
            {wrapper({ popup: <Playlist />, name: PLAYLIST, show: p.playlist })}
            {wrapper({ popup: <Settings />, name: SETTINGS, show: p.settings, opts: { fixed: true, esc: true } })}
            {wrapper({ popup: <ChatContainer />, name: CHAT_FLOAT, show: cinemaMode && insideOfRoom, opts: { hideClose: true } })}
        </div>
    );

    function wrapper({ popup, name, show, opts = {} }: WrapperProps) {
        const { fixed, esc, hideClose } = opts;
        return show && (
            <Popup
                fixed={fixed}
                hideClose={hideClose}
                esc={esc}
                removePopup={() => removePopup(name)}
                popupElement={popup}
                name={name}
            />
        )
    }
}

let offsetX = null;
let offsetY = null;

export class CustomAnimation extends React.Component<any, any> {
    state = {
        visible: this.props.show,
        pseudoVisible: this.props.show,
    }

    timer = null as any;
    timer2 = null as any;

    div = React.createRef() as React.RefObject<HTMLDivElement>

    componentDidUpdate({ show }: any) {
        const { show: shouldBeShown, duration } = this.props;
        if (shouldBeShown === show) return

        clearTimeout(this.timer)
        clearTimeout(this.timer2)
        if (shouldBeShown) {
            this.setState({ visible: true })
            this.timer = setTimeout(() => this.setState({ pseudoVisible: true }), 0);
        } else {
            this.setState({ pseudoVisible: false })
            this.timer2 = setTimeout(() => this.setState({ visible: false }), duration || 150);
        }
    }

    render() {
        const { visible, pseudoVisible } = this.state;
        const { children, classes: classesProps } = this.props;
        if (!visible) return null;
        const classes = cn(['custom-animation', { 'is-visible': pseudoVisible }, ...classesProps || []])
        return (
            <div ref={this.div} className={classes}>
                {children}
            </div>
        )
    }
}

interface PopupProps {
    fixed?: boolean;
    hideClose?: boolean;
    esc?: boolean;
    removePopup: () => void;
    popupElement: React.ReactElement;
    name: string;
}

function Popup(props: PopupProps) {
    const [width, setWidth] = useState(getPosition('width') || 0);
    const [top, setTop] = useState(getPosition('top') || 0);
    const [left, setLeft] = useState(getPosition('left') || 0);
    const [moving, setMoving] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [show, setShow] = useState(false);

    const popupEl = useRef(null) as React.MutableRefObject<HTMLDivElement>
    const surfaceEl = useRef(null) as React.MutableRefObject<HTMLDivElement>

    const timer = useRef(null)
    const timer2 = useRef(null)

    useEffect(() => {
        if (!getPosition('left')) {
            const { width: w, height: h } = popupEl.current.getBoundingClientRect();
            setStates({ ...getCenteredRect(w, h) });
        }
        setShow(true);

        document.addEventListener('keydown', handleKeyDown);
        watchPopupDimensionsChange()

        return () => {
            clearInterval(timer2.current)
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

    function watchPopupDimensionsChange() {
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(timer.current )
            timer.current = requestAnimationFrame(() => { updatePosition() });
        });

        timer2.current = setInterval(() => { updatePosition() }, 2000);
        resizeObserver.observe(popupEl.current);
    }

    function setStates(states) {
        if (typeof states.width === 'number') setWidth(states.width);
        if (typeof states.top === 'number') setTop(states.top);
        if (typeof states.left === 'number') setLeft(states.left);
        if (typeof states.moving === 'number') setMoving(states.moving);
    }

    function handleKeyDown({ code }) {
        if (!props.esc) {
            return;
        }
        if (code === 'Escape') {
            props.removePopup()
        }
    }

    function addEvents() {
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp);
    }
    function removeEvents() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function handleMouseDown(e) {
        if (moving || resizing) {
            return;
        }

        const { left: left_, top: top_ } = popupEl.current.getBoundingClientRect();
        const { clientX: clientX_, clientY: clientY_ } = e;
        const target = e.target as HTMLElement

        offsetX = clientX_ - left_;
        offsetY = clientY_ - top_;

        if (target.closest(POPUP_HEADER)) {
            setMoving(true);
        }
        if (target.closest(POPUP_SURFACE)) {
            setResizing(true);
        }
    }

    function updatePosition({ left, top, rect } = {} as { left?: number; top?: number, rect?: DOMRect }) {
        if (!popupEl.current) {
            return
        }

        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

        const popupRect = rect || popupEl.current.getBoundingClientRect();
        const { left: elLeft, top: elTop, width: elWidth, height: elHeight } = popupRect

        const leftBound = Math.min(windowWidth - elWidth, Math.max(0, left || elLeft))
        const topBound = Math.min(windowHeight - elHeight, Math.max(0, top || elTop))

        setStates({ left: leftBound, top: topBound });
    }

    function handleMouseMove(e: MouseEvent) {
        if (moving || resizing) {
            const rect = popupEl.current.getBoundingClientRect() as DOMRect;
        
            const newLeft = rect.left + (e.clientX - (rect.left + offsetX));
            const newTop = rect.top + (e.clientY - (rect.top + offsetY));
    
            updatePosition({ left: newLeft, top: newTop })
        }
    }

    function savePosition(): void {
        localStorage[props.name+'Popup'] = JSON.stringify({ width, top, left })
    }

    function getPosition(key: string) {
        const item = JSON.parse((localStorage[props.name+'Popup'] || 'null'))
        
        return get(item, key)
    }

    function handleMouseUp() {        
        setMoving(false);
        setResizing(false);
        savePosition();
    }

    function getTitle() {
        if (name === COLOR_PICKER) return 'Color picker';
        if (name === GUEST_AUTH) return 'Guest authorization';
        if (name === IMAGE_PICKER) return 'Image picker';
        if (name === LOG_FORM) return 'Sign in';
        if (name === NEW_ROOM) return 'New room';
        if (name === PLAYLIST) return 'Playlist';
        if (name === PROFILE_SETTINGS) return 'Profile settings';
        if (name === SETTINGS) return 'Settings';
        return ''
    }

    function getStyles() {
        if (props.fixed) {
            return {};
        }
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
            <div ref={surfaceEl} onMouseDown={handleMouseDown} className="popup__surface">
                <i className="fa fa-angle-down" />
            </div>
            <div data-id={0} onMouseDown={handleMouseDown} className="popup-header">
                <h3 className="popup-title">{getTitle()}</h3>
                <div className="header-controls controls-container">
                    {!props.hideClose && (
                        <span onClick={() => removePopup()} className="control">
                            <i className="fas fa-times" />
                        </span>
                    )}
                </div>
            </div>
            {popupElement}
        </div>
    );
}

const mapStateToProps = (state: State) => ({
    popups: state.popups,
    cinemaMode: state.mainStates.cinemaMode,
    insideOfRoom: !!state.rooms.currentPermissions
});

const mapDispatchToProps = {
    removePopup: (payload: string) => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Popups);

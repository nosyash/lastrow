import React, { useRef, useEffect, useState, CSSProperties, ReactElement } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import cn from 'classnames';
import { getCenteredRect, safelyParseJson } from '../../utils';
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
    POPUP_RESIZE_HANDLER,
} from '../../constants';
import ColorPicker from './ColorPicker';
import GuestAuth from './GuestAuth';
import ImagePicker from './ImagePicker';
import LogForm from './LogForm';
import NewRoom from './NewRoom';
import Playlist from './Playlist';
import Settings from './Settings/index';
import ChatContainer from '../../scenes/Room/scenes/Chat';
import ResizeObserver from 'resize-observer-polyfill'
import { State } from '../../reducers';

interface WrapperOpts {
    fixed?: boolean;
    esc?: boolean;
    hideClose?: boolean;
    resizable?: boolean;
    minHeight?: number;
    minWidth?: number;
}

interface WrapperProps {
    popup: ReactElement;
    name: string;
    opts?: WrapperOpts;
    show: boolean;
}

function Popups({ popups, cinemaMode, removePopup, insideOfRoom }) {
    useEffect(() => {
        addEvents();

        return () => {
            removeEvents();
        };
    }, []);

    function addEvents() {
        document.addEventListener('keydown', handleKey);
    }

    function removeEvents() {
        document.removeEventListener('keydown', handleKey);
    }

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
            {wrapper({
                popup: <ChatContainer />,
                name: CHAT_FLOAT,
                show: cinemaMode && insideOfRoom,
                opts: { hideClose: true, resizable: true, minHeight: 325, minWidth: 150 }
            })}
        </div>
    );

    function wrapper({ popup, name, show, opts = {} }: WrapperProps) {
        return show && (
            <Popup
                {...opts}
                removePopup={() => removePopup(name)}
                popupElement={popup}
                name={name}
            />
        )
    }
}

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

interface PopupProps extends WrapperOpts {
    removePopup: () => void;
    popupElement: React.ReactElement;
    name: string;
}

let offsetX = 0;
let offsetY = 0;
let offsetXRes = 0;
let offsetYRes = 0;

function Popup(props: PopupProps) {
    const [width, setWidth] = useState(getPosition('width') || 0);
    const [height, setHeight] = useState(getPosition('height') || '');
    const [top, setTop] = useState(getPosition('top') || 0);
    const [left, setLeft] = useState(getPosition('left') || 0);
    const [show, setShow] = useState(false);

    const popupEl = useRef(null) as React.MutableRefObject<HTMLDivElement>

    const timer = useRef(null);
    const timer2 = useRef(null);

    const moving = useRef(false);
    const resizing = useRef(false);

    const isResizing = () => resizing.current;
    const setResizing = (v: boolean) => { resizing.current = v };

    const isMoving = () => moving.current;
    const setMoving = (v: boolean) => { moving.current = v };

    const minWidth = props.minWidth || 150
    const minHeight = props.minHeight || 150

    function disableUserSelect() {
        const videoContainer = document.getElementById('video-container')
        if (videoContainer) {
            videoContainer.style.pointerEvents = 'none'
            document.body.style.userSelect = 'none'
        }
    }
    function enableUserSelect() {
        const videoContainer = document.getElementById('video-container')
        if (videoContainer) {
            videoContainer.style.pointerEvents = ''
            document.body.style.userSelect = ''
        }
    }

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
    }, [width, top, left, moving.current, resizing.current]);

    function watchPopupDimensionsChange() {
        const resizeIfNeeded = () => !isMoving() && !isResizing() ? setBoundedSize() : null

        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(timer.current)
            timer.current = setTimeout(resizeIfNeeded, 100);
        });

        timer2.current = setInterval(resizeIfNeeded, 2000);
        resizeObserver.observe(popupEl.current);

        
    }

    function setStates(states) {
        if (typeof states.width === 'number') setWidth(states.width);
        if (typeof states.height === 'number') setHeight(states.height);
        if (typeof states.top === 'number') setTop(states.top);
        if (typeof states.left === 'number') setLeft(states.left);
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
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    function removeEvents() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (isMoving() || isResizing()) {
            return;
        }

        const rect = popupEl.current.getBoundingClientRect();
        const { clientX: clientX_, clientY: clientY_  } = e;
        const target = e.target as HTMLElement

        offsetX = clientX_ - rect.left;
        offsetY = clientY_ - rect.top;

        offsetXRes = rect.left + rect.width - e.clientX
        offsetYRes = rect.top + rect.height - e.clientY

        disableUserSelect()

        if (target.closest(POPUP_HEADER)) {
            setMoving(true)
        }

        if (target.closest(POPUP_RESIZE_HANDLER)) {
            setResizing(true)
        }
    }

    // fixes window boundings and updates position/dimensions
    function setBoundedSize(pos = {} as { left?: number; top?: number; width?: number; height?: number; rect?: DOMRect }) {
        if (!popupEl.current) {
            return
        }

        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

        const popupRect = pos.rect || popupEl.current.getBoundingClientRect();
        const { left: elLeft, top: elTop, width: elWidth, height: elHeight } = popupRect

        if (isMoving()) {
            const maxLeft = windowWidth - elWidth
            const maxTop = windowHeight - elHeight

            const leftBound = Math.min(maxLeft, Math.max(0, pos.left || elLeft))
            const topBound = Math.min(maxTop, Math.max(0, pos.top || elTop))

            setStates({ left: leftBound, top: topBound });
        }


        if (isResizing()) {
            const maxWidth = windowWidth - popupRect.left
            const newWidth = Math.min(maxWidth, Math.max(minWidth, pos.width))

            const maxHeight = windowHeight - popupRect.top
            const newHeight = Math.min(maxHeight, Math.max(minHeight, pos.height))

            setStates({ width: newWidth, height: newHeight });
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isMoving() && !isResizing()) {
            return
        }

        const rect = popupEl.current.getBoundingClientRect() as DOMRect;
        
        if (isResizing()) {
            const newWidth = rect.width + (e.clientX - (rect.left + rect.width)) + offsetXRes
            const newHeight = rect.height + (e.clientY - (rect.top + rect.height)) + offsetYRes

            setBoundedSize({ width: newWidth, height: newHeight, rect });
        } 
        
        if (isMoving()) {
            const newLeft = rect.left + (e.clientX - (rect.left + offsetX));
            const newTop = rect.top + (e.clientY - (rect.top + offsetY));

            setBoundedSize({ left: newLeft, top: newTop, rect })
        }
    }

    function savePosition(): void {
        localStorage[props.name + 'Popup'] = JSON.stringify({ width, top, left, height })
    }

    function getPosition(key: string) {
        const item = safelyParseJson((localStorage[props.name + 'Popup']))

        return get(item, key)
    }

    function handleMouseUp() {
        setMoving(false)
        setResizing(false)
        savePosition();
        enableUserSelect()
    }

    function getTitle() {
        if (props.name === COLOR_PICKER) return 'Color picker';
        if (props.name === GUEST_AUTH) return 'Guest authorization';
        if (props.name === IMAGE_PICKER) return 'Image picker';
        if (props.name === LOG_FORM) return 'Sign in';
        if (props.name === NEW_ROOM) return 'New room';
        if (props.name === PLAYLIST) return 'Playlist';
        if (props.name === PROFILE_SETTINGS) return 'Profile settings';
        if (props.name === SETTINGS) return 'Settings';
        return ''
    }

    function getStyles() {
        if (props.fixed) {
            return {};
        }
        const visibility = show ? 'visible' : 'hidden';
        return {
            width: width || '',
            height: height || '',
            top: top || '',
            left: left || '',
            visibility,
        } as CSSProperties;
    }

    const { removePopup, popupElement, name, resizable } = props;
    return (
        <div
            ref={popupEl}
            style={{ ...getStyles() }}
            className={cn(['popup', name])}

        >
            {resizable && (
                <div onMouseDown={handleMouseDown} className="popup__resize-handle">
                    <i className="fa fa-angle-down" />
                </div>
            )}
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

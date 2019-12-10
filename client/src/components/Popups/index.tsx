import React, { useRef, useEffect, useState, CSSProperties, ReactElement } from 'react';
import { connect } from 'react-redux';
import get from 'lodash-es/get';
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

function Popups({ popups: p, cinemaMode, removePopup, insideOfRoom, logged }) {
    useEffect(() => {
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('keydown', handleKey);
        };
    }, []);

    function handleKey(e: KeyboardEvent) {
        const { keyCode } = e;
        const lastPopup = p[p.length - 1];
        if (keyCode !== 27) {
            return;
        }
        if (lastPopup && lastPopup.id !== 'profile-settings') {
            removePopup(lastPopup.id);
        }
    }

    const popupsList = [
        { show: p[COLOR_PICKER], name: COLOR_PICKER, element: <ColorPicker /> },
        {
            show: p[GUEST_AUTH],
            name: GUEST_AUTH,
            element: <GuestAuth />,
            opts: { hideClose: true, dontSavePosition: true }
        },
        { show: p[IMAGE_PICKER], name: IMAGE_PICKER, element: <ImagePicker />, opts: { dontSavePosition: true } },
        { show: p[LOG_FORM], name: LOG_FORM, element: <LogForm /> },
        { show: p[NEW_ROOM], name: NEW_ROOM, element: <NewRoom />, opts: { dontSavePosition: true } },
        { show: p[PLAYLIST] && logged, name: PLAYLIST, element: <Playlist /> },
        { show: p[SETTINGS], name: SETTINGS, element: <Settings />, opts: { fixed: true, esc: true } },
        {
            show: cinemaMode && insideOfRoom && logged,
            name: CHAT_FLOAT,
            element: <ChatContainer />,
            opts: { hideClose: true, resizable: true, minHeight: 325, minWidth: 150 }
        },
    ]

    return (
        <div className="popups-container">
            {popupsList
                .filter(({ show }) => show)
                .map(({ name, element, opts = {} }) => {
                    return <Popup key={name} removePopup={removePopup} name={name} {...opts}>{element}</Popup>
                })
            }
        </div>
    );
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

interface PopupProps {
    removePopup: (name: string) => void;
    name: string;
    children: React.ReactElement;

    fixed?: boolean;
    resizable?: boolean;
    dontSavePosition?: boolean;
    esc?: boolean;
    hideClose?: boolean;
    minHeight?: number;
    minWidth?: number;
}

let offsetX = 0;
let offsetY = 0;
let offsetXRes = 0;
let offsetYRes = 0;

function Popup(props: PopupProps) {
    const width_ = getPosition('width')
    const height_ = getPosition('height')
    const top_ = getPosition('top')
    const left_ = getPosition('left')
    const [width, setWidth] = useState(typeof width_ === 'number' ? width_ : 0);
    const [height, setHeight] = useState(typeof height_ === 'number' ? height_ : '');
    const [top, setTop] = useState(typeof top_ === 'number' ? top_ : 0);
    const [left, setLeft] = useState(typeof left_ === 'number' ? left_ : 0);

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
        const hasSavedPosition = typeof getPosition('left') === 'number'
        if (!hasSavedPosition) {
            const rect = popupEl.current.getBoundingClientRect();
            const centeredRect = getCenteredRect(rect.width, rect.height)
            setStates({ top: centeredRect.top, left: centeredRect.left });
        }
        setShow(true);

        document.addEventListener('keydown', handleKeyDown);
        watchPopupDimensionsChange()

        return () => {
            clearInterval(timer2.current)
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
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
            timer.current = setTimeout(resizeIfNeeded, 32);
        });

        timer2.current = setInterval(resizeIfNeeded, 2000);
        resizeObserver.observe(popupEl.current);
    }

    function addEvents() {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    function removeEvents() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function setStates(states: { width?: number; height?: number; top?: number; left?: number }) {
        if (typeof states.width === 'number') setWidth(states.width);
        if (typeof states.height === 'number') setHeight(states.height);
        if (typeof states.top === 'number') setTop(states.top);
        if (typeof states.left === 'number') setLeft(states.left);
    }

    function handleKeyDown({ code }) {
        if (code === 'Escape' && props.esc) {
            props.removePopup(props.name)
        }
    }

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (isMoving() || isResizing()) {
            return;
        }

        const rect = popupEl.current.getBoundingClientRect();
        const target = e.target as HTMLElement

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

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

        const maxLeft = windowWidth - popupRect.width
        const maxTop = windowHeight - popupRect.height

        const leftBound = Math.min(maxLeft, Math.max(0, pos.left || popupRect.left))
        const topBound = Math.min(maxTop, Math.max(0, pos.top || popupRect.top))

        setStates({ left: leftBound, top: topBound });

        if (props.resizable) {
            const maxWidth = windowWidth - popupRect.left
            const newWidth = Math.min(maxWidth, Math.max(minWidth, pos.width || popupRect.width))

            const maxHeight = windowHeight - popupRect.top
            const newHeight = Math.min(maxHeight, Math.max(minHeight, pos.height || popupRect.height))

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
        if (props.dontSavePosition) {
            return
        }
        const dims = props.resizable ? { width, height } : {}
        localStorage[props.name + 'Popup'] = JSON.stringify({ top, left, ...dims })
    }

    function getPosition(key: string) {
        const item = safelyParseJson((localStorage[props.name + 'Popup']))

        return get(item, key)
    }

    function handleMouseUp() {
        if (isMoving() || isResizing()) {
            setMoving(false)
            setResizing(false)
            savePosition();
            enableUserSelect()
        }
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

    const { removePopup, children, name, resizable } = props;
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
                        <span onClick={() => removePopup(name)} className="control">
                            <i className="fas fa-times" />
                        </span>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}

const mapStateToProps = (state: State) => ({
    popups: state.popups,
    cinemaMode: state.mainStates.cinemaMode,
    insideOfRoom: !!state.rooms.currentPermissions,
    logged: state.profile.logged,
});

const mapDispatchToProps = {
    removePopup: (payload: string) => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Popups);

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import MiniProfile from '../../../components/MiniProfile';
import { User } from '../../../../../utils/types';
import { Profile } from '../../../../../reducers/profile';
import { CustomAnimation } from '../../../../../components/Popups';


interface ChatHeaderProps {
    userList: User[];
}

function ChatHeader({ userList }: ChatHeaderProps) {
    const [showProfile, setShowProfile] = useState(false);
    const [currentProfile, setCurrentProfile] = useState(null as User);

    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    });

    function handleClick({ target }) {
        const isUserIcon = target.closest('.user-icon');
        const isMenuProfile = target.closest('.mini-profile');
        if (!isUserIcon && !isMenuProfile) {
            setShowProfile(false);
        }
    }

    function handleUserClick(userProfile: User) {
        setShowProfile(true);
        setCurrentProfile(userProfile);
    }

    function handleHideProfile() {
        requestAnimationFrame(() => setShowProfile(false));
    }
    const userListSliced = userList.slice(0, 15)
    return (
        <div className="chat-header">
            <CustomAnimation show={showProfile && !currentProfile.guest} classes={['mini-profile-animation']} duration={110}>
                <MiniProfile hideProfile={handleHideProfile} currentProfile={currentProfile} />
            </CustomAnimation>
            <div className="chat-header_userlist">
                {userListSliced.map((userProfile, index) => (
                    <UserIcon
                        onClick={() => handleUserClick(userProfile)}
                        key={index}
                        id={userProfile.__id}
                        name={userProfile.name}
                        color={userProfile.color}
                        guest={userProfile.guest}
                    />
                ))}
            </div>
            <div className="chat-header_arrow">
                <i className="fa fa-angle-down" />
            </div>
        </div>
    );
}

interface UserIconProps {
    onClick: (...args: any) => void;
    id: string;
    name: string;
    color: string;
    guest: boolean;
}

function UserIcon({ id, onClick, name, color, guest }: UserIconProps) {
    const classes = `fa fa-user${guest ? '-secret' : ''}`;

    return (
        <span onClick={() => onClick(id)} title={name} id={id.toString()} className="user-icon">
            <i className={classes} style={{ color }} />
        </span>
    );
}

const mapStateToProps = state => ({ userList: state.chat.users });

export default connect(mapStateToProps)(ChatHeader);

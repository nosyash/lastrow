import React from 'react';
import cn from 'classnames'

interface SettingsMenuProps {
    list: any[];
    active: string;
    onClick: (name: string) => void;
}

export default function SettingsMenu(props: SettingsMenuProps) {
    function onClick(name: string) {
        props.onClick(name);
    }
    return (
        <div className="settings-menu">
            {props.list.map((item) => {
                return (
                    <div key={item.title} className="settings-menu__item">
                        <div className="settings-menu__title">{item.title}</div>
                        {item.children.map(({ name }) =>
                            <SubItemProps
                                key={name}
                                onClick={onClick}
                                active={props.active === name}
                                name={name}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

interface SubItemProps {
    name: string;
    active: boolean;
    onClick: (name: string) => void;
}

function SubItemProps({ name, active, onClick }: SubItemProps) {
    const classes = cn('settings-menu__subitem', { 'settings-menu__subitem_active': active })
    return <div onClick={() => onClick(name)} className={classes}>{name}</div>
}

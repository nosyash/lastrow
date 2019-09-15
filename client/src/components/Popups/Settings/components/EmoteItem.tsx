import React, { useState } from 'react';

interface EmoteItemProps {
    alias: string;
    path: string;
}

export default function EmoteItem(props: EmoteItemProps) {
    const [value, setValue] = useState(props.alias);
    return (
        <div className="emote-settings-item">
            <img className="emote-settings-item_image emote" src={props.path} title={props.alias} />
            <input value={value}
                onChange={({ target }) => setValue(target.value)}
                className="emote-settings-item_alias emote-settings__input" />
        </div>
    )
};

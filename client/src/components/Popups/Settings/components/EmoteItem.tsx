import React, { useState, ChangeEvent } from 'react';
import { requestEmoteRename } from '../../../../actions';

interface EmoteItemProps {
    alias: string;
    path: string;
}

export default function EmoteItem({ alias, path }: EmoteItemProps) {
    const [value, setValue] = useState(alias);

    function handleValue({ target }) {
        if (target.value > 15) return;
        setValue(target.value)
    }

    function handleRename() {
        requestEmoteRename({ name: alias, newname: value })
    }
    const renamed = alias !== value;
    return (
        <div className="emote-settings-item">
            <img className="emote-settings-item_image emote" src={path} title={alias} />
            <input value={value}
                onChange={handleValue}
                className="emote-settings-item_alias emote-settings__input" />
            {renamed &&
                <span onClick={handleRename} className="icon"><i className="fa fa-check" /></span>}
        </div>
    )
};

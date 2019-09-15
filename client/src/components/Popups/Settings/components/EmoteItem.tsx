import React, { useState, ChangeEvent } from 'react';
import { requestEmoteRename, requestEmoteDelete } from '../../../../actions';

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

    function handleDelete() {
        requestEmoteDelete({ name: alias })
    }

    const renamed = alias !== value;
    return (
        <div className="emote-settings-item">
            <img className="emote-settings-item_image emote" src={path} title={alias} />
            <div className="emote-settings-item_right">
                <span
                    style={{ visibility: renamed ? 'visible' : 'hidden' }}
                    onClick={handleRename}
                    className="icon emotes-settings__icon_rename">
                    <i className="fa fa-check" />
                </span>
                <input value={value}
                    onChange={handleValue}
                    className="emote-settings-item_alias emote-settings__input" />
                <span
                    onClick={handleDelete}
                    className="icon emotes-settings__icon_delete">
                    <i className="fa fa-times" />
                </span>

            </div>
        </div>
    )
};

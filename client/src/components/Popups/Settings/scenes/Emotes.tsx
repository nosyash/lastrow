import React, { useState, ChangeEvent } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../../constants/actionTypes';
import * as api from '../../../../constants/apiActions';
import EmoteItem from '../components/EmoteItem';
import EmoteSearch from '../components/EmoteSearch';
import { Emoji } from '../../../../reducers/emojis';
import { Profile } from '../../../../reducers/profile';
import { toastOpts } from '../../../../conf';
import { toast } from 'react-toastify';
import { webSocketSend, requestAddEmote } from '../../../../actions';

interface EmotesProps {
    addEmote: (request: api.AddEmoteRequest) => void;
    emotes: Emoji[];
    profile: Profile;
    roomId: string;
}

function Emotes(props: EmotesProps) {
    const [emotes, setEmotes] = useState(props.emotes);
    function handleAddEmoji({ name, type, base64 }) {

        const request = {
            name,
            type,
            base64,
            roomId: props.roomId
        } as api.AddEmoteRequest
        props.addEmote(request)
    }

    function handleSearch(value: string) {
        const emotesFounded = props.emotes.filter(emote => emote.name.includes(value))
        setEmotes(emotesFounded);
    }

    function handleFile({ target }: ChangeEvent) {
        const file = (target as HTMLInputElement).files[0];
        const { name, type, size } = file;
        if (size / 1024 > 256) return sizeWarn();



        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result;
            handleAddEmoji({ name, type: getType(type), base64 });
        };
        reader.onerror = () => convertingError();
    }

    return (
        <div className="emotes-settings">
            <EmoteSearch onChange={handleSearch} />
            <div className="emotes-settings__amount">{props.emotes.length}/100</div>
            <label className="button add-emote-button">
                <input type="file" onChange={handleFile} />
                Add emote
            </label>
            <div className="emotes-settings__items">
                {emotes.map((emote) =>
                    <EmoteItem
                        key={emote.path + emote.name}
                        alias={emote.name}
                        path={emote.path}
                    />
                )}
            </div>
            <p className="emotes-settings__info">
                Emotes must be under 256kb and no bigger than 128x128px
                Each room has limit of 100 emotes.
            </p>
        </div>
    )
}

function sizeWarn() {
    toast.warn("Image should be no bigger than 256kb", toastOpts)
}

function convertingError() {
    toast.error('An error occurred while reading the file.', toastOpts);
}

function getType(fileType) {
    switch (fileType) {
        case 'image/png':
            return 'png'
        case 'image/gif':
            return 'gif'
        default:
            break;
    }
}

const mapStateToProps = state => ({
    profile: state.profile,
    emotes: state.emojis.list,
    roomId: state.mainStates.roomID,
});
const mapDispatchToProps = {
    updateProfile: (payload: any) => ({ type: types.UPDATE_PROFILE, payload }),
    addEmote: payload => requestAddEmote(payload)
};
export default connect(mapStateToProps, mapDispatchToProps)(Emotes);

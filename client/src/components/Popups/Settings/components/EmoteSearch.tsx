import React, { useState } from 'react';

interface EmoteSearchProps {
    onChange: (value: string) => void;
}

export default function EmoteSearch({ onChange }: EmoteSearchProps) {
    const [value, setValue] = useState('');
    const handleChange = ({ target }) => {
        setValue(target.value)
        onChange(target.value);
    };
    return (
        <div className="emote-settings__search">
            <input value={value} onChange={handleChange} className="emote-settings__input" />
        </div>
    )
}

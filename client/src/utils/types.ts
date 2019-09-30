export interface Message {
    action: string;
    body?: {};
}

export interface MessageBody {
    event: {};
}

export interface MessageType extends String { }

export interface MessageEvent {
    type: MessageType;
    data: {};
}

export interface UpdateUsers extends Message {
    action: string;
    body: Body;
}

export interface UpdateUsersBody extends MessageBody {
    event: UpdateUsersEvent;
}

export interface UpdateUsersEvent extends MessageEvent {
    type: string;
    data: UpdateUsersData;
}

export interface UpdateUsersData {
    users: User[];
}

export interface User {
    name: string;
    color: string;
    image: string;
    guest: boolean;
    __id: string;
}


export interface ChatMessage extends Message {
    action: string;
    body: ChatMessageBody;
}

export interface ChatMessageBody extends MessageBody {
    event: ChatMessageEvent;
}

export interface ChatMessageEvent extends MessageEvent {
    type: string;
    data: ChatMessageData;
}

export interface ChatMessageData {
    message: string;
    color: string;
    image: string;
    name: string;
    __id: string;
}

export interface UpdatePlaylist extends Message {
    action: string;
    body: UpdatePlaylistBody;
}

export interface UpdatePlaylistBody extends MessageBody {
    event: UpdatePlaylistEvent;
}

export interface UpdatePlaylistEvent extends MessageEvent {
    type: string;
    data: UpdatePlaylistData;
}

export interface UpdatePlaylistData {
    videos: Video[];
}

export interface Video {
    // TODO: declare subtitles type
    title: string;
    duration: number;
    url: string;
    index: number;
    direct: boolean;
    iframe?: boolean;
    __id: string;
}

// TODO: declare and test
// export interface YouTube extends Video {
//     direct: false;
//     iframe: false;
// }

export interface Ticker {
    action: string;
    body: TickerBody;
}

export interface TickerBody {
    event: TickerEvent;
}

export interface TickerEvent {
    type: string;
    data: TickerData;
}

export interface TickerData {
    ticker: Ticker;
}

export interface Ticker {
    __id: string;
    duration: number;
    elapsed_time: number;
}


export interface Feedback {
    action: string;
    body: FeedbackBody;
}

export interface FeedbackBody {
    event: FeedbackEvent;
}

export interface FeedbackEvent {
    type: string;
    data: FeedbackData;
}

export interface FeedbackData {
    feedback: Feedback;
}

export interface Feedback {
    message?: string;
    error?: string;
    url: string;
}


export interface RoomList {
    number: number;
    rooms: Room[];
}

export interface Room {
    title: string;
    path: string;
    play: string;
    users: string;
}

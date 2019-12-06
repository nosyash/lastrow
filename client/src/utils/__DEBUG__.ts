import { DEBUG } from '../constants'

export const DEBUG_EXPOSE = (key: string, variable: any) => {
    if (!DEBUG) {
        return
    }
    window['DEBUG_' + key] = variable 
}

export const UPDATE_PLAYLIST_WS_DEBUG_MESSAGE = (params = {} as any) => {
    const { url = 'https://www.youtube.com/watch?v=Xk24DMOInnQ' } = params;
    const { title = '30 minutes timer' } = params;
    const { duration = 1815 } = params;

    return {
        action: 'playlist_event',
        body: {
            event: {
                type: 'update_playlist',
                data: {
                    videos: [{
                        title,
                        duration,
                        url,
                        direct: false,
                        iframe: false,
                        live_stream: false,
                        __id: '173fa7305e2c4985a6424017707c2521711850344ca6124ad314cc6fa26016f5'
                    }]
                }
            }
        }
    }
}

export const PAUSE_MEDIA_WS_DEBUG_MESSAGE = () => ({
    action: 'player_event',
    body: { event: { type: 'pause' } }
})
export const RESUME_MEDIA_WS_DEBUG_MESSAGE = () => ({
    action: 'player_event',
    body: { event: { type: 'resume' } }
})

export const TICKER_WS_DEBUG_MESSAGE = (n = 10) => ({
    action: 'player_event',
    body: {
        event: {
            type: 'ticker',
            data: {
                ticker: {
                    __id: '173fa7305e2c4985a6424017707c2521711850344ca6124ad314cc6fa26016f5',
                    duration: 1815,
                    elapsed_time: n
                }
            }
        }
    }
})
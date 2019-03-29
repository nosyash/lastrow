const { REACT_APP_SOCKET_ENDPOINT: socketURL } = process.env;

const wss = new WebSocket(socketURL);

const users = [];

const broadcast = (data, ws) => {
  wss.clients.forEaach(client => {
    if (client.readyState === we)
  })
}

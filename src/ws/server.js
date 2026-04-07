import { WebSocket, WebSocketServer } from "ws";

function sendJson (socket, payload)  {
    if(socket.readyState !== socket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
};

function broadcast (wss, payload) {
    for(const client of wss.clients) {
        if(client.readyState !== client.OPEN) {
        continue;
    }
    client.send(JSON.stringify(payload));
    }
};

export function attachWebSocketServer (server) {
    const wss = new WebSocketServer({server, path: "/ws", maxPayload: 1024 * 1024 * 10});

    wss.on("connection", (socket) => {
        socket.isAlive = true;
        socket.on("pong", () => { socket.isAlive = true; });
        
        sendJson(socket, {type: "welcome"}); 
        socket.on("error", console.error);
    });
    
    // Heartbeat interval
    const interval = setInterval(() => {
        for (const socket of wss.clients) {
            if (socket.isAlive === false) {
                return socket.terminate();
            }
            socket.isAlive = false;
            socket.ping();
        }
    }, 30000);

    wss.on("close", () => clearInterval(interval));

}
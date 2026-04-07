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
    const wss = new WebSocketServer({server, path: "/ws", maxPayload: 1024 * 1024 * 10}); //10mb

    wss.on("connection", (socket) => {
        sendJson(socket, {type: "welcome"}); 

        socket.on("error", console.error);
    });


    function broadcastMatchCreated (match) {
        broadcast(wss, {type: "matchCreated", data: match});
    }

    return { broadcastMatchCreated };
}
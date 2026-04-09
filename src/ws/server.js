import { WebSocket, WebSocketServer } from "ws";
import { wsarcjet } from '../arcjet.js';

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

    wss.on('connection', async (socket, req) => {
        if(!wsarcjet) return;

        try {
            const decision = await wsarcjet.protect(req);
            const code = decision.reason.isRateLimit() ? 1013: 1008; // 1013: Try again later, 1008: Policy violation
            const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Forbidden';
            socket.close(code, reason);
            return;
        } catch (error) {
            console.error("WS connection error", error);
            socket.close(1011, "server security error");
            return ;
        }
    })

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
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: "matchCreated", data: match });
    }

    return { broadcastMatchCreated };
}
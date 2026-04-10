import { WebSocket, WebSocketServer } from "ws";
import { wsarcjet } from '../arcjet.js';

const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }

    matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId, socket) {
    subscribers = matchSubscribers.get(matchId);
    if (!subscribers) {
        return;
    }
    subscribers.delete(socket);

    if(subscribers.size === 0){
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscribers(socket) {
    for(const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket);
    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers || subscribers.size === 0) {
        return;
    }

    const message = JSON.stringify(payload);
    for(const client of subscribers) {
        if(client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

function handleMessaage(socket,data){
    let message;
    try {
        message = JSON.parse(data.toString());
    } catch (error) {
        sendJson(socket, { type: "error", message: "Invalid JSON" });
        return;
    }

    if(message.type === "subscribe" && typeof message.matchId === "string") {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: "subscribed", matchId: message.matchId });
        return;
    }

    if(message.type === "unsubscribe" && typeof message.matchId === "string") {
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
    }
}
function sendJson (socket, payload)  {
    if(socket.readyState !== socket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
};

function broadcastToAll (wss, payload) {
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

            if (decision.isDenied()) {
                const code = decision.reason.isRateLimit() ? 1013 : 1008;
                socket.close(code, "Forbidden");
                return;
            }
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

        socket.subscriptions = new Set();
        
        sendJson(socket, {type: "welcome"}); 
        socket.on('message', (data)=> {
            handleMessaage(socket, data);
        })
        socket.on("error", () => {
            socket.terminate();
        });

        socket.on("close", () => {
            cleanupSubscribers(socket);
        })

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
        broadcastToAll(wss, { type: "matchCreated", data: match });
    }

    function broadcastCommentary(matchId, commentary) {
        broadcastToMatch(matchId, { type: "commentary", data: commentary });
    }

    return { broadcastMatchCreated, broadcastCommentary };
}
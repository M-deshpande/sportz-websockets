import express from 'express';
import { matchesRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import db from './db/db.js';
import http from 'http';
import { securityMiddleware } from '../src/arcjet.js';
import { commentaryRouter } from './routes/commentary.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

await db();

const app = express();
const server = http.createServer(app);   

app.use(express.json()); //middleware that allows express to understand json coming from postman or frontend

app.get('/', (req, res) => {
    res.send('Hello from server!');
});

app.use(securityMiddleware())

app.use('/matches', matchesRouter);
// app.use('/matches/:id/commentary', commentaryRouter);

const {broadcastMatchCreated, broadcastCommentary} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
    const baseURL = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseURL}`);
    console.log(`WebSocket server is running on ${baseURL.replace('http', 'ws')}/ws`);
});


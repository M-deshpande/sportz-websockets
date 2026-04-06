import express from 'express';
import { matchesRouter } from './routes/matches.js';
import db from './db/db.js';

await db();
const app = express();
const PORT = 8000;
app.use(express.json()); //middleware that allows express to understand json coming from postman or frontend

app.get('/', (req, res) => {
    res.send('Hello from server!');
});

app.use('/matches', matchesRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
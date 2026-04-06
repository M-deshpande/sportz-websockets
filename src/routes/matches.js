import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { Match } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";

export const matchesRouter = Router();

matchesRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({
        error: "Invalid query",
        details: parsed.error.errors,
        });
    }

    const limit = Math.min(parsed.data.limit ?? 50, 100);

    try {
        const data = await Match.find()
            .sort({ createdAt: -1 }) // newest first
            .limit(limit);

        res.json({ data });

        } catch (error) {
        res.status(500).json({
            error: "Failed to list matches",
            details: error.message,
        });
    }
});

matchesRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }

    const { startTime, endTime, homeScore, awayScore, ...rest} = parsed.data;

    try{
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : undefined;

        const match = await Match.create({
            ...rest,
            startTime: start,
            endTime: end,
            homeScore,
            awayScore,
            status: getMatchStatus(start, end),
        });

        res.status(201).json({ message: 'Match created', match });

    }catch(error){
        res.status(500).json({ error: 'Failed to create match', details: error.message });
    }
});
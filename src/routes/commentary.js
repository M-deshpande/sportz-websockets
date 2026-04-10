import { Router } from "express";
import mongoose from "mongoose";
import { createCommentarySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { Commentary } from "../db/schema.js";

export const commentaryRouter = Router({mergeParams: true}); // mergeParams allows us to access params from parent router (matchesRouter in this case)


commentaryRouter.get("/", async (req, res) => {
    const { id } = req.params;

    const paramResult = matchIdParamSchema.safeParse(req.params);

    if (!paramResult.success) {
        return res.status(400).json({
            error: "Invalid matchId",
            details: paramResult.error.errors
        });
    }

    try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        const commentary = await Commentary.find({
            matchId: new mongoose.Types.ObjectId(id),
        })
        .sort({ sequence: 1 }) // 🔥 IMPORTANT: chronological order
        .limit(limit);

        return res.status(200).json({
            message: "Commentary fetched",
            count: commentary.length,
            commentary
        });

    } catch (error) {
        return res.status(500).json({
            error: "Failed to fetch commentary",
            details: error.message
        });
    }
});


commentaryRouter.post("/", async (req, res) => {

    // ✅ Validate params using Zod
    const paramResult = matchIdParamSchema.safeParse(req.params);

    if (!paramResult.success) {
        return res.status(400).json({
            error: "Invalid matchId",
            details: paramResult.error.errors
        });
    }

    // ✅ Validate body
    const bodyResult = createCommentarySchema.safeParse(req.body);

    if (!bodyResult.success) {
        return res.status(400).json({
            error: "Invalid request body",
            details: bodyResult.error.errors
        });
    }

    // ✅ Extract + convert
    const matchId = new mongoose.Types.ObjectId(paramResult.data.id);
    const data = bodyResult.data;

    try {
        const commentary = await Commentary.create({
            matchId,
            ...data,
        });

        if(res.app.locals.broadcastCommentary){
            res.app.locals.broadcastCommentary(matchId.toString(), commentary)
        }

        return res.status(201).json({
            message: "Commentary created",
            commentary
        });

    } catch (error) {
        return res.status(500).json({
            error: "Failed to create commentary",
            details: error.message,
        });
    }
});
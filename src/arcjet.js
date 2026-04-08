import dotenv from 'dotenv';
import arcjet, {shield, detectBot, slidingWindow } from '@arcjet/node';

dotenv.config();


const arcjetKey = process.env.ARCJET_KEY
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE"

if(!arcjetKey) throw new Error("ARCJET_KEY environment variable missing")

export const httparcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({mode : arcjetMode}),
            detectBot({mode : arcjetMode, allow: ['CATEGORY: SEARCH_ENGINE' , 'CATEGORY: PREVIEW']}),
            slidingWindow({mode: arcjetMode, interval:'10s', max:50}) 
        ],
    }) : null

export const wsarcjet = arcjetKey ?
    arcjet({
        key : arcjetKey,
        rules : [
            shield({mode: arcjetMode}),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
            slidingWindow({ mode: arcjetMode, interval:'2s', max: 5})

        ]
    }) : null

export function securityMiddleware() {
    console.log("Middleware hit");
    return async(req, res, next) => {
        if(!httparcjet) {
            // console.warn("Arcjet key not found, skipping security middleware");
            return next();
        }

        try {
            const decision = await httparcjet.protect(req);
            // console.log("DECISION:", decision);
            // console.log("REASON:", decision.reason);

            if(decision.isDenied()) { 
                if(decision.reason.isRateLimit()){
                    return res.status(429).json({error: 'Too many requests'})
                }
                return res.status(403).json({error: 'Forbidden'})
            }
        } catch (error) {
            console.log("Arcjet midddleware error", error)
            return res.status(503).json({error: 'Service unavailable'})
        }
        next();
    }
}
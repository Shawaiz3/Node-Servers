import jwt from "jsonwebtoken"
import { Request, Response } from "express";
import { NextFunction } from "connect";
import { redis } from "../userRoutes"; // Import same Redis connection
import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
    interface Request {
        token?: string | JwtPayload;
    }
}
const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader != 'undefined') {
            const token = bearerHeader.split(' ')[1]; // To remove bearer from token

            // 🔹 Check if token is blacklisted in Redis
            const isBlacklisted = await redis.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return res.status(403).send("Token has been logged out");
            }

            const user = jwt.verify(token, process.env.JWT_SECRET!);
            req.token = user;
            next();

        } else {
            res.status(401).send("No token provided");
        }
    } catch (error) {
        res.status(403).send("Invalid or Expire Token");
    }
}
export default auth;
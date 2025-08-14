import express from "express";
import dotenv from "dotenv";
import user from "./userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Redis from "ioredis";

const server = express();
dotenv.config();

// Connect to Redis
export const redis = new Redis();
redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis error:", err));

server.post('/register', async (req, res) => {
    const { username, email, password } = req.body; // object construction method
    const existingUser = await user.findOne({ $or: [{ username }, { email }] }); // Using or method of mongo DB
    if (existingUser) {
        return res.status(400).send("User or Email already Exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);  // to encrypt the password before storing it in DB
    const userData = new user({ username, email, password: hashedPassword });
    const savedUser = await userData.save();
    res.json(savedUser);
})
server.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const selectedUser: any = await user.findOne({ username }); // recheck
    if (!selectedUser) {
        return res.status(404).send("User not Found!");
    }
    const isMatch = await bcrypt.compare(password, selectedUser.password)
    if (!isMatch) {
        return res.status(400).send("Invalid Cradentials");
    }
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    const token = jwt.sign(
        { userId: selectedUser._id, username: selectedUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
    )
    await redis.set(`token:${selectedUser._id}`, token, "EX", 300); //Set the Token that expires in 5 min
    res.json({ token });
})
server.post('/logout', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send("No token provided");

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
        return res.status(400).send("Invalid token");
    }

    // Remove from active tokens and add to blacklist
    await redis.del(`token:${decoded.userId}`);
    await redis.set(`blacklist:${token}`, "true", "EX", 300);

    res.json({ message: "Logged out successfully" });
})

export default server;
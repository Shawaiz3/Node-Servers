import express from "express";
import dotenv from "dotenv";
import user from "./userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const server = express();
dotenv.config();

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
    res.json({token});
})
// server.post('/logout', async (req, res) => {

// })

export default server;
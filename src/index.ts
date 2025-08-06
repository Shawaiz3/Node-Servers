// This code is part of a Node.js application that uses Express and Mongoose to manage a simple todo list.
import express from "express";
import mongoose from 'mongoose'
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import { logger } from "./logger"

const server = express();
dotenv.config();

mongoose.connect(process.env.MONGO_URI!).then(() => console.log("DB Connected")).catch((err) => console.log(`Error in Connection ${err}`));

// Pre biuld Middle ware
server.use(express.json());
server.use(morgan("dev"));
server.use(helmet());
server.use(cors());

type todo = {
    task: string
}

const joiSchema = joi.object({
    task: joi.string().strict().required()
})

const todoSchema = new mongoose.Schema<todo>({
    task: {
        type: String,
        required: true
    }
})

const myModel = mongoose.model<todo>("myTask", todoSchema);

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log("Server started at port 3000");
})

server.route("/")
    .post(async (req, res) => {
        try {
            await joiSchema.validateAsync(req.body);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`Error during adding ${message}`);
            res.status(400).send(`Invalid input: ${message}`);
            return;
        }
        const body = req.body?.task;
        await myModel.create({
            task: body
        })
        logger.info('Sucessfully added data');
        res.status(201).send(`Sucessfully Added task: ${body}`);
    })
    .get(async (req, res) => {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const search = req.query.task;
        const jump = (page - 1) * limit;
        const filter: any = {};
        if (search) {
            filter.task = search;
        }
        const result = await myModel.find(filter).skip(jump).limit(limit);
        console.log(`Result  = ${result}`)
        if (result.length === 0) {
            logger.error(`No data Found`)
            res.status(200).send('No data Found');
        }
        else {
            logger.info(`Data sent`)
            res.status(200).json({ result });
        }
    });


server.route("/:id")
    .get(async (req, res) => {
        const id = req.params.id;
        const selectedUser = await myModel.findById(id);
        logger.info(`Data of id ${id} is sent`);
        res.status(200).json({ selectedUser });
    })
    .patch(async (req, res) => {
        const id = req.params.id;
        const body: todo = req.body?.task;
        await myModel.findByIdAndUpdate(id, { task: body });
        logger.info(`Data of id ${id} is updated`);
        res.status(200).send(`Updated Record at id: ${id}`);
    })
    .delete(async (req, res) => {
        const id = req.params.id;
        await myModel.findByIdAndDelete(id);
        logger.info(`Data of id ${id} is deleted`);
        res.status(200).send(`Deleted Record at id: ${id}`)
    })

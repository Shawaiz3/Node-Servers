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
        const search = String(req.query.task);
        const jump = (page - 1) * limit;
        const filter: Partial<todo> = {};
        if (page === 0 || limit === 0) {
            logger.error(`page and limit can't be null or zero in pagination`);
            res.status(400).send(`page and limit can't be null or zero`);
            return;
        }
        if (search != "undefined") {
            filter.task = search;
        }
        const result = await myModel.find(filter).skip(jump).limit(limit);
        if (result.length === 0) {
            logger.info(`No data Found`)
            res.status(200).send('No data Found');
        }
        else {
            logger.info(`Data sent`)
            res.status(200).json({ result });
        }
    });


server.route("/:id")
    .all((req, res, next) => {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.error(`Invalid ID in request`);
            res.status(400).send("Invalid ID");
            return;
        }
        next();
    })
    .get(async (req, res) => {
        const id = req.params.id;
        const selectedUser = await myModel.findById(id);
        if (selectedUser) {
            logger.info(`Data of id ${id} is sent`);
            res.status(200).json({ selectedUser });
        }
        else {
            logger.info(`No Data Found`);
            res.status(404).send(`No Data Found`);
        }
    })
    .patch(async (req, res) => {
        const id = req.params.id;
        try {
            await joiSchema.validateAsync(req.body);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`Error during Updating ${message}`);
            res.status(400).send(`Invalid input: ${message}`);
            return;
        }
        const body = req.body?.task;
        const selectedUser = await myModel.findByIdAndUpdate(id, { task: body });
        if (selectedUser) {
            logger.info(`Data of id ${id} is updated`);
            res.status(200).send(`Updated Record at id: ${id}`);
        }
        else {
            logger.info(`No Data Found`);
            res.status(404).send(`No Data Found`);
        }
    })
    .delete(async (req, res) => {
        const id = req.params.id;
        const selectedUser = await myModel.findByIdAndDelete(id);
        if (selectedUser) {
            logger.info(`Data of id ${id} is deleted`);
            res.status(200).send(`Deleted Record at id: ${id}`)
        }
        else {
            logger.info(`No Data Found`);
            res.status(404).send(`No Data Found`);
        }
    })

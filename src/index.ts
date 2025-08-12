// This code is part of a Node.js application that uses Express and Mongoose to manage a simple todo list.
import express from "express";
import mongoose from 'mongoose'
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import { logger } from "./logger"
import auth from "./middleWare/auth"
import userRoutes from "./userRoutes"

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

declare global {
    namespace Express {
        interface Request {
            selectedUser?: todo;
        }
    }
}

const bodySchema = joi.object({
    task: joi.string().strict().required()
});
const querySchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).default(10),
    task: joi.string().optional()
});

const todoSchema = new mongoose.Schema<todo>({
    task: {
        type: String,
        required: true
    }
})

// Middleware for body validation
function validateBody(req: express.Request, res: express.Response, next: express.NextFunction) {
    bodySchema.validateAsync(req.body)
        .then(() => next())
        .catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            res.status(400).send(`Invalid body: ${message}`);
        });
}

// Middleware for query validation
function validateQuery(req: express.Request, res: express.Response, next: express.NextFunction) {
    querySchema.validateAsync(req.query)
        .then((value) => {
            Object.assign(req.query, value); // copy validated values
            next();
        })
        .catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            res.status(400).send(`Invalid query: ${message}`);
        });
}

// Middleware to check todo
async function findTodoById(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const selectedUser = await myModel.findById(id);
    if (selectedUser) {
        req.selectedUser = selectedUser; // Attach to req for later use
        next();
    } else {
        logger.info(`No Data Found`);
        res.status(404).send("No Data Found");
    }
}

const myModel = mongoose.model<todo>("myTask", todoSchema);

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log("Server started at port 3000");
})

server.use('/users', userRoutes); // using all user's routes
server.use(auth); // adding Middleware

server.route("/")
    .post(validateBody, async (req, res) => {
        const body = req.body?.task;
        await myModel.create({
            task: body
        })
        logger.info('Sucessfully added data');
        res.status(201).send(`Sucessfully Added task: ${body}`);
    })
    .get(validateQuery, async (req, res) => {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const search = String(req.query.task);
        const jump = (page - 1) * limit;
        const filter: any = {};
        if (typeof req.query.task === "string" && search.trim() !== "") {
            filter.task = { $regex: search, $options: "i" };
        }
        const result = await myModel.find(filter).skip(jump).limit(limit);
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
    .all((req, res, next) => {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.error(`Invalid ID in request`);
            res.status(400).send("Invalid ID");
            return;
        }
        next();
    })
    .get(findTodoById, async (req, res) => {
        const id = req.params.id;
        const selectedUser = await myModel.findById(id);
        res.status(200).json({ selectedUser });

    })
    .patch(validateBody, findTodoById, async (req, res) => {
        const id = req.params.id;
        const body = req.body?.task;
        await myModel.findByIdAndUpdate(id, { task: body });
        logger.info(`Data of id ${id} is updated`);
        res.status(200).send(`Updated Record at id: ${id}`);
    })
    .delete(findTodoById, async (req, res) => {
        const id = req.params.id;
        await myModel.findByIdAndDelete(id);
        logger.info(`Data of id ${id} is deleted`);
        res.status(200).send(`Deleted Record at id: ${id}`)
    })
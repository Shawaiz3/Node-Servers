import express from "express";
import mongoose from 'mongoose'
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

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
        const body = req.body?.task;
        await myModel.create({
            task: body
        })
        res.status(201).send(`Sucessfully Added task: ${body}`);
    })

    .get(async (req, res) => {
        const result = await myModel.find({});
        res.status(200).json({ result });
    })

server.route("/page/:numm")
    .get(async (req, res) => {
        const numm = Number(req.params.numm);
        const jump = (numm - 1) * 5;
        const result = await myModel.find({}).skip(jump).limit(5);
        res.status(200).json({ result });
    });

server.route("/:id")
    .get(async (req, res) => {
        const id = req.params.id;
        const selectedUser = await myModel.findById(id);
        res.status(200).json({ selectedUser });
    })
    .patch(async (req, res) => {
        const id = req.params.id;
        const body: todo = req.body?.task;
        await myModel.findByIdAndUpdate(id, { task: body });
        res.status(200).send(`Updated Record at id: ${id}`);
    })
    .delete(async (req, res) => {
        const id = req.params.id;
        await myModel.findByIdAndDelete(id);
        res.status(200).send(`Deleted Record at id: ${id}`)
    })

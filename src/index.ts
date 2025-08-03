import express from "express";
import mongoose from 'mongoose'
const server = express();

mongoose.connect("mongodb://127.0.0.1:27017/complete-todo-app").then(() => console.log("DB Connected")).catch((err) => console.log(`Error in Connection ${err}`));

server.use(express.json());// Pre biuld Middle ware

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

server.listen(3000, () => {
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

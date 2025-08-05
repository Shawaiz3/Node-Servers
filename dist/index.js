"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const server = (0, express_1.default)();
dotenv_1.default.config();
mongoose_1.default.connect(process.env.MONGO_URI).then(() => console.log("DB Connected")).catch((err) => console.log(`Error in Connection ${err}`));
// Pre biuld Middle ware
server.use(express_1.default.json());
server.use((0, morgan_1.default)("dev"));
server.use((0, helmet_1.default)());
server.use((0, cors_1.default)());
const todoSchema = new mongoose_1.default.Schema({
    task: {
        type: String,
        required: true
    }
});
const myModel = mongoose_1.default.model("myTask", todoSchema);
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server started at port 3000");
});
server.route("/")
    .post((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const body = (_a = req.body) === null || _a === void 0 ? void 0 : _a.task;
    yield myModel.create({
        task: body
    });
    res.status(201).send(`Sucessfully Added task: ${body}`);
}))
    .get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield myModel.find({});
    res.status(200).json({ result });
}));
server.route("/page/:numm")
    .get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const numm = Number(req.params.numm);
    const jump = (numm - 1) * 5;
    const result = yield myModel.find({}).skip(jump).limit(5);
    res.status(200).json({ result });
}));
server.route("/:id")
    .get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const selectedUser = yield myModel.findById(id);
    res.status(200).json({ selectedUser });
}))
    .patch((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.params.id;
    const body = (_a = req.body) === null || _a === void 0 ? void 0 : _a.task;
    yield myModel.findByIdAndUpdate(id, { task: body });
    res.status(200).send(`Updated Record at id: ${id}`);
}))
    .delete((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    yield myModel.findByIdAndDelete(id);
    res.status(200).send(`Deleted Record at id: ${id}`);
}));

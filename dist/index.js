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
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
app.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    const user = yield prisma.user.findUnique({
        where: { email },
    });
    if (user) {
        return res.status(400).json({ message: 'User with this email already exists' });
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const newUser = yield prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
        },
    });
    const secret = process.env.JWT_SECRET || 'sup3rS3c3t';
    const token = jsonwebtoken_1.default.sign({ email, userId: newUser.id }, secret); // Include userId in the payload
    res.json({ message: 'User created successfully', userId: newUser.id, token });
}));
app.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordMatch = yield bcrypt_1.default.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const secret = process.env.JWT_SECRET || 'sup3rS3c3t';
    const token = jsonwebtoken_1.default.sign({ email, userId: user.id }, secret);
    res.json({ message: 'User signed in successfully', token });
}));
app.get('/user', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const user = yield prisma.user.findUnique({
            where: { id: userId },
        });
        res.json({ user });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.post('/addTodo', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    if (!userId)
        return;
    try {
        const { title, description, done } = req.body;
        yield prisma.todo.create({
            data: {
                title,
                description,
                done,
                userId,
            },
        });
        res.json({ message: 'Todo added successfully!' });
    }
    catch (error) {
        console.error('Error adding todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.get('/todos', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todos = yield prisma.todo.findMany({
            where: {
                userId: req.userId,
            },
        });
        res.json({ todos });
    }
    catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.put('/updateTodo/:todoId', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, done } = req.body;
        const todoId = parseInt(req.params.todoId, 10);
        const existingTodo = yield prisma.todo.findFirst({
            where: {
                id: todoId,
                userId: req.userId,
            },
        });
        if (!existingTodo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        const updatedTodo = yield prisma.todo.update({
            where: { id: todoId },
            data: {
                title: title || existingTodo.title,
                description: description || existingTodo.description,
                done: done || existingTodo.done,
            },
        });
        res.json({ message: 'Todo updated successfully', todo: updatedTodo });
    }
    catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
const PORT = process.env.PORT || 3001;
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

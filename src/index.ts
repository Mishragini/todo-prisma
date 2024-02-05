import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthenticatedRequest } from './middleware';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post('/signup', async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (user) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });
  const secret = process.env.JWT_SECRET || 'sup3rS3c3t';
  const token = jwt.sign({ email, userId: newUser.id }, secret); // Include userId in the payload
  res.json({ message: 'User created successfully', userId: newUser.id, token });
});

app.post('/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const secret = process.env.JWT_SECRET || 'sup3rS3c3t';
  const token = jwt.sign({ email, userId: user.id }, secret);
  res.json({ message: 'User signed in successfully', token });
});

app.get('/user', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/addTodo', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const userId=req.userId;
    if(!userId) return;
  try {
    const { title, description, done } = req.body;
    await prisma.todo.create({
      data: {
        title,
        description,
        done,
        userId,
      },
    });
    res.json({ message: 'Todo added successfully!' });
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/todos', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const todos = await prisma.todo.findMany({
      where: {
        userId: req.userId,
      },
    });
    res.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/updateTodo/:todoId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, done } = req.body;
      const todoId = parseInt(req.params.todoId, 10);
      
      const existingTodo = await prisma.todo.findFirst({
        where: {
          id: todoId,
          userId: req.userId,
        },
      });
  
      if (!existingTodo) {
        return res.status(404).json({ error: 'Todo not found' });
      }
  
      const updatedTodo = await prisma.todo.update({
        where: { id: todoId },
        data: {
          title: title || existingTodo.title,
          description: description || existingTodo.description,
          done: done || existingTodo.done,
        },
      });
  
      res.json({ message: 'Todo updated successfully', todo: updatedTodo });
    } catch (error) {
      console.error('Error updating todo:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

const PORT = process.env.PORT || 3001;

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

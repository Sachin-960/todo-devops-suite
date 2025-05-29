const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://mongo:27017/todos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// Mongoose Models
const UserSchema = new mongoose.Schema({ email: String, password: String });
const TodoSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
  user: String
});
const User = mongoose.model('User', UserSchema);
const Todo = mongoose.model('Todo', TodoSchema);

// Email Sender via Brevo
async function sendEmail(to, subject, text) {
  const url = 'https://api.brevo.com/v3/smtp/email ';
  const data = {
    sender: { name: "Todo App", email: process.env.SMTP_FROM },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: `<p>${text}</p>`
  };

  try {
    await axios.post(url, data, {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });
    console.log("✅ Email Sent:", subject);
  } catch (e) {
    console.error("❌ Failed to send email:", e.message);
  }
}

// Register
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();
  await sendEmail(email, 'Welcome to Todo App!', 'You registered successfully!');
  res.status(201).json({ message: 'Registered' });
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email }, 'secret_key', { expiresIn: '1d' });
  await sendEmail(email, 'Login Successful', 'You logged into your account.');
  res.json({ token });
});

// Get Todos
app.get('/todos', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const todos = await Todo.find({ user: decoded.email });
    res.json(todos);
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Create Todo
app.post('/todos', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const todo = new Todo({ ...req.body, user: decoded.email });
    await todo.save();
    await sendEmail(decoded.email, 'New Todo Created', `Your todo: "${req.body.text}"`);
    res.status(201).json(todo);
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Delete Todo
app.delete('/todos/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const todo = await Todo.findById(req.params.id);
    if (!todo || todo.user !== decoded.email) return res.status(403).json({ error: 'Forbidden' });
    await Todo.findByIdAndDelete(req.params.id);
    await sendEmail(decoded.email, 'Todo Deleted', `Your todo was deleted.`);
    res.sendStatus(204);
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update Todo
app.put('/todos/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const todo = await Todo.findById(req.params.id);
    if (!todo || todo.user !== decoded.email) return res.status(403).json({ error: 'Forbidden' });
    Object.assign(todo, req.body);
    await todo.save();
    await sendEmail(decoded.email, 'Todo Updated', `Your todo was updated.`);
    res.json(todo);
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
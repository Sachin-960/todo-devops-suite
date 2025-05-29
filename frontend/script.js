const API_URL = 'http://<INSTANCE_IP>:3000';

async function fetchTodos() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/todos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const todos = await res.json();
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    list.appendChild(li);
  });
}

async function addTodo() {
  const input = document.getElementById('new-todo');
  const text = input.value.trim();
  if (!text) return;

  const token = localStorage.getItem('token');

  await fetch(`${API_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });

  input.value = '';
  fetchTodos();
}

window.onload = fetchTodos;
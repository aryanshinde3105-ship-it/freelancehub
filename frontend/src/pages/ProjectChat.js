import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function ProjectChat() {
  const { projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await api.get(`/api/chat/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);

    return () => clearInterval(interval);
  }, [projectId, token]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await api.post(
      `/api/chat/${projectId}`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setText('');
  };

  if (loading) return <p>Loading chat...</p>;

  return (
    <div className="app-container">
      <h2>Project Chat</h2>

      <div className="card" style={{ height: '400px', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <div
            key={msg._id}
            style={{
              marginBottom: '0.5rem',
              textAlign: msg.senderId._id === user.id ? 'right' : 'left',
            }}
          >
            <b>{msg.senderId.name}</b>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

export default ProjectChat;

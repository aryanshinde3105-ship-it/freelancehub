import React, { useEffect, useRef, useState } from 'react';
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

  const chatEndRef = useRef(null);
  const intervalRef = useRef(null);

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

  useEffect(() => {
    fetchChat();

    intervalRef.current = setInterval(fetchChat, 8000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [projectId, token]);

  // ✅ auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await api.post(
        `/api/chat/${projectId}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setText('');
      fetchChat();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading chat...</p>;

  return (
    <div className="app-container">
      <h2>Project Chat</h2>

      <div className="chat-container">
        {messages.map((msg) => {
          const isMe = msg.senderId._id === user.id;

          return (
            <div
              key={msg._id}
              className={`chat-message ${isMe ? 'me' : 'other'}`}
            >
              {!isMe && (
                <div className="chat-sender">{msg.senderId.name}</div>
              )}
              {msg.text}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

export default ProjectChat;

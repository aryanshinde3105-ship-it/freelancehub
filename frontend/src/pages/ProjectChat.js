import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';
import { connectSocket } from '../socket';
import '../styles/chatPages.css';

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMessageTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

function ProjectChat() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const seenMessageIdsRef = useRef(new Set());
  const typingStopTimeoutRef = useRef(null);

  const registerMessageAsSeen = (message) => {
    const uniqueId = message?._id || message?.clientMessageId;
    if (!uniqueId) return false;

    if (seenMessageIdsRef.current.has(uniqueId)) {
      return false;
    }

    seenMessageIdsRef.current.add(uniqueId);
    return true;
  };

  const appendMessageIfNew = (message) => {
    if (!registerMessageAsSeen(message)) return;
    setMessages((prev) => [...prev, message]);
  };

  const fetchChat = async () => {
    try {
      const res = await api.get(`/api/chat/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ids = new Set();
      res.data.forEach((msg) => {
        if (msg?._id) ids.add(msg._id);
      });

      seenMessageIdsRef.current = ids;
      setMessages(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Unable to load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    try {
      const res = await api.get(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token || !user) return;

    fetchChat();
    fetchProject();

    const socket = connectSocket(token);
    socketRef.current = socket;

    if (!socket) return;

    const joinRoom = () => {
      socket.emit('join_chat', { projectId }, (ack) => {
        if (!ack?.ok) {
          console.error('join_chat failed:', ack?.error || 'Unknown error');
        }
      });
    };

    const handleConnect = () => {
      setIsSocketConnected(true);
      joinRoom();
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleReceiveMessage = (message) => {
      if (message?.projectId !== projectId) return;
      appendMessageIfNew(message);
    };

    const handleTypingStart = ({ projectId: incomingProjectId, userId, userName }) => {
      if (incomingProjectId !== projectId || userId === user._id) return;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: userName || 'Someone',
      }));
    };

    const handleTypingStop = ({ projectId: incomingProjectId, userId }) => {
      if (incomingProjectId !== projectId || userId === user._id) return;

      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const handleUserStatus = ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return Array.from(next);
      });
    };

    const handleOnlineUsers = ({ userIds = [] }) => {
      setOnlineUsers(userIds);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('user_status', handleUserStatus);
    socket.on('online_users', handleOnlineUsers);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }

      socket.emit('leave_chat', { projectId }, () => {});
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('user_status', handleUserStatus);
      socket.off('online_users', handleOnlineUsers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token, user]);

  // ✅ auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const clientMessageId = `${user._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const socket = socketRef.current;

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }

    if (socket && socket.connected) {
      socket.emit('typing_stop', { projectId });
    }

    setText('');

    try {
      if (socket && socket.connected) {
        const socketAck = await new Promise((resolve) => {
          let settled = false;

          const ackTimeout = setTimeout(() => {
            if (!settled) {
              settled = true;
              resolve({ ok: false, error: 'ACK_TIMEOUT' });
            }
          }, 6000);

          socket.emit(
            'send_message',
            { projectId, text: trimmedText, clientMessageId },
            (ack) => {
              if (settled) return;
              settled = true;
              clearTimeout(ackTimeout);
              resolve(ack || { ok: false, error: 'NO_ACK' });
            }
          );
        });

        if (socketAck?.ok) {
          return;
        }
      }

      const res = await api.post(
        `/api/chat/${projectId}`,
        { text: trimmedText, clientMessageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      appendMessageIfNew({
        ...res.data,
        projectId,
      });
    } catch (err) {
      console.error(err);
      setText(trimmedText);
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    socket.emit('typing_start', { projectId });

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }

    typingStopTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { projectId });
    }, 900);
  };

  const getSenderId = (msg) => {
    if (!msg?.senderId) return null;
    if (typeof msg.senderId === 'string') return msg.senderId;
    return msg.senderId._id;
  };

  const otherUserId =
    messages.map(getSenderId).find((senderId) => senderId && senderId !== user._id) || null;
  const isOtherUserOnline = otherUserId ? onlineUsers.includes(otherUserId) : false;
  const typingLabels = Object.values(typingUsers);

  if (loading) return <p>Loading chat...</p>;

  const participant =
    user.role === 'client'
      ? project?.assignedFreelancerId?.name || 'Freelancer not assigned'
      : project?.clientId?.name || 'Client';

  return (
    <div className="app-container project-chat-page">
      <div className="project-chat-topbar">
        <button className="btn btn-secondary" onClick={() => navigate('/chats')}>
          Back to Chats
        </button>
        <Link to="/archived-chats" className="project-chat-mini-link">
          Archived
        </Link>
      </div>

      <section className="project-chat-header-card">
        <div className="project-chat-title-wrap">
          <h2>{project?.title || 'Project Chat'}</h2>
          <p>
            Chat with <strong>{participant}</strong> for faster project updates and decisions.
          </p>
        </div>

        <div className="project-chat-status-wrap">
          <span className={`connection-chip ${isSocketConnected ? 'online' : 'offline'}`}>
            {isSocketConnected ? 'Live connected' : 'Reconnecting'}
          </span>
          <span className="connection-meta">
            {otherUserId
              ? isOtherUserOnline
                ? 'Participant online'
                : 'Participant offline'
              : 'Waiting for participant info'}
          </span>
          <span className="connection-meta">Deadline: {formatDate(project?.deadline)}</span>
        </div>
      </section>

      <section className="project-chat-room-card">
        {error && <p className="chat-inline-error">{error}</p>}

        <div className="chat-container chat-room-stream">
          {messages.map((msg) => {
            const senderId = getSenderId(msg);
            const isMe = senderId === user._id;

            return (
              <div
                key={msg._id || msg.clientMessageId}
                className={`chat-message ${isMe ? 'me' : 'other'}`}
              >
                {!isMe && (
                  <div className="chat-sender">{msg.senderId?.name || 'Unknown user'}</div>
                )}
                <div>{msg.text}</div>
                <div className="chat-message-time">{formatMessageTime(msg.createdAt)}</div>
              </div>
            );
          })}

          {typingLabels.length > 0 && (
            <div className="chat-message other typing-bubble">
              {typingLabels.join(', ')} {typingLabels.length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="project-chat-composer">
          <input
            value={text}
            onChange={handleTextChange}
            placeholder="Type your message and press Enter"
            className="project-chat-input"
          />
          <button className="btn btn-primary" type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

export default ProjectChat;

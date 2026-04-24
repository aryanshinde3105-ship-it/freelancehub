const mongoose = require('mongoose');
const Message = require('../models/Message');
const Project = require('../models/Project');

const toRoomName = (projectId) => `project_${projectId}`;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const canAccessProjectChat = async (projectId, userId) => {
  if (!isValidObjectId(projectId)) {
    return { ok: false, status: 'INVALID_PROJECT' };
  }

  const project = await Project.findById(projectId).select('clientId assignedFreelancerId');
  if (!project) {
    return { ok: false, status: 'NOT_FOUND' };
  }

  const isClient = project.clientId.toString() === userId;
  const isFreelancer =
    project.assignedFreelancerId && project.assignedFreelancerId.toString() === userId;

  if (!isClient && !isFreelancer) {
    return { ok: false, status: 'FORBIDDEN' };
  }

  return { ok: true, project };
};

const normalizeMessage = (messageDoc) => ({
  _id: messageDoc._id,
  projectId: messageDoc.projectId.toString(),
  senderId: {
    _id: messageDoc.senderId._id,
    name: messageDoc.senderId.name,
    role: messageDoc.senderId.role,
  },
  text: messageDoc.text,
  createdAt: messageDoc.createdAt,
  updatedAt: messageDoc.updatedAt,
  clientMessageId: messageDoc.clientMessageId,
});

const registerChatSocketHandlers = (io, socketState) => {
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const activeConnections = socketState.addConnection(userId, socket.id);

    socket.data.joinedProjects = new Set();

    if (activeConnections === 1) {
      io.emit('user_status', { userId, isOnline: true });
    }

    socket.emit('online_users', { userIds: socketState.getOnlineUserIds() });

    socket.on('join_chat', async (payload = {}, ack = () => {}) => {
      try {
        const { projectId } = payload;
        const access = await canAccessProjectChat(projectId, userId);

        if (!access.ok) {
          return ack({ ok: false, error: access.status });
        }

        const room = toRoomName(projectId);
        socket.join(room);
        socket.data.joinedProjects.add(projectId);

        return ack({ ok: true, room });
      } catch (error) {
        return ack({ ok: false, error: 'JOIN_FAILED' });
      }
    });

    socket.on('leave_chat', (payload = {}, ack = () => {}) => {
      const { projectId } = payload;
      if (!projectId) {
        return ack({ ok: false, error: 'PROJECT_REQUIRED' });
      }

      socket.leave(toRoomName(projectId));
      socket.data.joinedProjects.delete(projectId);
      return ack({ ok: true });
    });

    socket.on('send_message', async (payload = {}, ack = () => {}) => {
      try {
        const { projectId, text, clientMessageId } = payload;
        const sanitizedText = typeof text === 'string' ? text.trim() : '';

        if (!projectId || !sanitizedText) {
          return ack({ ok: false, error: 'INVALID_PAYLOAD' });
        }

        const access = await canAccessProjectChat(projectId, userId);
        if (!access.ok) {
          return ack({ ok: false, error: access.status });
        }

        socket.join(toRoomName(projectId));
        socket.data.joinedProjects.add(projectId);

        let message = null;

        if (clientMessageId) {
          message = await Message.findOne({
            projectId,
            senderId: userId,
            clientMessageId,
          }).populate('senderId', 'name role');
        }

        if (!message) {
          message = await Message.create({
            projectId,
            senderId: userId,
            text: sanitizedText,
            ...(clientMessageId ? { clientMessageId } : {}),
          });

          message = await Message.findById(message._id).populate('senderId', 'name role');
        }

        const normalizedMessage = normalizeMessage(message);
        io.to(toRoomName(projectId)).emit('receive_message', normalizedMessage);

        return ack({ ok: true, message: normalizedMessage });
      } catch (error) {
        if (error && error.code === 11000) {
          try {
            const existingMessage = await Message.findOne({
              projectId: payload.projectId,
              senderId: userId,
              clientMessageId: payload.clientMessageId,
            }).populate('senderId', 'name role');

            if (existingMessage) {
              return ack({ ok: true, message: normalizeMessage(existingMessage) });
            }
          } catch (findError) {
            return ack({ ok: false, error: 'MESSAGE_FAILED' });
          }
        }

        return ack({ ok: false, error: 'MESSAGE_FAILED' });
      }
    });

    socket.on('typing_start', ({ projectId } = {}) => {
      if (!projectId || !socket.data.joinedProjects.has(projectId)) {
        return;
      }

      socket.to(toRoomName(projectId)).emit('typing_start', {
        projectId,
        userId,
        userName: socket.user.name,
      });
    });

    socket.on('typing_stop', ({ projectId } = {}) => {
      if (!projectId || !socket.data.joinedProjects.has(projectId)) {
        return;
      }

      socket.to(toRoomName(projectId)).emit('typing_stop', {
        projectId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      const { userId: disconnectedUserId, remainingSockets } = socketState.removeConnection(socket.id);

      if (disconnectedUserId && remainingSockets === 0) {
        io.emit('user_status', { userId: disconnectedUserId, isOnline: false });
      }
    });
  });
};

module.exports = registerChatSocketHandlers;
const userToSockets = new Map();
const socketToUser = new Map();

const addConnection = (userId, socketId) => {
  if (!userToSockets.has(userId)) {
    userToSockets.set(userId, new Set());
  }

  userToSockets.get(userId).add(socketId);
  socketToUser.set(socketId, userId);

  return userToSockets.get(userId).size;
};

const removeConnection = (socketId) => {
  const userId = socketToUser.get(socketId);
  if (!userId) {
    return { userId: null, remainingSockets: 0 };
  }

  socketToUser.delete(socketId);

  const sockets = userToSockets.get(userId);
  if (!sockets) {
    return { userId, remainingSockets: 0 };
  }

  sockets.delete(socketId);
  const remainingSockets = sockets.size;

  if (remainingSockets === 0) {
    userToSockets.delete(userId);
  }

  return { userId, remainingSockets };
};

const getSocketIdsForUser = (userId) => {
  const sockets = userToSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
};

const getOnlineUserIds = () => Array.from(userToSockets.keys());

module.exports = {
  addConnection,
  removeConnection,
  getSocketIdsForUser,
  getOnlineUserIds,
};
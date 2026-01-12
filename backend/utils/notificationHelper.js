const Notification = require('../models/Notification');

// Simple function to create a notification
const createNotification = async ({ userId, type, title, message, link }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
    });
    
    console.log('Notification created:', title);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = { createNotification };

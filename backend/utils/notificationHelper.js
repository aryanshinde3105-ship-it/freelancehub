const Notification = require('../models/Notification');

// Generic notification creator — used as the base for all helpers
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

// ─── Milestone-specific helpers ───────────────────────────────────────────────

/**
 * Notify the client when the freelancer submits milestone work.
 */
const notifyMilestoneSubmitted = (clientId, milestoneTitle, projectTitle, projectId) =>
  createNotification({
    userId: clientId,
    type: 'milestone',
    title: 'Milestone Work Submitted',
    message: `Milestone '${milestoneTitle}' has been submitted for review in project '${projectTitle}'.`,
    link: `/projects/${projectId}/milestones`,
  });

/**
 * Notify the freelancer when the client requests a revision.
 */
const notifyRevisionRequested = (freelancerId, milestoneTitle, projectTitle, projectId, revisionNotes) =>
  createNotification({
    userId: freelancerId,
    type: 'milestone',
    title: 'Revision Requested',
    message: `The client has requested a revision for milestone '${milestoneTitle}' in project '${projectTitle}'${revisionNotes ? `: "${revisionNotes}"` : '.'}`,
    link: `/projects/${projectId}/milestones`,
  });

/**
 * Notify the freelancer when the client approves a milestone.
 */
const notifyMilestoneApproved = (freelancerId, milestoneTitle, projectTitle, projectId) =>
  createNotification({
    userId: freelancerId,
    type: 'milestone',
    title: 'Milestone Approved',
    message: `Milestone '${milestoneTitle}' has been approved in project '${projectTitle}'. Payment will be released shortly.`,
    link: `/projects/${projectId}/milestones`,
  });

/**
 * Notify the freelancer when the client rejects a milestone.
 */
const notifyMilestoneRejected = (freelancerId, milestoneTitle, projectTitle, projectId) =>
  createNotification({
    userId: freelancerId,
    type: 'milestone',
    title: 'Milestone Rejected',
    message: `Milestone '${milestoneTitle}' was rejected in project '${projectTitle}'. Please review the client's feedback.`,
    link: `/projects/${projectId}/milestones`,
  });

module.exports = {
  createNotification,
  notifyMilestoneSubmitted,
  notifyRevisionRequested,
  notifyMilestoneApproved,
  notifyMilestoneRejected,
};

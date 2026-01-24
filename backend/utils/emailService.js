const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server ready to send messages');
  }
});

// Send email function
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId, 'to', options.to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  // 1. Welcome email
  welcome: (userName) => ({
    subject: 'Welcome to FreelanceHub! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">FreelanceHub</h1>
          <p style="color: #666; margin: 5px 0;">Milestone-Based Freelance Marketplace</p>
        </div>
        
        <h2 style="color: #4f46e5;">Welcome aboard, ${userName}! 🎉</h2>
        <p>Thank you for joining FreelanceHub - your go-to platform for milestone-based project management.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">What you can do now:</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>Complete your profile with skills and experience</li>
            <li>Browse available projects in your domain</li>
            <li>Post projects with milestone breakdowns</li>
            <li>Connect with clients or freelancers</li>
            <li>Manage secure milestone-based payments</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #4f46e5; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; 
                    font-weight: 600;">
            Go to Dashboard →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an MVP project built with MERN stack.<br>
          Questions or feedback? We'd love to hear from you!
        </p>
      </div>
    `,
  }),

  // 2. Project posted confirmation
  projectPosted: (userName, projectTitle, projectId) => ({
    subject: '✅ Project Posted Successfully - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Project Posted Successfully! 🎉</h2>
        <p>Hi ${userName},</p>
        <p>Your project has been posted and is now live on FreelanceHub.</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📋 ${projectTitle}</h3>
          <p style="color: #666; margin: 10px 0;">Freelancers can now view your project and submit proposals.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/projects/${projectId}" 
             style="background: #4f46e5; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            View Project →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          💡 Tip: Review proposals carefully and check freelancer profiles before accepting.
        </p>
      </div>
    `,
  }),

  // 3. New proposal received
  proposalReceived: (clientName, freelancerName, projectTitle, projectId) => ({
    subject: '🎯 New Proposal Received - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">New Proposal Received! 🎯</h2>
        <p>Hi ${clientName},</p>
        <p>Great news! A freelancer is interested in your project.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Freelancer:</strong> ${freelancerName}</p>
          <p style="margin: 5px 0;"><strong>Project:</strong> ${projectTitle}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/projects/${projectId}" 
             style="background: #10b981; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            Review Proposal →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Check their profile, ratings, and proposal details before making a decision.
        </p>
      </div>
    `,
  }),

  // 4. Proposal accepted
  proposalAccepted: (freelancerName, projectTitle, projectId) => ({
    subject: '🎉 Your Proposal Was Accepted! - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Congratulations! 🎉</h2>
        <p>Hi ${freelancerName},</p>
        <p>Great news! Your proposal has been accepted.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📋 ${projectTitle}</h3>
          <p style="color: #666; margin: 10px 0;">You can now start working on this project!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/projects/${projectId}" 
             style="background: #10b981; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            View Project Details →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          💡 Remember to track your progress through milestones and communicate regularly with the client.
        </p>
      </div>
    `,
  }),

  // 5. Milestone completed
  milestoneCompleted: (userName, projectTitle, milestoneTitle, amount) => ({
    subject: '✅ Milestone Completed - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Milestone Completed! ✅</h2>
        <p>Hi ${userName},</p>
        <p>A milestone has been marked as completed.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Project:</strong> ${projectTitle}</p>
          <p style="margin: 8px 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
          <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #10b981; font-size: 18px; font-weight: bold;">$${amount}</span></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #10b981; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            View Dashboard →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Payment will be processed through Stripe shortly.
        </p>
      </div>
    `,
  }),

  // 6. Password reset
  passwordReset: (userName, resetToken) => ({
    subject: '🔐 Password Reset Request - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Password Reset Request 🔐</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your FreelanceHub account.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            ⚠️ This link will expire in <strong>1 hour</strong> for security reasons.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
             style="background: #4f46e5; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            Reset Password →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; background: #f3f4f6; padding: 15px; border-radius: 6px;">
          🔒 <strong>Security Note:</strong> If you didn't request this password reset, 
          please ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `,
  }),

  // 7. Payment received
  paymentReceived: (freelancerName, projectTitle, amount, milestoneTitle) => ({
    subject: '💰 Payment Received - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Payment Received! 💰</h2>
        <p>Hi ${freelancerName},</p>
        <p>Great news! You've received a payment for your completed milestone.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Project:</strong> ${projectTitle}</p>
          <p style="margin: 8px 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
          <p style="margin: 8px 0; font-size: 24px; color: #10b981;">
            <strong>+$${amount}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #10b981; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            View Dashboard →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Payment has been processed via Stripe and will appear in your account within 2-3 business days.
        </p>
      </div>
    `,
  }),
  // Add this AFTER paymentReceived template, BEFORE the closing brace:

  


  // 8. Project completed/approved
  projectCompleted: (freelancerName, projectTitle) => ({
    subject: '🎉 Project Completed & Approved - FreelanceHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Project Completed! 🎉</h2>
        <p>Hi ${freelancerName},</p>
        <p>Congratulations! Your project has been approved by the client.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📋 ${projectTitle}</h3>
          <p style="color: #666; margin: 10px 0;">The client has approved your work. Great job!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/my-active-projects" 
             style="background: #10b981; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            View Project →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          💡 Don't forget to ask the client for a review to boost your profile!
        </p>
      </div>
    `,
  }),

  // 9. Generic notification (for custom use cases)
  notification: (title, message, actionUrl, actionText) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">${title}</h2>
        <p>${message}</p>
        ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" 
               style="background: #4f46e5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              ${actionText || 'View Details'}
            </a>
          </div>
        ` : ''}
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { notifyMilestoneApproved } = require('../utils/notificationHelper');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =====================
   CREATE RAZORPAY ORDER
   ===================== */
const createOrder = async (req, res) => {
  try {
    const { milestoneId } = req.body;

    // Get milestone
    const milestone = await Milestone.findById(milestoneId).populate('projectId');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Verify user is the project client
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can fund milestones' });
    }

    // Check if already paid
    if (milestone.payment.status !== 'pending') {
      return res.status(400).json({ message: 'Milestone already funded' });
    }

    // Create Razorpay order
    const options = {
      amount: milestone.amount * 100, // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: `milestone_${milestoneId}`,
      notes: {
        milestoneId: milestoneId.toString(),
        projectId: milestone.projectId._id.toString(),
        clientId: req.user.id,
      },
    };

    const order = await razorpay.orders.create(options);

    // Save order ID to milestone
    milestone.payment.razorpayOrderId = order.id;
    await milestone.save();

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount: milestone.amount,
      currency: 'INR',
      name: 'Freelance Hub',
      description: `Payment for: ${milestone.title}`,
      milestoneId,
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

/* =====================
   VERIFY PAYMENT
   ===================== */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      milestoneId,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Update milestone
    const milestone = await Milestone.findById(milestoneId);
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    milestone.payment.razorpayPaymentId = razorpay_payment_id;
    milestone.payment.razorpaySignature = razorpay_signature;
    milestone.payment.status = 'paid';
    milestone.payment.paidAt = new Date();
    milestone.status = 'funded'; // Now freelancer can start work

    await milestone.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      milestone,
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

/* =====================
   RELEASE PAYMENT (Auto on Approval)
   ===================== */
const releasePayment = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const milestone = await Milestone.findById(milestoneId).populate('projectId');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Verify user is the project client
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if already released
    if (milestone.payment.status === 'released') {
      return res.status(400).json({ message: 'Payment already released' });
    }

    // Check if paid
    if (milestone.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Milestone not paid yet' });
    }

    // Milestone must be submitted before the client can approve and release payment
    if (milestone.status !== 'submitted') {
      return res.status(400).json({
        message: `Cannot release payment: milestone must be submitted for review first (current status: ${milestone.status})`,
      });
    }

    // Mark as released (in real app, you'd transfer to freelancer's account)
    milestone.payment.status = 'released';
    milestone.payment.releasedAt = new Date();
    milestone.status = 'approved';
    milestone.completedAt = new Date();

    await milestone.save();

    // Notify the freelancer that payment has been released
    if (milestone.projectId.assignedFreelancerId) {
      await notifyMilestoneApproved(
        milestone.projectId.assignedFreelancerId,
        milestone.title,
        milestone.projectId.title,
        milestone.projectId._id
      );
    }

    // Auto-complete the project when every milestone is approved or cancelled
    const allMilestones = await Milestone.find({ projectId: milestone.projectId._id });
    const allResolved = allMilestones.every(
      (m) => m.status === 'approved' || m.status === 'cancelled'
    );
    if (allResolved && allMilestones.length > 0) {
      milestone.projectId.status = 'completed';
      await milestone.projectId.save();
    }

    res.json({
      success: true,
      message: 'Payment released to freelancer',
      milestone,
      projectCompleted: allResolved,
    });

  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ message: 'Failed to release payment', error: error.message });
  }
};

/* =====================
   REFUND PAYMENT
   Called when client cancels a milestone that was already paid (status = 'paid').
   Issues a full refund via Razorpay and marks the milestone payment as 'refunded'.
   ===================== */
const refundPayment = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const milestone = await Milestone.findById(milestoneId).populate('projectId');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Only the project client may request a refund
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only refund if a captured payment exists
    if (milestone.payment.status !== 'paid') {
      return res.status(400).json({
        message: `Cannot refund a payment with status: ${milestone.payment.status}`,
      });
    }

    if (!milestone.payment.razorpayPaymentId) {
      return res.status(400).json({ message: 'No Razorpay payment ID found on this milestone' });
    }

    // Issue full refund via Razorpay
    const refund = await razorpay.payments.refund(milestone.payment.razorpayPaymentId, {
      amount: milestone.amount * 100, // full refund in paise
      notes: {
        reason: 'Milestone cancelled by client',
        milestoneId: milestoneId.toString(),
      },
    });

    // Persist refund details
    milestone.payment.status = 'refunded';
    milestone.payment.refundedAt = new Date();
    milestone.payment.razorpayRefundId = refund.id;
    await milestone.save();

    res.json({
      success: true,
      message: 'Refund initiated successfully',
      refundId: refund.id,
      milestone,
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Failed to initiate refund', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  releasePayment,
  refundPayment,
};

// Notification Flow Builder - Core Application Logic

// State management
let currentStep = 1;
const state = {
    email: '',
    phone: '',
    txnId: '',
    orderId: '',
    amount: 0,
    eventType: '',
    message: '',
    channels: []
};

// DOM Elements
const stepContents = document.querySelectorAll('.step-content');
const stepIndicators = document.querySelectorAll('[data-step]');
const progressBars = [
    document.getElementById('progressBar1'),
    document.getElementById('progressBar2'),
    document.getElementById('progressBar3'),
    document.getElementById('progressBar4'),
];
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const sendBtn = document.getElementById('sendBtn');
const activityLog = document.getElementById('activityLog');
const payloadPreview = document.getElementById('payloadPreview');
const contactError = document.getElementById('contactError');
const eventError = document.getElementById('eventError');
const channelError = document.getElementById('channelError');

// Message templates - FIXED non-editable, compliance-aligned templates
const messageTemplates = {
    payment_success: (name = 'Valued customer') => `Hi ${name},

Great news! We've successfully received your payment of €${state.amount} for order #${state.orderId}.

We're now processing your order and will send you a shipping confirmation as soon as it's on its way.

View your order: https://example.com/orders/${state.orderId}

Thank you for your purchase!`,
    order_shipped: (name = 'Valued customer') => `Hi ${name},

Good news! Your order #${state.orderId} has been shipped!

You can track your delivery here: https://example.com/track/${state.orderId}

Expected delivery: 2-3 business days.

Let us know if you have any questions!`,
    security_alert: (name = 'User') => `Hi ${name},

We detected a login attempt to your account from a new device in Amsterdam, Netherlands at ${new Date().toLocaleString()}.

If this was you, you can ignore this message. If you didn't make this attempt, please reset your password immediately and contact support: https://example.com/security

This is an automated security alert.`,
    password_reset: (name = 'User') => `Hi ${name},

We received a request to reset your password.

Use the link below to set a new password. This link will expire in 1 hour: https://example.com/reset/${Math.random().toString(36).substring(2,12)}

If you didn't request a password reset, you can safely ignore this email - your password won't be changed.`,
    appointment_reminder: (name = 'Valued customer') => `Hi ${name},

This is a reminder that you have an appointment scheduled tomorrow at 14:00.

Location: Our office at Zandvoort 123

If you need to reschedule, please do so at least 2 hours before your appointment: https://example.com/appointments/${state.txnId}

We look forward to seeing you!`
};

const eventNames = {
    payment_success: 'Payment Successful',
    order_shipped: 'Order Shipped',
    security_alert: 'Security Alert',
    password_reset: 'Password Reset',
    appointment_reminder: 'Appointment Reminder'
};

// Utility functions
function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    let icon = '•';
    let color = 'text-gray-300';
    
    if (type === 'success') {
        icon = '✅';
        color = 'text-green-400';
    } else if (type === 'loading') {
        icon = '🔄';
        color = 'text-blue-400';
    } else if (type === 'warning') {
        icon = '⚠️';
        color = 'text-yellow-400';
    } else if (type === 'event') {
        icon = '📋';
        color = 'text-purple-400';
    } else if (type === 'message') {
        icon = '✉️';
        color = 'text-green-400';
    } else if (type === 'send') {
        icon = '🚀';
        color = 'text-blue-400';
    }

    const logEntry = document.createElement('div');
    logEntry.className = color;
    logEntry.innerHTML = `<span class="text-gray-500">[${time}]</span> ${icon} ${message}`;
    activityLog.appendChild(logEntry);
    activityLog.scrollTop = activityLog.scrollHeight;
}

function updatePayload() {
    const payload = {
        transaction_id: state.txnId || null,
        recipient: {
            email: state.email || null,
            phone: state.phone || null
        },
        event_type: state.eventType || null,
        message: state.message || null,
        channels: state.channels.length ? state.channels : null,
        metadata: {
            order_id: state.orderId || null,
            amount: state.amount || null,
            timestamp: new Date().toISOString()
        }
    };

    // Simple syntax highlighting for JSON preview
    let jsonStr = JSON.stringify(payload, null, 2);
    jsonStr = jsonStr.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:');
    jsonStr = jsonStr.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>');
    jsonStr = jsonStr.replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>');
    jsonStr = jsonStr.replace(/: (null|true|false)/g, ': <span class="json-boolean">$1</span>');
    
    payloadPreview.innerHTML = jsonStr;
}

function updateStepUI() {
    // Hide all steps
    stepContents.forEach(step => step.classList.add('hidden'));
    // Show current step
    document.getElementById(`step${currentStep}`).classList.remove('hidden');

    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('step-active', 'step-completed', 'step-upcoming');
        if (stepNum < currentStep) {
            indicator.classList.add('step-completed');
            indicator.innerHTML = '<i class="fa fa-check"></i>';
        } else if (stepNum === currentStep) {
            indicator.classList.add('step-active');
            indicator.textContent = stepNum;
        } else {
            indicator.classList.add('step-upcoming');
            indicator.textContent = stepNum;
        }
    });

    // Update progress bars
    progressBars.forEach((bar, index) => {
        if (index < currentStep - 1) {
            bar.style.width = '100%';
        } else {
            bar.style.width = '0%';
        }
    });

    // Update button visibility
    backBtn.classList.toggle('hidden', currentStep === 1);
    nextBtn.classList.toggle('hidden', currentStep === 5);
    sendBtn.classList.toggle('hidden', currentStep !== 5);

    // Reset success view when moving to step 5
    if (currentStep === 5) {
        document.getElementById('confirmView').classList.remove('hidden');
        document.getElementById('sendingView').classList.add('hidden');
        document.getElementById('successView').classList.add('hidden');
        updateReview();
    }

    // Step 2: simulate transaction start
    if (currentStep === 2 && !state.txnId) {
        document.getElementById('transactionLoading').classList.remove('hidden');
        document.getElementById('eventSelection').classList.add('hidden');
        addLog('Transaction started, initializing notification flow', 'loading');
        
        setTimeout(() => {
            state.txnId = 'txn_' + Math.random().toString(36).substring(2, 8);
            state.orderId = 'ORD-' + Math.floor(Math.random() * 100000);
            state.amount = (Math.random() * 100 + 10).toFixed(2);
            
            document.getElementById('txnIdDisplay').textContent = state.txnId;
            document.getElementById('transactionLoading').classList.add('hidden');
            document.getElementById('eventSelection').classList.remove('hidden');
            
            addLog(`Transaction initialized: ID ${state.txnId}, amount €${state.amount}`, 'success');
            updatePayload();
        }, 1500);
    }
}

function updateReview() {
    document.getElementById('reviewTxnId').textContent = state.txnId;
    document.getElementById('reviewRecipient').textContent = [state.email, state.phone].filter(Boolean).join(', ') || 'None';
    document.getElementById('reviewEvent').textContent = eventNames[state.eventType] || 'None';
    document.getElementById('reviewChannels').textContent = state.channels.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') || 'None';
    document.getElementById('reviewMessage').textContent = state.message || 'No message';
}

function validateStep() {
    let valid = true;
    
    if (currentStep === 1) {
        state.email = document.getElementById('email').value.trim();
        state.phone = document.getElementById('phone').value.trim();
        
        if (!state.email && !state.phone) {
            contactError.classList.remove('hidden');
            valid = false;
        } else {
            contactError.classList.add('hidden');
            if (state.email) addLog(`Captured contact: email=${state.email}`, 'success');
            if (state.phone) addLog(`Captured contact: phone=${state.phone}`, 'success');
        }
    } else if (currentStep === 2) {
        const selectedEvent = document.querySelector('input[name="eventType"]:checked');
        if (!selectedEvent) {
            eventError.classList.remove('hidden');
            valid = false;
        } else {
            eventError.classList.add('hidden');
            state.eventType = selectedEvent.value;
            addLog(`Selected event type: ${eventNames[state.eventType]}`, 'event');
            
            // Populate fixed, non-editable message template
            state.message = messageTemplates[state.eventType]();
            document.getElementById('messagePreview').textContent = state.message;
            addLog(`Matched fixed message template for ${state.eventType}, dynamic fields populated automatically. Message is locked per policy — no edits allowed`, 'message');
        }
    } else if (currentStep === 3) {
        addLog('Message template validated, no edits required (fixed standard template) — proceeding to channel selection', 'message');
    } else if (currentStep === 4) {
        state.channels = Array.from(document.querySelectorAll('input[name="channel"]:checked')).map(c => c.value);
        
        // Validate channels match provided contact info
        let validChannels = [...state.channels];
        const emailWarning = document.querySelector('.email-warning');
        const smsWarning = document.querySelector('.sms-warning');
        
        emailWarning.classList.add('hidden');
        smsWarning.classList.add('hidden');

        if (state.channels.includes('email') && !state.email) {
            emailWarning.classList.remove('hidden');
            validChannels = validChannels.filter(c => c !== 'email');
            addLog('Email channel selected but no email provided - removing email from delivery list', 'warning');
        }

        if (state.channels.includes('sms') && !state.phone) {
            smsWarning.classList.remove('hidden');
            validChannels = validChannels.filter(c => c !== 'sms');
            addLog('SMS channel selected but no phone number provided - removing SMS from delivery list', 'warning');
        }

        state.channels = validChannels;

        if (state.channels.length === 0) {
            channelError.classList.remove('hidden');
            valid = false;
        } else {
            channelError.classList.add('hidden');
            addLog(`Selected delivery channels: ${state.channels.join(', ')}`, 'success');
        }
    }

    updatePayload();
    return valid;
}

// Event listeners
nextBtn.addEventListener('click', () => {
    if (validateStep()) {
        currentStep++;
        updateStepUI();
        updatePayload();
    }
});

backBtn.addEventListener('click', () => {
    currentStep--;
    updateStepUI();
    updatePayload();
});

sendBtn.addEventListener('click', () => {
    document.getElementById('confirmView').classList.add('hidden');
    document.getElementById('sendingView').classList.remove('hidden');
    addLog('Constructed queue payload, validated against message schema contract', 'loading');

    setTimeout(() => {
        addLog('Published message to notification queue (exchange: notifications.events)', 'send');
    }, 800);

    setTimeout(() => {
        if (state.channels.includes('email')) {
            addLog('Email worker picked up message, queued for SendGrid delivery', 'success');
        }
        if (state.channels.includes('sms')) {
            addLog('SMS worker picked up message, queued for Twilio delivery', 'success');
        }
        if (state.channels.includes('push')) {
            addLog('Push worker picked up message, queued for Firebase delivery', 'success');
        }
    }, 1600);

    setTimeout(() => {
        addLog('All notifications delivered successfully, message marked as complete', 'success');
        document.getElementById('sendingView').classList.add('hidden');
        document.getElementById('successView').classList.remove('hidden');
    }, 2500);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    // Reset application state
    currentStep = 1;
    state.email = '';
    state.phone = '';
    state.txnId = '';
    state.orderId = '';
    state.amount = 0;
    state.eventType = '';
    state.message = '';
    state.channels = [];

    // Reset form inputs
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.querySelectorAll('input[name="eventType"]').forEach(r => r.checked = false);
    document.getElementById('messagePreview').textContent = '';
    document.querySelectorAll('input[name="channel"]').forEach(c => c.checked = false);

    addLog('Flow reset, ready for new notification');
    updateStepUI();
    updatePayload();
});

// Live payload update listeners
document.getElementById('email').addEventListener('input', updatePayload);
document.getElementById('phone').addEventListener('input', updatePayload);
document.querySelectorAll('input[name="channel"]').forEach(checkbox => {
    checkbox.addEventListener('change', updatePayload);
});
document.querySelectorAll('input[name="eventType"]').forEach(radio => {
    radio.addEventListener('change', updatePayload);
});

// Initialize application on page load
document.addEventListener('DOMContentLoaded', () => {
    addLog('App initialized, ready for user input');
    updateStepUI();
    updatePayload();
});

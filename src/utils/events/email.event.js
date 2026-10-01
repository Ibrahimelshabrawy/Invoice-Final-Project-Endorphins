import { EventEmitter } from 'node:events';
import { EmailEnum } from '../enum/email.enum.js';

export const emailEventEmitter = new EventEmitter();

// Background event listener for invoice email sending
emailEventEmitter.on(EmailEnum.SEND_INVOICE, async (fn) => {
  try {
    if (typeof fn === 'function') {
      await fn();
    }
  } catch (error) {
    console.error('[EMAIL BACKGROUND EVENT ERROR]:', error.message || error);
  }
});

export default emailEventEmitter;

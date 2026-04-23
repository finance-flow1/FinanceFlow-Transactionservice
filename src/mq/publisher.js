const amqp   = require('amqplib');
const logger = require('../utils/logger');

const QUEUE = 'notifications';
const URL   = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

let channel    = null;
let connecting = false;

/* ── Connect with auto-reconnect ───────────────────────── */
async function connect() {
  if (connecting) return;
  connecting = true;
  try {
    const conn = await amqp.connect(URL);
    const ch   = await conn.createChannel();
    await ch.assertQueue(QUEUE, { durable: true }); // survive broker restarts

    channel    = ch;
    connecting = false;
    logger.info('RabbitMQ publisher connected ✓');

    conn.on('error', (err) => {
      logger.warn(`RabbitMQ publisher connection error: ${err.message}`);
      channel = null; connecting = false;
      setTimeout(connect, 5_000);
    });
    conn.on('close', () => {
      logger.warn('RabbitMQ publisher connection closed, reconnecting…');
      channel = null; connecting = false;
      setTimeout(connect, 5_000);
    });
  } catch (err) {
    logger.warn(`RabbitMQ publisher connect failed: ${err.message}. Retrying in 5s…`);
    connecting = false;
    setTimeout(connect, 5_000);
  }
}

/* ── Publish a notification payload ────────────────────── */
function publish(payload) {
  if (!channel) {
    logger.warn('RabbitMQ not ready — notification skipped');
    return;
  }
  try {
    channel.sendToQueue(
      QUEUE,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }         // message survives broker restart
    );
  } catch (err) {
    logger.warn(`RabbitMQ publish failed: ${err.message}`);
  }
}

module.exports = { connect, publish };

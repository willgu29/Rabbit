var url = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';

module.exports = createQueueChannel;

function createQueueChannel(queue, cb) {
  amqp.connect(url, onceConnected);

  function onceConnected(err, conn) {
    if (err) {
      cb(err);
    }
    else {
      console.log('connected');
    }
  }
}

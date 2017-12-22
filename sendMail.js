#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var email = {
  id: '12345',
  sender: 'Will <will@penguinjeffrey.com>',
  to: 'willgu29@gmail.com'
}
var subject = 'Hello from Will'
var html = '<p>Testing from Trackview</p>'

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'send_mail';
    var object = {
      email: email,
      subject: subject,
      html: html
    }

    ch.assertQueue(q, {durable: true});
    // Note: on Node 6 Buffer.from(msg) should be used
    ch.sendToQueue(q, Buffer.from(JSON.stringify(object)), {persistent: true});
    console.log(" [x] Sent " + object);
  });
  setTimeout(function() { conn.close(); process.exit(0) }, 500);

});

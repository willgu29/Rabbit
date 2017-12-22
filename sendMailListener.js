#!/usr/bin/env node
require('dotenv').config()
var amqp = require('amqplib/callback_api');
var nodemailer = require('nodemailer');
var axios = require('axios')

var url = process.env.AMQP_URL || ('amqp://' + process.env.AMQP_USER + ":" + process.env.AMQP_PW + '@localhost:5672');

amqp.connect(url, function(err, conn) {
  console.log(err)
  conn.createChannel(function(err, ch) {
    var q = 'send_mail';

    ch.assertQueue(q, {durable: true});
    ch.prefetch(1); // waits for task to finish before unloading next in queue
    console.log(" [*] Waiting for emails in %s. To exit press CTRL+C", q);
    ch.consume(q, function(data) {
      var object = JSON.parse(data.content.toString());
      var email = object.email
      console.log(" [x] Received %s", JSON.stringify(object));
      sendMail(email._id, email.sender, email.to, object.subject, object.html)
      ch.ack(data);
      console.log(" [x] Done sending email")
    }, {noAck: false});
    });
});


let transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 25,
    secure: false,
    tls: {
      rejectUnauthorized:false
    },
    name: "penguinjeffrey.com",
    dkim: {
      domainName: 'penguinjeffrey.com',
      keySelector: 'mail',
      privateKey: `-----BEGIN RSA PRIVATE KEY-----
      MIICXgIBAAKBgQDi/oIAkxUb/2WhCFjZaA07mSteuVY/nJgsUMLzb2hBRAdqdqmJ
      UdzHfkKqihZItJ5xG7TYDbr6okZZSNaFcld0g9zw7wDIG4fQcFj9UmKrhMQhooPr
      oKjvRhwAJG/rnXhw4fuB2Zw7urA3jR5SUi/Gf4JCDBdHB34TroouExb/mwIDAQAB
      AoGBALC9odN4sjL+hM8BhMyia8s/07kJbdJRx1qZ93E8CVzn7y5B/ndhOhpKgPXw
      VrF9kPBYtlKTPkbwGv5h7EYzZUtnYINMbrT+RRc/taxsJoqrM0Dw3FOhlO5VIM7v
      YvNEKsnomjajlm35FEuGYlMWRBVnyuw08POZudT+9EvkzhBBAkEA/+a1kUCSz/S+
      DPbzDAQ2tWO55BWuRllUQeJOGC0crCrbJWj2wguETzHYsYao5oFMZTMHfJ2tgni9
      hQv0Kg91YwJBAOMU8RJoXa+ew3WE78v7pnfaWq3tySH/vNb/a16WjnNKGlM3yD+d
      T50Wwms5x3BC1kXk7oFxKyzwEk9p++V83mkCQAhOJZBsRxeGuvBSx3qZXGkwrmTP
      q1NPLOPig2RXenm//lLNgEy18PpdBMpmM28fvSn/qPuLZok4f/YkeC0xST8CQQDA
      8RYz0cFoarkgrSciZlt3Emxhw9xVqvlEpBkScVHv21Kqyoa2pm7yxlfCy4ENfXya
      Pn34NbO9pu2n1CFXR9WhAkEA5PtaN+LI05DaWeyk2CW7e9n5DRqggj8O6LfVELRd
      DPMAyDSy2bU2uO3YxCEfFajjuCgAeictIxoAajllt6/ZyA==
      -----END RSA PRIVATE KEY-----`
    }
})

function sendMail (mailId, from, to, subject, html) {
  var trackingUrl = ('https://mail.penguinjeffrey.com/api/mails/tracking.gif?id=' + mailId)
  var trackingCode = '<img src="' + trackingUrl + '" alt="Sent by Penguin Jeffrey" />'
  var unsubscribeUrl = ('https://mail.penguinjeffrey.com/unsubscribe?id=' + mailId)
  var unsubscribeCode = ('<a style="text-align: center;" href="' + unsubscribeUrl + '">Unsubscribe</a>')
  var html = html + trackingCode + unsubscribeCode
  console.log(html)

  // setup email data with unicode symbols
  let mailOptions = {
      from: from || '"Will Gu" <will@penguinjeffrey.com>', // sender address
      to: to,
      subject: subject,
      text: 'This email requires html to be displayed!',
      html: html, // html body
      replyTo: from
  }

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error)
      }
      console.log('Message %s sent: %s', info.messageId, info.response)
      console.log(mailId)
      axios.post('https://mail.penguinjeffrey.com/api/mails/sent', {
        id: mailId
      }).then(function (res) {
        console.log(res.data)
      }).catch(function (err) {
        console.log(err)
      })
  })
}

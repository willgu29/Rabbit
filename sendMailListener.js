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
    ch.prefetch(5); // waits for task to finish before unloading next in queue
    console.log(" [*] Waiting for emails in %s. To exit press CTRL+C", q);
    ch.consume(q, function(data) {
      var object = JSON.parse(data.content.toString());
      var email = object.email
      console.log(" [x] Received " + email._id);
      sendMail(email._id, email.sender, email.to, object.subject, object.html)
      ch.ack(data);
    }, {noAck: false});
    });
});


let transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 587,
    secure: false,
    pool: true,
    maxConnections: 20,
    rateDelta: 1000, //1 second
    rateLimit: 15,
    maxMessages: Infinity,
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
  // var trackingUrl = ('https://mail.penguinjeffrey.com/api/mails/tracking.gif?id=' + mailId)
  // var trackingCode = '<img src="' + trackingUrl + '" alt="Sent by Penguin Jeffrey" />'
  // var unsubscribeUrl = ('https://mail.penguinjeffrey.com/unsubscribe?id=' + mailId)
  // var unsubscribeCode = ('<a style="text-align: center;" href="' + unsubscribeUrl + '">Unsubscribe</a>')
  // var html = html + trackingCode + unsubscribeCode
  // console.log(html)
  var strippedHTML = html.replace(/<[^>]+>/g, '');
  //TODO: decode entities

  let mailOptions = {
      from: from || '"Will Gu" <will@penguinjeffrey.com>', // sender address
      to: to,
      subject: subject,
      text: strippedHTML,
      html: createHTML(mailId, subject, html), // html
      replyTo: from
  }

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error)
      }
      console.log('Message %s sent: %s %s', info.messageId, info.response, mailId)
      axios.post('https://mail.penguinjeffrey.com/api/mails/sent', {
        id: mailId
      }).then(function (res) {
        console.log('[+] updated sent')
      }).catch(function (err) {
        console.log('[x] ERROR:')
      })
  })
}

function createHTML (mailId, subject, html) {
  var html = createHeader(subject) + createBody(mailId, html)
  return html
}

function createBody (mailId, html) {
  var body = (`<body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
      <tr>
        <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
        <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
          <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">

            <!-- START CENTERED WHITE CONTAINER -->
            <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;"></span>
            <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">

              <!-- START MAIN CONTENT AREA -->
              ` + html + `

            <!-- END MAIN CONTENT AREA -->
            </table>

            <!-- START FOOTER -->
            ` + createFooter(mailId) + `
            <!-- END FOOTER -->

          <!-- END CENTERED WHITE CONTAINER -->
          </div>
        </td>
        <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
      </tr>
    </table>
  </body> </html>`)
  return body;
}

function createHeader (subject) {
  var header = (`<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>` + subject + `</title>
      <style>
      /* -------------------------------------
          INLINED WITH htmlemail.io/inline
      ------------------------------------- */
      /* -------------------------------------
          RESPONSIVE AND MOBILE FRIENDLY STYLES
      ------------------------------------- */
      @media only screen and (max-width: 620px) {
        table[class=body] h1 {
          font-size: 28px !important;
          margin-bottom: 10px !important;
        }
        table[class=body] p,
              table[class=body] ul,
              table[class=body] ol,
              table[class=body] td,
              table[class=body] span,
              table[class=body] a {
          font-size: 16px !important;
        }
        table[class=body] .wrapper,
              table[class=body] .article {
          padding: 10px !important;
        }
        table[class=body] .content {
          padding: 0 !important;
        }
        table[class=body] .container {
          padding: 0 !important;
          width: 100% !important;
        }
        table[class=body] .main {
          border-left-width: 0 !important;
          border-radius: 0 !important;
          border-right-width: 0 !important;
        }
        table[class=body] .btn table {
          width: 100% !important;
        }
        table[class=body] .btn a {
          width: 100% !important;
        }
        table[class=body] .img-responsive {
          height: auto !important;
          max-width: 100% !important;
          width: auto !important;
        }
      }
      /* -------------------------------------
          PRESERVE THESE STYLES IN THE HEAD
      ------------------------------------- */
      @media all {
        .ExternalClass {
          width: 100%;
        }
        .ExternalClass,
              .ExternalClass p,
              .ExternalClass span,
              .ExternalClass font,
              .ExternalClass td,
              .ExternalClass div {
          line-height: 100%;
        }
        .apple-link a {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-decoration: none !important;
        }
        .btn-primary table td:hover {
          background-color: #34495e !important;
        }
        .btn-primary a:hover {
          background-color: #34495e !important;
          border-color: #34495e !important;
        }
      }
      </style>
    </head>`)
    return header
}

function createFooter (mailId) {
  var unsubscribeUrl = ('https://mail.penguinjeffrey.com/unsubscribe?id=' + mailId)
  var trackingUrl = ('https://mail.penguinjeffrey.com/api/mails/tracking.gif?id=' + mailId)
  var trackingCode = '<img src="' + trackingUrl + '" alt="Sent by Penguin Jeffrey" />'

  var footer = (`
  <div class="footer" style="clear: both; Margin-top: 10px; text-align: center; width: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
      <tr>
        <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; font-size: 12px; color: #999999; text-align: center;">
          <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">Cybrook Inc 3401 El Camino Real Palo Alto, CA 94306 USA</span>
          <br><a href="` + unsubscribeUrl + `" style="text-decoration: underline; color: #999999; font-size: 12px; text-align: center;">Unsubscribe</a>.
        </td>
      </tr>
    </table>` + trackingCode + `
  </div>
  `)
  return footer;
  /*
  <tr>
    <td class="content-block powered-by" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; font-size: 12px; color: #999999; text-align: center;">
      Powered by <a href="https://www.penguinjeffrey.com/" style="color: #999999; font-size: 12px; text-align: center; text-decoration: none;">Penguin Jeffrey</a>.
    </td>
  </tr>
  */
}

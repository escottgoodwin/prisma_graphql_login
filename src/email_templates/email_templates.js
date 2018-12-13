const pswdResetEmail =
  `<html>
  <head>
    <title>Your password has been reset</title>
  </head>
  <body>
    <p>Hi ${userResetUpdate.firstName} ${userResetUpdate.lastName},</p>
    <p>Your password has been reset.</a></p>
    <p>If this is an error, please contact us.</p>
  </body>
  </html>`

  const acctConfirmationEmail =
    `<html>
    <head>
      <title>Your account email has been confirmed</title>
    </head>
    <body>
      <p>Hi ${confirmUser.firstName} ${confirmUser.lastName},</p>
      <p>Please login: <a href="https://example.com/login">Login</a></p>
    </body>
    </html>`

  module.exports = {
    acctConfirmationEmail,
    pswdResetEmail
  }

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { APP_SECRET, getUserId, getUser } = require('../utils')
const util = require('util');
const sgMail = require('@sendgrid/mail');

function sendGridSend(msg){

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msgSg = {
    to: msg.to,
    from: 'help@example.com',
    subject:msg.subject,
    text: msg.text,
    html:msg.html,
    };

    sgMail.send(msgSg);
  }


async function signup(parent, args, ctx, info) {

  const signUpDate = new Date()

  const password = await bcrypt.hash(args.password, 10)

  const confirmationToken = await crypto.randomBytes(20).toString('hex')
  const tokenExpirationTime = signUpDate
  tokenExpirationTime.setHours(signUpDate.getHours() + 2);

  const user = await ctx.db.mutation.createUser({
    data: { ...args,
          password,
          signUpDate,
          confirmationToken,
          tokenExpirationTime,
          },
  }, `{ id firstName lastName email confirmed }`)

// email template - use your own
  const htmlEmail =
    `<html>
    <head>
      <title>Confirm your email address</title>
    </head>
    <body>
      <p>Hi ${ user.firstName} ${ user.lastName },</p>
      <p><a href="https://example.com/reset?token=${confirmationToken}&email=${user.email}">Click here to confirm your email address.</a></p>
      <p>This token will expire in 2 hours.</p>
    </body>
    </html>`

// complete message for send grid. Customize for different email service
  const msg = {
    to: args.email,
    subject: 'Confirm your email address',
    text: `Click on this link to resend your password https://example.com/reset?token=${confirmationToken}&email=${user.email} This token will expire in 2 hours.`,
    html: htmlEmail,
  };

  sendGridSend(msg)

  //message that returns for display on the frontend
  signUpRequestMsg = `${user.firstName} ${user.lastName}, thank you for signing up. We will send you an email confirmation. Once you confirm your email address, you will be able to login.`

  return {
    authMsg: signUpRequestMsg,
    user
  }

}

async function newPasswordRequest(parent, args, ctx, info) {

  const resetUser = await ctx.db.query.user( { where: { email: args.email } } ,
  `{ id }`)

  if (!resetUser) {
    throw new Error(`No such user found`)
  }
  // A reset token is put in a link in new password request email below.
  // The token is used to query the user when the pasword is being reset.
  const resetToken = await crypto.randomBytes(20).toString('hex')
  const now = new Date()
  const tokenExpirationTime = now
  //You can set your own expiration time in hours.
  tokenExpirationTime.setHours(tokenExpirationTime.getHours() + 2);

  const userResetUpdate = await ctx.db.mutation.updateUser(
    {
      data: {
        resetToken,
        tokenExpirationTime,
      },
      where: {
        id: resetUser.id
      },
    },
    `{ id firstName lastName email }`
  )

  const htmlEmail =
    `<html>
    <head>
      <title>Reset your password</title>
    </head>
    <body>
      <p>Hi ${userResetUpdate.firstName} ${userResetUpdate.lastName},</p>
      <p><a href="https://example.com/reset?token=${resetToken}&email=${userResetUpdate.email}">Click here to reset your password.</a></p>
      <p>This token will expire in 2 hours.</p>
    </body>
    </html>`

  const msg = {
    to: userResetUpdate.email,
    subject: 'Reset password request',
    text: `Click on this link to resent your password https://example.com/reset?token=${resetToken}&email=${userResetUpdate.email} This token will expire in 2 hours.`,
    html: htmlEmail,
  };

  sendGridSend(msg)

  resetRequestMsg = userResetUpdate.firstName + ' ' + userResetUpdate.lastName + ', you have requested to reset your password. Please check for a reset email. Click the link in the email to reset your password.'

  return {
    authMsg: resetRequestMsg,
    user: userResetUpdate
  }

}

async function resetPassword(parent, args, ctx, info) {

  const now = new Date()
  //Queries with the reset token that should be passed from clicking on the new password request link above.
  const resetUser  = await ctx.db.query.users(
    {
      where: {
        email: args.email,
        resetToken: args.resetToken,
        tokenExpirationTime_gte: now
    }
  },
    `{ id email }`
  )

  if (resetUser.length<1) {
    throw new Error(`Email confirmation error. Please try again.`)
  }
  // New submitted password is encrypted.
  const password = await bcrypt.hash(args.resetPassword, 10)

  const userResetUpdate = await ctx.db.mutation.updateUser(
    {
      data: {
        password,
        resetToken: null,
        tokenExpirationTime: null,
      },
      where: {
        id: resetUser[0].id
      },
    },
    `{ id firstName lastName email }`
  )

  const htmlEmail =
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

  const msg = {
    to: args.email,
    subject: 'Password reset',
    text: 'Your password has been reset. If this is an error, please contact us.',
    html: htmlEmail,
  };

  sendGridSend(msg)
  // Message to display on the front end after passord has been reset.
  resetRequestMsg = `${userResetUpdate.firstName} ${userResetUpdate.lastName}, you have reset your password.`

  return {
    authMsg: resetRequestMsg,
    user: userResetUpdate
  }

}

async function confirmEmail(parent, args, ctx, info) {

  const now = new Date()

  const confirmUser1 = await ctx.db.query.users(
    {
      where: {
        email: args.email,
        confirmationToken: args.confirmationToken,
        tokenExpirationTime_gte: now
    }
  },
    `{ id }`
  )

  if (confirmUser1.length<1) {
    throw new Error(`Email confirmation error. Please try again.`)
  }

  const confirmUser = await ctx.db.mutation.updateUser(
    {
      data: {
        confirmed:true,
        confirmationToken: null,
        tokenExpirationTime: null,
      },
      where: {
        id: confirmUser1[0].id
      },
    },
    `{ id firstName lastName email role confirmed }`
  )

  const htmlEmail =
    `<html>
    <head>
      <title>Your account email has been confirmed</title>
    </head>
    <body>
      <p>Hi ${confirmUser.firstName} ${confirmUser.lastName},</p>
      <p>Please login: <a href="https://example.com/login">Login</a></p>
    </body>
    </html>`

  const msg = {
    to: args.email,
    subject: 'Account confirmed',
    text: 'Your account has been confirmed. Please login in at https://example.com/login',
    html: htmlEmail,
  };

  sendGridSend(msg)

  confirmRequestMsg = `${confirmUser.firstName} ${confirmUser.lastName}, your account has been confirmed. Please login <a href="https://example.com/login">Login</a>.`

  return {
    authMsg: confirmRequestMsg,
    user: confirmUser
  }

}

async function login(parent, args, ctx, info) {
  const lastLogin = new Date()

  const user = await ctx.db.query.user(
    {
      where: {
        email: args.email,
      }
    }, ` { id password firstName lastName confirmed } ` )

  if (!user) {
    throw new Error('No such user found.')
  }

  if (!user.confirmed) {
    throw new Error('You have not confirmed your email address yet.')
  }

  const valid = await bcrypt.compare(args.password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }

  const userupdate = await ctx.db.mutation.updateUser(
    {
      data: {
        lastLogin,
        online:true
      },
      where: {
        id: user.id,
      },
    },
    ` { id password firstName lastName role } `
  )

  const loggedInMsg = 'You have successfully logged in'
  // Be sure to store the token - either locally (unsafe) or in a session cookie.
  const token = jwt.sign({ userId: user.id }, APP_SECRET)
  return {
    token,
    authMsg: loggedInMsg,
    user: confirmUser
  }
}

async function logout(parent, args, ctx, info) {
  //prevents unauthorized user from logging out - checks authorization token to get current userId
  const userId = await getUserId(ctx)

  if (!userId) {
    throw new Error('There has been a problem logging out.')
  }

  const updateUser = await ctx.db.mutation.updateUser(
    {
      data: {
        online:false
      },
      where: {
        id: user.id,
      },
    },
    ` { id firstName lastName } `
  )

  //Be sure to remove the authorization token that you stored locally or in a session cookie.

  logoutRequestMsg = `${updateUser .firstName} ${updateUser .lastName}, you have logged out. Login again: <a href="https://example.com/login">Login</a>.`

  return {
    authMsg: logoutRequestMsg,
    user: updateUser
  }
}

async function deleteAccount(parent, args, ctx, info) {
  //prevents unauthorized user from logging out - checks authorization token to get current userId
  const userId = await getUserId(ctx)

  if (!userId) {
    throw new Error('There has been a problem deleting your account.')
  }

  const deleteUser = await ctx.db.mutation.deleteUser(
    {
      where: {
        id: userId,
      },
    },
    ` { id firstName lastName } `
  )

  const htmlEmail =
    `<html>
    <head>
      <title>Account Deleted</title>
    </head>
    <body>
      <p>Hi ${deleteUser.firstName} ${deleteUser.lastName},</p>
      <p>Your account has been deleted</p>
    </body>
    </html>`

  const msg = {
    to: args.email,
    subject: 'Account Deleted',
    text: 'Your account has been deleted',
    html: htmlEmail,
  };

  sendGridSend(msg)

  deleteRequestMsg = `${deleteUser.firstName} ${deleteUser.lastName}, Your account has been deleted.`

  return {
    authMsg: deleteRequestMsg,
    user: deleteUser
  }
}

// Rest of your mutations

module.exports = {
  signup,
  newPasswordRequest,
  resetPassword,
  confirmEmail,
  login,
  logout,
  deleteAccount
  // rest of mutations to export
}

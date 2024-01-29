// @flow

import gql from 'graphql-tag'
import UserInterface from '../schema/User/UserInterface.js'
import Security from '../utils/Security.js'
import NewAccountEmail from '../email/templates/NewAccountEmail.js'
import Config from 'common/src/Config.js'
import { createNewUserToken } from '../utils/Token.js'
import querystring from 'querystring'
import validator from 'validator'
import Email from '../rest/Email.js'

type CreateAccountInput = {
  email: string,
  password: string,
}

type CreateAccountResponse = {
  done: boolean,
}

export const typeDefs: any = gql`
  input CreateAccountInput {
    email: String!
    password: String!
  }

  type CreateAccountResponse {
    done: Boolean!
  }
`

export async function resolver(
  _: any,
  args: { input: CreateAccountInput },
  ctx: any,
): Promise<CreateAccountResponse> {
  const { email, password } = args.input

  if (!validator.isEmail(email)) {
    throw new Error('This is not a valid email.')
  }

  // todo: validate password strength

  let userId
  const existingUser = await UserInterface.getByEmail(email)
  if (existingUser) {
    if (existingUser.isTemp) {
      // A temp user is a user which has started the sign up process but has not yet verified their email.
      // They can restart the process.
      userId = existingUser.userId
      const hashedPassword = await Security.hashPassword(password)
      await UserInterface.updateHashedPassword(userId, hashedPassword)
    }
  } else {
    try {
      const hashedPassword = await Security.hashPassword(password)
      userId = await UserInterface.insert(email, hashedPassword, {
        isTemp: true,
      })
    } catch (err) {
      // If a user with this email already exists, then
      // silently fail.
      console.error(err)
    }
  }

  // todo: consider not sending email if user is verified.
  //  Email HTML building could take a while, so an attacker can probably detect if an email is verified
  //  by timing how long it takes for a response.
  //  So maybe we still send account creation emails even when the email is already verified.
  //  This makes it possible for someone to spam verified emails but this can be remedied a little by implemeting IP throttling.
  //  This function is a little heavy because of bcrypt and email building, and it can be called without authentication,
  //  so consider some form of DDOS mitigation.

  // Email is sent in any case so that the resend feature works.
  // userId should exist in either case
  if (userId) {
    const newUserToken = await createNewUserToken(userId, email)
    const params = querystring.stringify({ newUserToken })
    await Email.buildAndSend(
      new NewAccountEmail(),
      [email],
      {},
      { link: `${Config.webHost}/app?${params}` },
    )
  }

  return {
    // The next step is for the user to complete sign up via email.
    done: true,
  }
}

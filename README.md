# Prisma Graphql Autorization Suite

A very basic template for authorization functionality using Prisma and Graphql:
1. Sign up with email confirmation 
2. Confirm email by email with email confirmation 
3. Login 
4. Logout 
5. Reset Password Request with email 
6. Confirm Reset Password with email 

The User schema type also includes fields for 'sign up date', 'last login' and 'online'. 

This demo uses sendgrid to send the emails. You can configure it with the email service of your choice. 

[Live Demo](https://prisma-graphql-login.herokuapp.com/) - Please delete any users you create. 

## Getting Started

Set up a prisma server and service. https://www.prisma.io/


### Prerequisites

[Graphql](https://graphql.org)

[Prisma](https://www.prisma.io)

[bcryptjs](https://www.npmjs.com/package/bcryptjs)

[dotenv](https://www.npmjs.com/package/dotenv)

[graphql-yoga](https://github.com/prisma/graphql-yoga)

[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

[prisma-binding](https://github.com/prisma/prisma-binding)


### Installing

The package is designed as a template with sections that can be plugged into sections of existing applications. 

Install the dependencies. 

```
yarn add bcryptjs dotenv graphql-yoga jsonwebtoken prisma-binding graphql prisma npm-run-all graphql-cli
```

Make sure your PRISMA schema (datamodel.prisma) has the following fields as below: 

```
type User {
  id: ID! @unique
  email: String! @unique
  password: String!
  firstName: String!
  lastName: String!
  lastLogin: DateTime
  signUpDate: DateTime
  online: Boolean
  pushToken: String
  resetToken: String
  confirmationToken: String
  tokenExpirationTime: DateTime
  confirmed: Boolean
  // other custom fields 
}
```
Then deploy the update. Make sure that prisma post deploy will generate the prisma bindings in the 'generated' folder within your src folder. 

```
prisma deploy
```
In your graphql.schema make sure you have the following mutation and query types: 

```

type Mutation {

  signup(email: String!, password: String!, firstName: String!,lastName: String!, role: String): signUpPayload

  newPasswordRequest(email: String!): signUpPayload

  resetPassword(email: String!, resetToken: String!, resetPassword: String!): signUpPayload

  confirmEmail(email: String!, confirmationToken: String!): signUpPayload

  login(email: String!, password: String!): AuthPayload

  logout: signUpPayload

  deleteAccount: signUpPayload

}

type AuthPayload {
  token: String
  authMsg: String
  user: User
}

type signUpPayload {
  authMsg: String
  user: User
}
```

Copy the following resolver mutation functions from Mutations.js in the src/resolver folder into your own mutation resolvers and export them.

```
function sendGridSend(msg){

  ...
  
 }


async function signup(parent, args, ctx, info) {

 ...
}


async function newPasswordRequest(parent, args, ctx, info) {

  ...

}

async function resetPassword(parent, args, ctx, info) {

 ...

}

async function confirmEmail(parent, args, ctx, info) {

  ...
  
}

async function login(parent, args, ctx, info) {
  ...
  
}

async function logout(parent, args, ctx, info) {
  ...
  
}

// Rest of your mutations

module.exports = {
  signup,
  newPasswordRequest,
  resetPassword,
  confirmEmail,
  login,
  logout,
}
```

End with an example of getting some data out of the system or using it for a little demo



## Deployment

You can deploy locally with: 

```
yarn start
```

or

```
yarn dev
```

## Built With

* [Graphql](https://graphql.org/) 
* [Prisma](https://www.prisma.io/) - Database layer with bindings 
* [Sendgrid](https://sendgrid.com/) - Email service  


## Authors

Evan Goodwin 

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Prisma 
* Graphql 
* [How to Graphql](https://www.howtographql.com)


# Setup

0. Open this `readme.md`
1. `yarn`
2. `cp src/backend/secrets/.env.defaults src/backend/secrets/.env`
3. Add environment variables to `.env`
   1. Use `openssl rand -base64 32` to generate secrets.
4. `npm run clean-sql`
5. `npm start`
6. Mark `./build`, `./src/backend/build`, `./src/common/build`, `./src/web/build` as excluded from IDE analysis.
7. Mark `./src/build/secrets` as excluded from IDE analysis.

### Deploying

1. Set your custom domain name in `serverless.yml`.
2. Create a certificate for your domain in [AWS Certificate Manager](https://us-east-1.console.aws.amazon.com/acm/home).
3. `npm run deploy`

### Installing MySQL (MacOS)

1. `brew install mysql`

### rebuild-aio

`rebuild-aio` is used for several purposes:
* Building and bundling files into a build folder or artifact which will be zipped and uploaded when deployed.
* Files can be transpiled during the build process using a custom `scripts/transformer.js` script.
* During local development, it will monitor file changes, rebuild, and restart the app.
* It handles graceful restarts and clean shutdowns. See [`rebuild-aio`](https://www.npmjs.com/package/rebuild-aio) documentation for more details.
* It allows multiple entry points which is useful for starting the main app, but also potentially generating other files.

### Entry Points

There are multiple entry points:
* serverlessServer.js - The main entry point when the app is deployed. 
* localServer.js - The main entry point during local development.
* generateSql.js - Used for generating a `.sql` script for creating tables on fresh startup.
* generateSchema.js - Generates a `schema.graphql` file in the monorepo root so that IDE tools can be aware of the schema.
* mysql/localClean.js - This deletes the database so that the next start is fresh.

It is worth noting that the generateSchema.js entry point does not cause the MySQL database to start running.
In general, it should be possible to import the executable schema from schema.js without causing the database to start.
The database only starts whenever the first DB query is made.
When the server.js entry points are used, one of the first things they do is import `migrate.js`, and this is the first DB query.

## Workflows

### Changing the schema

### Creating a resolver

### Creating a MySQL query

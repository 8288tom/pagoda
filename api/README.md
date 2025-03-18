# API

## Project setup
```
npm install
```

### Hot-reloads for development, runs locally on localhost:4000
```
npm run start 
```

### Guidelines
GQL Server:
Dev: dev-server.js
Prod: index.js

During development the server will run on node server from the dev-server.js file.
Context for the user is created manually in that same file.

For prod, we are using the index.js file to export the handler for the lambda, context is built differently to dev.

ENV Variables:
Dev: .env-dev
Prod: Lambda env variables configured on serverless.yml.

### Deployment

Deployments are done via serverlessframework using serverless.yml.
Talk to developers to get the serverless.yml if it's not available in the repo.

# Pagoda

## Overview

This project is a comprehensive internal management system used in production at my previous company. It provides tools to manage users, projects, assets, internal workflows, and user permissions.

The app is not designed to be used on a phone, therefore it was not programmed to be responsive

### Tech Stack

- **Authentication**: OIDC for SSO using JWT tokens (handled in an authorizer Lambda)
- **Backend**: Apollo GraphQL running in a Lambda function
- **Frontend**: Vue.js with KendoUI

I developed, designed, architected, and deployed this entire project solo over 5 months.
It went through extensive QA testing which found 2 minor bugs.

## Live Demo
For the purpose of this demo some features have been disabled, SSO configuration included (code is still intact just commented out where needed).

In production this app is used with collections of more than 50K documents, for the purpose of this demo there are only 200-400 documents in the database.


Disclaimer: No real data was used, no password were compromised in the making of this demo.
[🔗 Demo Link](https://pagoda.shkoodsolutions.com/)

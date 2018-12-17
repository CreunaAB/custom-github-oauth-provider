# About

OAuth provider for Netlify CMS.

Reference for Github setup: https://developer.github.com/apps/building-oauth-apps

Main application needs to call the /auth endpoint

## Install

```sh
$ npm install
```

## Run

```sh
$ npm start
```

Node server is now listening at http://localhost:3001

### Example .env file:

```
NODE_ENV=production
OAUTH_CLIENT_ID=133713371337
OAUTH_CLIENT_SECRET=loremipsumdolorsitamet
REDIRECT_URL=https://your.server.com/callback
```

### For use with Netlify CMS use this config

```
backend:
  name: github
  repo: user/repo   # Path to your Github repository
  branch: master    # Branch to update
  base_url: https://your.server.com # Path to this app
  auth_endpoint: /auth
```

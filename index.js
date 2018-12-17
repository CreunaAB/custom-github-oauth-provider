require('dotenv').config();
const simpleOauthModule = require('simple-oauth2');
const randomString = require('randomstring');
const express = require('express');
const app = express();

const oauthProvider = process.env.OAUTH_PROVIDER || 'github';
const loginAuthTarget = process.env.AUTH_TARGET || '_self'

const oauth2 = simpleOauthModule.create({
    client: {
        id: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET
    },
    auth: {
        tokenHost: process.env.GIT_HOSTNAME || 'https://github.com',
        tokenPath: process.env.OAUTH_TOKEN_PATH || '/login/oauth/access_token',
        authorizePath: process.env.OAUTH_AUTHORIZE_PATH || '/login/oauth/authorize'
    }
})

/* Authorization URI config */
const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: process.env.REDIRECT_URL,
    scope: process.env.SCOPES || 'repo,user',
    state: randomString.generate(32)
})

const buildResponseScript = (content, state) => {
    const script = `
    <script>
    (function() {
      openerWindow = window.opener;

      function recieveMessage(e) {
        // send message to main window with da app
        openerWindow.postMessage(
          'authorization:${oauthProvider}:${state}:${JSON.stringify(content)}',
          'http://localhost:3000'
        )
      }
      window.addEventListener("message", recieveMessage, false)
      // Start handshake with parent
      openerWindow.postMessage("authorizing:${oauthProvider}", "*")    
      })()
    </script>`
    
    return script;
}

/* Initial page redirecting to Github */
app.get('/auth', (req, res) => {
    res.redirect(authorizationUri);
})

/* Create access token and send message back to main app */
app.get('/callback', async (req, res) => {
    const code = req.query.code
    let content,
        state,
        script;
    var options = {
        code: code
    }

    try {
        const result = await oauth2.authorizationCode.getToken(options);
        const token = oauth2.accessToken.create(result);

        state = 'success';
        content = {
            token: token.token.access_token,
            provider: oauthProvider
        }
        script = buildResponseScript(content, state);

        return res.send(script);
    } catch (error) {
        state = 'error';
        content = JSON.stringify(error);
        script = buildResponseScript(content, state);

        return res.send(script);
    }
})

app.get('/success', (req, res) => {
    res.send('');
})

/* For testing only */
app.get('/', (req, res) => {
    res.send(`
        Hello
        <br />
        <a href="/auth" target="${loginAuthTarget}">Log in with ${oauthProvider.toUpperCase}</a>
    `)
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OAuth app listening on port: ${PORT}`))
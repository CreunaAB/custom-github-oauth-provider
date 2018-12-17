require('dotenv').config({ silent: true });
const simpleOauthModule = require('simple-oauth2');
const randomString = require('randomstring');
const express = require('express');
const app = express();

const oauthProvider = process.env.OAUTH_PROVIDER || 'github';

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

/* Initial page redirecting to Github */
app.get('/auth', (req, res) => {
    res.redirect(authorizationUri);
})

app.get('callback', (req, res) => {
    const code = req.query.code;

    const options = { code };

    oauth2.authorizationCode.getToken(options, (err, result) => {
        let content;

        if (err) {
            content = JSON.stringify(err);
        } else {
            const token = oauth2.accessToken.create(result);
            
            content = {
                token: token.token.access_token,
                provider: oauth_provider
            }
        }

        const script = `
            <script>
                (function () {
                    function recieveMessage(e) {
                        console.log('recieveMessage %o', e)
                        // send message to main window === main app
                        window.opener.postMessage(
                            'authorization:${oauthProvider}:${mess}:${JSON.stringify(content)}',
                            e.origin
                        )
                    }
                    window.addEventListener('message', recieveMessage, false)
                    
                    // Handshake with parent
                    console.log('Sending message: %o', '${oauthProvider}')
                    window.opener.postMessage('authorizing:${oauthProvider}', '*')
                })() 
            </script>
        `

        return res.send(script)
    });
})

app.get('/success', (req, res) => {
    res.send('');
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OAuth app listening on port: ${PORT}`))
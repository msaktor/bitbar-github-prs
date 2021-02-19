# bitbar-github-prs
BitBar plugin displaying pending pull requests in Github

## Setup

1. Get BitBar https://github.com/matryer/bitbar

2. Drop the `pull-requests.5m.js` file in plugins directory (default `~/.bitbar/pull-requests.5m.js`)

3. Edit the file to insert your personal token

4. Plugin will lookup your 50 most recent commits and extract repository names from that to be "watched". If you wish to hardcode some repositories on top of that, edit `fixedRepos` variable

5. Edit node path in the shebang (1st row in the file)  
Have node version **v10+**

6. ???

7. Profit!

## Troubleshooting
* if you hit error _launch path not accessible_ you need to `chmod +x pull-requests.5m.js`

## Refresh time
Edit filename = the `.5m.` portion indicates that view should be updated every 5 minutes.

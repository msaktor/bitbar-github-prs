#!/usr/bin/env /Users/msaktor/.nvm/versions/node/v14.12.0/bin/node

// <bitbar.title>Github Pull requests</bitbar.title>
// <bitbar.version>v1.0</bitbar.version>
// <bitbar.author>Marek Saktor</bitbar.author>
// <bitbar.desc>Get list of pull requests from Github for multiple repositories (based on plugin from Noam Knispel)</bitbar.desc>
// <bitbar.dependencies>node.js</bitbar.dependencies>

// EDIT YOUR INFO BELOW:
const username = 'msaktor'
const token = 'insert token here'
const fixedRepos = [
  'wandera/acceptance-tests',
]

// IMPLEMENTATION STARTS HERE
const icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACoklEQVQ4T32TTUhUURTH/+e+GXXGeWaStMhC8/nMFlZobxAKRBCUgoLaRlCQGRGBRLZqGX1QUQuHkNoUCEUQheiiiBbpzOgiCh3Hp30sDImy5o6TX++eePNMzcS7uufe+//dc//3HMKqETRq92iaaFHKaRCkbXO3lcJnTcMrhxGZTsberZTQUlBSF9CD83eZRCMx3wHxCzlSZqP+G+kT0gD7DhLxOSZ0y9ngeXx6PeNqPUBWvNAL0Lieds5MTAxmVmfmxpurq/MzM4EIiLfK2WCTC8kCdLO2E4BfJgeOFxnhgh92NLUWYOP2mg1T44O/QhXWQyEgUyOxVnLf7BPiWSjt7HBv1o3wMJMzTSSeKka5CxKEMQKOsmKftOPVxTvrQzMLMqGgHSC90opAYUyOxq67h4OmZWvwhP8NRQlpR6u8rMOXCCih/IqaJLHvcNqODummtR/AmzXFi4ukqC5lR/vzTWuXUNRFumHNypy0jqGhOd3c2w7QlfUAANpkMnbTMzTv+z+AUIXVQoTIugCmE3I0+mAJkG9YI+RXR9LDAx8CZt0WjZwkMYJrQRyFNDlkTH+MTmYLTuARFVRaHcz0Rc4FboUCaQMLVATCVQJZ7gcsgpQD9GuCL8hE/K27FjKtywA2kWcGd/shquaFaodCn7Tjz3UzfAPgtiyA1TU5OnDxb1aFpbsLnRxfQgl/o1dIlVaEHCoMBH+fzGRy+xRTjiBVDiF8i6IemYw1L86FboYfk1JfU3b8rFfKpfV5em6mhxiT8GutvDBfDCU6QdiXTYDRmx6NNXk359wHVKFUP5th27PLzeRBboNxiEEdCnxMAwwXoByMaBq6GOo0KXqSwlSbK15uphWWu55ooFOs0ADBZd6WGmeIlyy0e9OJvvcrf+gPaEUjiE1E0cUAAAAASUVORK5CYII='

const console = require("console")
const https = require("https")

function fetch(url, headers = {}) {
  const options = {
    host: "api.github.com",
    path: url,
    auth: `${username}:${token}`,
    headers: {
      'User-Agent': username + ' - bitbar',
      ...headers,
    },
  }

  return new Promise((resolve, reject) => {
    const request = https.get(options, (response) => {
      // handle http errors
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to load page ${options.path}, status code: ` + response.statusCode))
      }
      const body = []
      response.on('data', (chunk) => body.push(chunk))
      response.on('end', () => resolve(JSON.parse(body.join(''))))
    })
  })
}

async function commentReplies(uniqueRepos) {
  const commentFetches = uniqueRepos.map((repo) => fetch(`/repos/${repo}/pulls/comments?sort=updated&direction=desc&page=1&per_page=100`))
  const commentResponses = await Promise.all(commentFetches);
  const recentComments = commentResponses.flat();
  const commentsObj = recentComments.reduce((acc, c) => { acc[c.id] = c; return acc }, {})
  return recentComments
    .filter(c =>
      (c.user && c.user.login !== username)
      && c.in_reply_to_id
      && commentsObj[c.in_reply_to_id]
      && commentsObj[c.in_reply_to_id].user
      && commentsObj[c.in_reply_to_id].user.login === username
    )
    .map(c => `${c.user.login}: ${c.body.replace(/\n/g, ' ').substr(0, 80)} | href=${c.html_url}`)
    .slice(0,5)
}

function getUpdatedAt(updated_at) {
  const updatedDiff = ((new Date() - new Date(updated_at)) / (1000 * 60 * 60))
  return updatedDiff >= 24 ? `${(updatedDiff / 24) | 0}d` : `${(updatedDiff | 0)}h`
}

async function main() {
  try {
    const report = {}
    const commitsQuery = `/search/commits?q=author:${username}&sort=committer-date&per_page=50&order=desc`
    const myCommits = await fetch(commitsQuery, { Accept: 'application/vnd.github.cloak-preview' })
    const dynamicRepos = myCommits.items.map(i => i.repository.full_name)
    const uniqueRepos = [...new Set([...fixedRepos, ...dynamicRepos])]

    const results = await Promise.all(uniqueRepos.map(repo => fetch(`/repos/${repo}/pulls`)))

    for (const info of results) {
      if (info.length > 0) {
        const repoName = info[0].base.repo.name;
        for (const simplePr of info) {
          if (simplePr.requested_reviewers.map(reviewer => reviewer.login).includes(username) || simplePr.user.login == username) {
            let line = '';
            try {
              const pr = await fetch(simplePr.url)
              const updatedAt = getUpdatedAt(pr.updated_at)
              const mergeable = pr.mergeable ? " color=#00ff00" : ""
              line = `${pr.title} (${pr.user.login}) ⏱${updatedAt} 💬${pr.review_comments} | href=${pr.html_url} ${mergeable}`
            } catch (e) {
              const updatedAt = getUpdatedAt(simplePr.updated_at)
              line = `${simplePr.title} (${simplePr.user.login}) ⏱${updatedAt} | href=${simplePr.html_url}`
            }
            if (report[repoName]) {
              report[repoName].push(line)
            }
            else {
              report[repoName] = [line]
            }
          }
        }
      }
    }

    const numPRs = Object.values(report).reduce((acc, val) => acc.concat(val), []).length
    const strings = []
    strings.push(`${numPRs} PRs | templateImage=${icon} dropdown=false`)
    strings.push("---")
    Object.entries(report).map(([repoName, lines]) => {
      strings.push(repoName + " | color=#0000ff")
      lines.forEach(line => strings.push(line))
    })
    strings.push("---")
    const comments = await commentReplies(uniqueRepos);
    strings.concat(comments).map(string => console.log(string))
  } catch (e) {
    console.log(`Error :( | templateImage=${icon} dropdown=false`)
    console.log(e.toString())
  }
}

main()

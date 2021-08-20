#!/usr/bin/env node

// <xbar.title>Github Pull Requests</xbar.title>
// <xbar.version>v1.0</xbar.version>
// <xbar.author>Marek Saktor</xbar.author>
// <xbar.desc>Get list of pull requests from Github for multiple repositories (based on plugin from Noam Knispel)</xbar.desc>
// <xbar.dependencies>node.js</xbar.dependencies>

// EDIT YOUR INFO BELOW:
const username = 'msaktor'
const token = 'insert token here'
const fixedRepos = [
  'wandera/acceptance-tests',
]

// IMPLEMENTATION STARTS HERE
const icon = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAdFQTFRFAAAAAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEAwEEfD1sGQAAAJt0Uk5TAExpKggGKGMvxP/1y1YNVMb0oAr3/dJIBFDwBUD5qCMpOVFcWzgnt/tx7f7z8UWQXaNwpXIL0bWTayASjl7NrfzYoX59jZ60yc6rloZ71N/yDAIBc/i8f8phA3Vsz+PbYPpGgsFBuKKLeUPHuxxaeKaKD5s86CYsGDNvJC0fGm2yw00TFlPX7j6wQiEiLnfixevlTzFSeoiBbhl5QEK5AAAB2ElEQVR4nK2S51sTQRDGhx7mDDWNQCAUE5ILoIAC0o4SqrTQOxEVUGNBEQVC79K7/rXO7l0eCDyXT8yHeWfm/e3d7d4CPEaEhUdEPpxGRcdolDIWhSfauGA7Lj4hEZPkOlmHiHqD0XRndYpBT0NzKu/SkIclPcOamZWdk/LUZrXnyjMbBxyohFMQmYiuvMAknwMFqBrPOPBcHSjkQJE6UMz8Fy/VgZIoAkrVfcQygFe6UEBeOVSE8hEroSo0UA1mrlJNbV29u6Gxqbk5tqX1dVt9a7vEjQ5gZ46d2V3KX/B4lKKrmH+cBRgoatmo+/Zn8bKHHXwvdFLuo2Wm/oFBBRkaHhihydAoWWMwTnmCpmUiejNlIEdC6Q3pJFlvwU75Hb81iG4ZeE/lFGk86TTMUP5AXTtpugx8pPITqZY0DHxexM/UNVL3RQa+UvmNtA1RmAUoQfxO3Y9EnPPJgMaMzp/AHfbSeQGFX6S/FxYDu1xasFL2C+hcZu2KF1fv3WkW5WuoW5dPxSFglXEj2N7c2sYdbeDsdg2i1LHn2F+y/fH7D2yHxiP7sV6foLnlZytP5uimW1zO09MdF+3LctZ3nhz0SJPv4tJxNXld4b6+mfm7fvjPA48V/wGe71VkZnddAwAAAABJRU5ErkJggg=='

const console = require("console")
const https = require("https")

let errorRetries = 5;

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
    try {
      const request = https.get(options, (response) => {
        // handle http errors
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to load page ${options.path}, status code: ` + response.statusCode))
        }
        const body = []
        response.on('data', (chunk) => body.push(chunk))
        response.on('end', () => resolve(JSON.parse(body.join(''))))
      })
      request.on('error', error => reject(new Error(error)))
    } catch (error) {
      reject(new Error(error))
    }
  })
}

async function commentReplies(uniqueRepos) {
  const commentFetches = uniqueRepos.map((repo) => fetch(`/repos/${repo}/pulls/comments?sort=updated&direction=desc&page=1&per_page=100`))
  const commentResponses = await Promise.all(commentFetches);
  const recentComments = commentResponses.flat();
  const commentsObj = recentComments.reduce((acc, c) => { acc[c.id] = c; return acc }, {})
  return recentComments
    .filter(c =>
      c.user && c.user.login !== username
      && c.in_reply_to_id
      && commentsObj[c.in_reply_to_id]
      && commentsObj[c.in_reply_to_id].user
      && commentsObj[c.in_reply_to_id].user.login === username
    )
    .map(c => `${c.user.login}: ${c.body.replace(/\n/g, ' ').substr(0, 80)} | href=${c.html_url}`)
    .slice(0, 5)
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
    console.log("---")
    console.log('Refresh | refresh=true')
    console.log("---")
    console.log(e.toString())

    if (errorRetries > 0) {
      setTimeout(() => main(), 200)
      errorRetries--
    }
  }
}

main()

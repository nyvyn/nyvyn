const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const fetch = require('node-fetch');

const README_PATH = path.join(__dirname, '../../README.md');
const POSTS_FEED = 'https://ronlancaster.com/feed.xml'; // Update if your posts feed URL is different
const NOTES_FEED = 'https://ronlancaster.com/notes/feed.xml'; // Update if your notes feed URL is different
const GITHUB_USER = 'nyvyn'; // Update if your GitHub username is different

async function fetchFeedItems(feedUrl, max = 5) {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.slice(0, max).map(item => `- [${item.title}](${item.link})`);
  } catch (e) {
    return ['*Could not fetch feed*'];
  }
}

async function fetchRecentRepos(user, max = 5) {
  const res = await fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=${max}`);
  if (!res.ok) return ['*Could not fetch repos*'];
  const repos = await res.json();
  return repos.map(repo => `- [${repo.name}](${repo.html_url}) ★${repo.stargazers_count}`);
}

function updateSection(content, marker, newLines) {
  const start = `<!-- ${marker}_START -->`;
  const end = `<!-- ${marker}_END -->`;
  const regex = new RegExp(`${start}[\s\S]*?${end}`);
  return content.replace(regex, `${start}\n${newLines.join('\n')}\n${end}`);
}

(async function main() {
  let readme = fs.readFileSync(README_PATH, 'utf8');
  const posts = await fetchFeedItems(POSTS_FEED);
  const notes = await fetchFeedItems(NOTES_FEED);
  const repos = await fetchRecentRepos(GITHUB_USER);

  readme = updateSection(readme, 'RECENT_POSTS', posts);
  readme = updateSection(readme, 'RECENT_NOTES', notes);
  readme = updateSection(readme, 'RECENT_REPOS', repos);

  fs.writeFileSync(README_PATH, readme);
})();


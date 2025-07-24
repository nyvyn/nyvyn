const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const fetch = require('node-fetch');

const README_PATH = path.join(__dirname, '../../README.md');
const POSTS_FEED = 'https://www.ronlancaster.com/index.xml'; // Update if your posts feed URL is different
const GITHUB_USER = 'nyvyn'; // Update if your GitHub username is different

async function fetchFeedItems(feedUrl, max = 5) {
  const parser = new Parser();
  try {
    console.log(`Fetching posts from RSS feed: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    console.log(`Fetched ${feed.items.length} posts`);
    return feed.items.slice(0, max).map(item => `- [${item.title}](${item.link})`);
  } catch (e) {
    console.error('Error fetching posts:', e.message);
    return ['*Could not fetch feed*'];
  }
}

async function fetchRecentRepos(user, max = 5) {
  console.log(`Fetching recent repos for user: ${user}`);
  const res = await fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=${max}`);
  if (!res.ok) {
    console.error('Error fetching repos:', res.statusText);
    return ['*Could not fetch repos*'];
  }
  const repos = await res.json();
  console.log(`Fetched ${repos.length} repos`);
  return repos.map(repo => `- [${repo.name}](${repo.html_url}) ★${repo.stargazers_count}`);
}

function updateSection(content, marker, newLines) {
  const start = `<!-- ${marker}_START -->`;
  const end = `<!-- ${marker}_END -->`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  console.log(`Updating section: ${marker}`);
  const match = content.match(regex);
  if (!match) {
    console.warn(`Warning: Could not find section for marker "${marker}". Regex used: ${regex}`);
    return content;
  } else {
    console.log(`Matched section for "${marker}":\n${match[0]}`);
  }
  const replacement = `${start}\n${newLines.join('\n')}\n${end}`;
  console.log(`Replacement for "${marker}":\n${replacement}`);
  return content.replace(regex, replacement);
}

(async function main() {
  console.log('Reading README.md...');
  let readme = fs.readFileSync(README_PATH, 'utf8');
  const posts = await fetchFeedItems(POSTS_FEED);
  const repos = await fetchRecentRepos(GITHUB_USER);

  const updatedReadme = updateSection(
    updateSection(readme, 'RECENT_POSTS', posts),
    'RECENT_REPOS',
    repos
  );

  if (readme === updatedReadme) {
    console.log('No changes detected in README.md. Nothing to update.');
    // Show a diff preview for debugging
    console.log('Preview of RECENT_POSTS section:');
    console.log(posts.join('\n'));
    console.log('Preview of RECENT_REPOS section:');
    console.log(repos.join('\n'));
  } else {
    fs.writeFileSync(README_PATH, updatedReadme);
    console.log('README.md updated successfully.');
    // Show what was written for confirmation
    console.log('Written RECENT_POSTS section:');
    console.log(posts.join('\n'));
    console.log('Written RECENT_REPOS section:');
    console.log(repos.join('\n'));
  }
})();

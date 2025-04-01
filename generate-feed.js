// This is a Node.js script that will run as a GitHub Action
// It fetches LinkedIn posts and generates an RSS feed file

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const LINKEDIN_URL = 'https://www.linkedin.com/company/leverege';
const OUTPUT_FILE = 'linkedin-feed.xml';

async function generateRSSFeed() {
  try {
    console.log('Fetching LinkedIn page...');
    
    // Fetch the LinkedIn page
    const response = await axios.get(LINKEDIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    
    // Prepare RSS feed header
    let rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>LinkedIn Posts - Leverege</title>
  <link>${LINKEDIN_URL}</link>
  <description>Latest posts from Leverege on LinkedIn</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;
    
    // Find and extract posts
    let postCount = 0;
    
    // Try different selectors based on LinkedIn's structure
    $('.feed-shared-update-v2, .occludable-update, .ember-view.artdeco-card').each((i, element) => {
      if (i >= 10) return; // Limit to 10 posts
      
      const $post = $(element);
      
      // Try different selectors for post content
      const postText = $post.find('.feed-shared-text, .update-components-text, .feed-shared-update-v2__description-wrapper').text().trim();
      
      // Skip if no text found (likely not a post)
      if (!postText) return;
      
      // Generate a unique ID for the post (using index + text)
      const postId = Buffer.from(`${i}-${postText.substring(0, 50)}`).toString('base64');
      
      // Get post date or use current date if not found
      const postDate = $post.find('.feed-shared-actor__sub-description, .update-components-actor__sub-description').text().trim() || new Date().toUTCString();
      
      // Add item to RSS feed
      rssContent += `
  <item>
    <title>${postText.substring(0, 100)}${postText.length > 100 ? '...' : ''}</title>
    <link>${LINKEDIN_URL}</link>
    <guid>${postId}</guid>
    <pubDate>${postDate.includes('ago') ? new Date().toUTCString() : postDate}</pubDate>
    <description><![CDATA[${postText}]]></description>
  </item>`;
      
      postCount++;
    });
    
    // Close RSS feed
    rssContent += `
</channel>
</rss>`;
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, rssContent);
    
    console.log(`RSS feed generated with ${postCount} posts`);
    return postCount > 0;
  } catch (error) {
    console.error('Error generating feed:', error);
    return false;
  }
}

// Main function
async function main() {
  const success = await generateRSSFeed();
  
  if (!success) {
    console.error('Failed to generate valid RSS feed');
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error(err);
  process.exit(1);
});

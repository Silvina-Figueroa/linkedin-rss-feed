// This is a Node.js script that will run as a GitHub Action
// It fetches LinkedIn posts and generates an RSS feed file

const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

// Configuration
const LINKEDIN_URL = 'https://www.linkedin.com/company/leverege/posts/';
const OUTPUT_FILE = 'linkedin-feed.xml';

function fetchLinkedIn() {
  return new Promise((resolve, reject) => {
    console.log('Fetching LinkedIn page...');
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    };

    https.get(LINKEDIN_URL, options, (res) => {
      console.log('Response status:', res.statusCode);
      
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Data received, length:', data.length);
        resolve(data);
      });
    }).on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });
  });
}

async function generateRSSFeed() {
  try {
    // Fetch the LinkedIn page
    const html = await fetchLinkedIn();
    
    // Parse HTML
    const $ = cheerio.load(html);
    console.log('HTML parsed successfully');
    
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
    console.log('Searching for posts...');
    
    // Try different selectors based on LinkedIn's structure
    $('.feed-shared-update-v2, .occludable-update, .ember-view.artdeco-card').each((i, element) => {
      if (i >= 10) return; // Limit to 10 posts
      
      const $post = $(element);
      console.log(`Found post element ${i}`);
      
      // Try different selectors for post content
      const postText = $post.find('.feed-shared-text, .update-components-text, .feed-shared-update-v2__description-wrapper').text().trim();
      
      // Skip if no text found (likely not a post)
      if (!postText) {
        console.log(`Post ${i} has no text, skipping`);
        return;
      }
      
      console.log(`Post ${i} content:`, postText.substring(0, 50) + '...');
      
      // Generate a unique ID for the post (using index + text)
      const postId = Buffer.from(`${i}-${postText.substring(0, 50)}`).toString('base64');
      
      // Add item to RSS feed
      rssContent += `
  <item>
    <title>${postText.substring(0, 100)}${postText.length > 100 ? '...' : ''}</title>
    <link>${LINKEDIN_URL}</link>
    <guid>${postId}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[${postText}]]></description>
  </item>`;
      
      postCount++;
    });
    
    // If no posts found, add a dummy post for testing
    if (postCount === 0) {
      console.log('No posts found, adding test post');
      rssContent += `
  <item>
    <title>Test Post - No LinkedIn posts found</title>
    <link>${LINKEDIN_URL}</link>
    <guid>test-post-1</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[This is a test post created because no LinkedIn posts were found. LinkedIn might be blocking the request.]]></description>
  </item>`;
      postCount = 1;
    }
    
    // Close RSS feed
    rssContent += `
</channel>
</rss>`;
    
    // Write to file
    console.log(`Writing RSS feed with ${postCount} posts to ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, rssContent);
    
    console.log('File written successfully');
    return true;
  } catch (error) {
    console.error('Error generating feed:', error.message);
    
    // Create a fallback feed with error information
    const errorFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>LinkedIn Posts - Leverege (Error)</title>
  <link>${LINKEDIN_URL}</link>
  <description>Error fetching LinkedIn posts</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <item>
    <title>Error fetching LinkedIn posts</title>
    <link>${LINKEDIN_URL}</link>
    <guid>error-${Date.now()}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[There was an error fetching LinkedIn posts: ${error.message}]]></description>
  </item>
</channel>
</rss>`;
    
    console.log('Writing error feed');
    fs.writeFileSync(OUTPUT_FILE, errorFeed);
    return false;
  }
}

// Main function
async function main() {
  try {
    await generateRSSFeed();
    console.log('Process completed successfully');
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Run the script
main();

// This script uses only built-in Node.js modules and cheerio
const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');

// Configuration
const LINKEDIN_URL = 'https://www.linkedin.com/company/leverege/posts/';
const OUTPUT_FILE = 'linkedin-feed.xml';

// Simple function to fetch a URL using the built-in https module
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching URL: ${url}`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    };
    
    https.get(url, options, (res) => {
      console.log(`Response status code: ${res.statusCode}`);
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Following redirect to: ${res.headers.location}`);
        return resolve(fetchUrl(res.headers.location));
      }
      
      // Handle non-200 responses
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP request failed with status code ${res.statusCode}`));
      }
      
      // Collect the response data
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Received ${data.length} bytes of data`);
        resolve(data);
      });
    }).on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      reject(err);
    });
  });
}

async function generateFeed() {
  try {
    console.log('Starting LinkedIn feed generation');
    
    // Create a minimal RSS feed in case we can't fetch LinkedIn
    let rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>LinkedIn Posts - Leverege</title>
  <link>${LINKEDIN_URL}</link>
  <description>Latest posts from Leverege on LinkedIn</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;
    
    try {
      // Try to fetch the LinkedIn page
      const html = await fetchUrl(LINKEDIN_URL);
      console.log('Successfully fetched LinkedIn page');
      
      // Parse the HTML
      const $ = cheerio.load(html);
      console.log('HTML parsed successfully');
      
      let postCount = 0;
      
      // Look for posts with various selectors
      $('.feed-shared-update-v2, .occludable-update, .update-components-actor, article').each((i, el) => {
        const postText = $(el).text().trim().substring(0, 500);
        if (postText.length > 20) {  // Only include if there's meaningful content
          postCount++;
          const guid = `post-${Date.now()}-${i}`;
          
          rssContent += `
  <item>
    <title>LinkedIn Post ${i+1}</title>
    <link>${LINKEDIN_URL}</link>
    <guid>${guid}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[${postText}]]></description>
  </item>`;
        }
      });
      
      console.log(`Found ${postCount} posts`);
      
      // If no posts were found, add a test item
      if (postCount === 0) {
        console.log('No posts found, adding test item');
        rssContent += `
  <item>
    <title>Test Post</title>
    <link>${LINKEDIN_URL}</link>
    <guid>test-post-${Date.now()}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[This is a test post. No LinkedIn content was found. LinkedIn may be blocking the request.]]></description>
  </item>`;
      }
      
    } catch (err) {
      console.error(`Error fetching LinkedIn: ${err.message}`);
      
      // Add an error item to the feed
      rssContent += `
  <item>
    <title>Error Fetching LinkedIn</title>
    <link>${LINKEDIN_URL}</link>
    <guid>error-${Date.now()}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[There was an error fetching content from LinkedIn: ${err.message}]]></description>
  </item>`;
    }
    
    // Close the RSS feed
    rssContent += `
</channel>
</rss>`;
    
    // Write the feed to a file
    console.log(`Writing RSS feed to ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, rssContent);
    console.log('RSS feed generated successfully');
    
  } catch (err) {
    console.error(`Critical error: ${err.message}`);
    process.exit(1);
  }
}

// Run the feed generator
generateFeed();

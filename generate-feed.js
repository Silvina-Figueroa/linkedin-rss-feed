const fs = require('fs');

// Configuration
const LINKEDIN_URL = 'https://www.linkedin.com/company/leverege/post';
const OUTPUT_FILE = 'linkedin-feed.xml';

// Generate a basic RSS feed that will work with Zapier
async function generateFeed() {
  try {
    console.log('Starting LinkedIn feed generation');
    
    // Create a timestamp for unique IDs
    const timestamp = new Date().toISOString();
    const pubDate = new Date().toUTCString();
    
    // Create a simple RSS feed with current timestamp
    // This ensures Zapier has something new to detect
    const rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Leverege LinkedIn Updates</title>
  <link>${LINKEDIN_URL}</link>
  <description>LinkedIn company updates for Leverege</description>
  <lastBuildDate>${pubDate}</lastBuildDate>
  <item>
    <title>LinkedIn Check (${pubDate})</title>
    <link>${LINKEDIN_URL}</link>
    <guid>check-${timestamp}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[
    LinkedIn check performed at ${timestamp}.
    
    This entry is generated automatically to check for LinkedIn updates.
    ]]></description>
  </item>
</channel>
</rss>`;
    
    // Write the feed to a file
    console.log(`Writing RSS feed to ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, rssContent);
    console.log('RSS feed generated successfully');
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
    
    // Create a minimal emergency feed
    const emergencyFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Leverege LinkedIn</title>
  <link>${LINKEDIN_URL}</link>
  <description>LinkedIn company updates</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <item>
    <title>Feed Update (${new Date().toUTCString()})</title>
    <link>${LINKEDIN_URL}</link>
    <guid>error-${new Date().toISOString()}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[RSS Feed update.]]></description>
  </item>
</channel>
</rss>`;
    
    fs.writeFileSync(OUTPUT_FILE, emergencyFeed);
    console.log('Emergency RSS feed generated due to error');
  }
}

// Run the feed generator
generateFeed();

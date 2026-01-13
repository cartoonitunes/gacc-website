# NFT Stories API Documentation

This API provides access to NFT character stories for use in both the website and Discord bot.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: Your production server URL

## Endpoints

### 1. Get All Stories

**GET** `/api/nft-stories`

Returns all available NFT stories.

**Response:**
```json
{
  "success": true,
  "stories": [
    {
      "tokenId": "2308",
      "name": "Norman Pike",
      "title": "Grandpa Ape #2308 - Norman Pike | Grandpa Coin",
      "description": "Say hello to Norman Pike, the latest retiree at the GACC Country Club...",
      "storyContent": [
        "Say hello to Norman Pike, the latest retiree at the GACC Country Club...",
        "They say he took his revenge on them...",
        "At some point, Norm worked for the city..."
      ],
      "images": [
        {
          "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/2308_cards.jpg",
          "alt": "Norman Pike Cards"
        },
        {
          "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/2308_hall.jpg",
          "alt": "Norman Pike Hall"
        }
      ]
    }
  ]
}
```

### 2. Get Story by Token ID

**GET** `/api/nft-stories/:tokenId`

Returns a specific story for a given token ID.

**Parameters:**
- `tokenId` (path parameter) - The NFT token ID

**Example Request:**
```
GET /api/nft-stories/2308
```

**Response:**
```json
{
  "success": true,
  "story": {
    "tokenId": "2308",
    "name": "Norman Pike",
    "title": "Grandpa Ape #2308 - Norman Pike | Grandpa Coin",
    "description": "Say hello to Norman Pike...",
    "storyContent": [
      "Paragraph 1...",
      "Paragraph 2..."
    ],
    "images": [
      {
        "url": "https://...",
        "alt": "Image description"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Story not found for this token ID"
}
```

## Story Data Structure

### Fields

- **tokenId** (string): The NFT token ID
- **name** (string): The character's name
- **title** (string): Full title for meta tags/SEO
- **description** (string): Short description (1-2 sentences)
- **storyContent** (array of strings): Story paragraphs with markdown support
- **images** (array of objects): Story images

### Image Object

- **url** (string): Full URL to the image
- **alt** (string): Alt text for the image

### Markdown Support

Story content supports basic markdown formatting:

- `*text*` - Italic text
- `**text**` - Bold text (future support)
- `***text***` - Bold italic text (future support)

**Example:**
```
"Holloway turned his frustration into a book, *The Last Banana*, but unfortunately..."
```

Renders as: "Holloway turned his frustration into a book, *The Last Banana*, but unfortunately..."

## Using in Discord Bot

### Example: Fetch and Display Story

```javascript
const fetch = require('node-fetch');

async function getStory(tokenId) {
  const response = await fetch(`https://your-server.com/api/nft-stories/${tokenId}`);
  const data = await response.json();

  if (!data.success) {
    return null;
  }

  return data.story;
}

// Discord command example
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!story')) {
    const tokenId = message.content.split(' ')[1];
    const story = await getStory(tokenId);

    if (!story) {
      message.reply('Story not found for that token ID!');
      return;
    }

    // Create embed
    const embed = {
      title: story.name,
      description: story.description,
      fields: story.storyContent.map((paragraph, index) => ({
        name: index === 0 ? 'Story' : '\u200b', // Zero-width space for continuation
        value: paragraph
      })),
      color: 0x977039 // Gold color
    };

    message.reply({ embeds: [embed] });

    // Send images
    if (story.images && story.images.length > 0) {
      for (const image of story.images) {
        message.channel.send(image.url);
      }
    }
  }
});
```

### Example: List All Available Stories

```javascript
async function listStories() {
  const response = await fetch('https://your-server.com/api/nft-stories');
  const data = await response.json();

  if (!data.success) {
    return [];
  }

  return data.stories.map(story => ({
    tokenId: story.tokenId,
    name: story.name
  }));
}

// Discord command to list stories
client.on('messageCreate', async (message) => {
  if (message.content === '!stories') {
    const stories = await listStories();
    const list = stories.map(s => `${s.tokenId} - ${s.name}`).join('\n');
    message.reply(`**Available Stories:**\n${list}`);
  }
});
```

### Discord Markdown Conversion

Discord uses similar markdown syntax, so most formatting will work automatically:

```javascript
function convertToDiscordMarkdown(text) {
  // Convert *text* to Discord italic (same syntax)
  return text;
  // Already compatible!
}
```

## Adding New Stories

To add new stories, edit the JSON file:

**File**: `/server/data/nft-stories.json`

```json
{
  "YOUR_TOKEN_ID": {
    "tokenId": "YOUR_TOKEN_ID",
    "name": "Character Name",
    "title": "Grandpa Ape #YOUR_TOKEN_ID - Character Name | Grandpa Coin",
    "description": "Short description here (1-2 sentences for meta tags).",
    "storyContent": [
      "First paragraph of the story...",
      "Second paragraph with *italic text* for emphasis...",
      "Third paragraph..."
    ],
    "images": [
      {
        "url": "https://your-image-url.com/image1.jpg",
        "alt": "Description of image 1"
      },
      {
        "url": "https://your-image-url.com/image2.jpg",
        "alt": "Description of image 2"
      }
    ]
  }
}
```

**Important**: After adding a new story, restart the server for changes to take effect.

## Error Handling

Always check the `success` field in responses:

```javascript
const data = await response.json();

if (!data.success) {
  console.error('API Error:', data.error);
  // Handle error
}
```

## Rate Limiting

There is currently no rate limiting on these endpoints. However, for production use, consider:

- Caching responses in your Discord bot
- Implementing a local cache with TTL
- Rate limiting bot commands that fetch stories

## CORS

The API has CORS enabled for all origins (`Access-Control-Allow-Origin: *`), allowing requests from any domain.

## Tips for Discord Bot Integration

1. **Cache Stories**: Fetch all stories on bot startup and cache them
2. **Use Embeds**: Discord embeds provide better formatting for stories
3. **Pagination**: For long stories, consider splitting into multiple embeds
4. **Image Handling**: Send images as separate messages or embed them
5. **Error Messages**: Provide helpful feedback when stories aren't found

## Example: Complete Discord Bot Command

```javascript
const fetch = require('node-fetch');

// Cache stories on bot startup
let storiesCache = {};

async function loadStories() {
  const response = await fetch('https://your-server.com/api/nft-stories');
  const data = await response.json();

  if (data.success) {
    data.stories.forEach(story => {
      storiesCache[story.tokenId] = story;
    });
    console.log(`Loaded ${Object.keys(storiesCache).length} stories`);
  }
}

// Load stories when bot starts
client.once('ready', async () => {
  await loadStories();
  console.log('Bot is ready!');
});

// Story command
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!story')) {
    const args = message.content.split(' ');
    const tokenId = args[1];

    if (!tokenId) {
      message.reply('Please provide a token ID. Example: `!story 2308`');
      return;
    }

    const story = storiesCache[tokenId];

    if (!story) {
      message.reply(`No story found for token #${tokenId}`);
      return;
    }

    // Create embed
    const embed = {
      title: `📖 ${story.name}`,
      description: story.storyContent.join('\n\n'),
      color: 0x977039,
      footer: {
        text: `Grandpa Ape #${tokenId}`
      }
    };

    // Add thumbnail if images available
    if (story.images && story.images.length > 0) {
      embed.thumbnail = { url: story.images[0].url };
    }

    await message.reply({ embeds: [embed] });

    // Send additional images if any
    if (story.images && story.images.length > 1) {
      for (let i = 1; i < story.images.length; i++) {
        await message.channel.send(story.images[i].url);
      }
    }
  }
});
```

# NFT Stories Data

This directory contains the NFT character stories that are served by the API and displayed on the website.

## File Structure

- `nft-stories.json` - Main stories data file

## Adding a New Story

To add a new story, edit `nft-stories.json` and add a new entry:

```json
{
  "EXISTING_STORIES": {...},

  "YOUR_TOKEN_ID": {
    "tokenId": "YOUR_TOKEN_ID",
    "name": "Character Name",
    "title": "Grandpa Ape #YOUR_TOKEN_ID - Character Name | Grandpa Coin",
    "description": "Brief 1-2 sentence description for meta tags and previews.",
    "storyContent": [
      "First paragraph of the story goes here. You can use *italic text* by wrapping it in asterisks.",
      "Second paragraph continues the story. Each array element is a new paragraph.",
      "Keep paragraphs readable - not too long!"
    ],
    "images": [
      {
        "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/TOKEN_image1.jpg",
        "alt": "Descriptive alt text for image 1"
      },
      {
        "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/TOKEN_image2.jpg",
        "alt": "Descriptive alt text for image 2"
      }
    ]
  }
}
```

## Field Descriptions

### Required Fields

- **tokenId**: String. Must match the NFT token ID exactly.
- **name**: Character's full name as it appears in the story.
- **title**: Full title for SEO/meta tags. Format: `Grandpa Ape #[ID] - [Name] | Grandpa Coin`
- **description**: Brief description (1-2 sentences) for social media previews and meta tags.
- **storyContent**: Array of paragraphs. Each element is one paragraph.
- **images**: Array of image objects (can be empty array `[]` if no images).

### Story Content Formatting

Use markdown for basic formatting:

- `*text*` = *italic* (use for book titles, emphasis)
- `**text**` = **bold** (future support)
- `"quotes"` = Regular quotes work fine

**Example:**
```json
"storyContent": [
  "John wrote a book called *The Great Adventure* in 1995.",
  "Critics said it was \"absolutely stunning\" but sales were poor."
]
```

### Images

Each image object needs:
- `url`: Full HTTPS URL to the image
- `alt`: Descriptive text for accessibility and Discord embeds

**Tips:**
- Keep images at a reasonable resolution (1000-2000px wide)
- Use descriptive alt text
- Order matters - first image is used as thumbnail

## Testing Your Changes

### 1. Restart the Server

After editing `nft-stories.json`, restart the Node server:

```bash
# Development
npm run dev

# Production
npm start
```

### 2. Test the API

```bash
# Get all stories
curl http://localhost:3001/api/nft-stories

# Get specific story
curl http://localhost:3001/api/nft-stories/YOUR_TOKEN_ID
```

### 3. Test on Website

Visit the website and check:
- Story button appears for the token
- Story modal opens correctly
- Images display properly
- Formatting looks good

### 4. Test with Discord Bot

If using a Discord bot, test the command:
```
!story YOUR_TOKEN_ID
```

## Common Issues

### Story Not Showing Up

1. **JSON Syntax Error**: Validate your JSON at https://jsonlint.com/
2. **Server Not Restarted**: Changes require server restart
3. **Incorrect Token ID**: Token ID must be a string and match exactly

### Images Not Loading

1. **Check URL**: Make sure image URLs are accessible
2. **HTTPS Required**: Use HTTPS URLs, not HTTP
3. **CORS Issues**: Images should be hosted on a CORS-friendly service

### Formatting Issues

1. **Escape Quotes**: Use `\"` for quotes inside strings
2. **Line Breaks**: Don't use `\n` - use multiple array elements
3. **Markdown**: Currently only `*italic*` is supported

## Example Story Entry

Here's a complete example:

```json
{
  "2308": {
    "tokenId": "2308",
    "name": "Norman Pike",
    "title": "Grandpa Ape #2308 - Norman Pike | Grandpa Coin",
    "description": "Say hello to Norman Pike, the latest retiree at the GACC Country Club. Whether that's his actual name depends on what you've heard and what you choose to believe.",
    "storyContent": [
      "Say hello to Norman Pike, the latest retiree at the GACC Country Club. Whether that's his actual name depends on what you've heard and what you choose to believe. You see, some say Norman once ran an underground casino and sports betting club that ran afoul of some nasty pieces of business.",
      "They say he took his revenge on them when they raided and shut down his club and sports book, and that he spent the last thirty years in witness protection. But those are just rumors.",
      "At some point, Norm worked for the city as a Risk Assessment Specialist. That much seems true, as he can often be seen strolling the grounds \"just noticing stuff\" but he never mentions anything about any of it. He just mutters what sounds like ODDS to himself and moves on.",
      "All in all, Norman is a nice enough resident. Just don't be offended if he doesn't respond when you talk to him. He has probably already determined your life expectancy and deemed a potential friendship too short to be worth making the effort."
    ],
    "images": [
      {
        "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/2308_cards.jpg",
        "alt": "Norman Pike Cards"
      },
      {
        "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/2308_hall.jpg",
        "alt": "Norman Pike Hall"
      },
      {
        "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/2308_talk.jpg",
        "alt": "Norman Pike Talk"
      },
      {
        "url": "https://gaccdiscordimages.s3.us-east-1.amazonaws.com/2308_buttons.jpg",
        "alt": "Norman Pike Buttons"
      }
    ]
  }
}
```

## Best Practices

1. **Keep It Organized**: Maintain consistent formatting and structure
2. **Validate JSON**: Always validate before committing changes
3. **Test Thoroughly**: Test on both website and Discord bot
4. **Backup**: Keep a backup before making major changes
5. **Version Control**: Commit changes to git with descriptive messages
6. **Image Alt Text**: Write meaningful alt text for accessibility

## Need Help?

See the full API documentation at `/docs/NFT_STORIES_API.md`

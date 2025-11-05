# Personal Diary App

A modern, offline-first personal diary application that works seamlessly across desktop, laptop, and mobile devices.

## Features

- **Rich Text Editor**: Write with formatting - bold, italic, headings, lists, and more
- **Photo Attachments**: Add images to your diary entries
- **Tags & Categories**: Organize entries with custom tags
- **Search**: Quickly find entries by keyword or tag
- **Calendar View**: Browse entries by date with an intuitive calendar
- **Offline-First**: Works without internet connection using IndexedDB
- **Progressive Web App**: Installable on all devices
- **Auto-Sync**: Syncs between devices when online (coming soon)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Rich Text**: TipTap editor
- **Storage**: IndexedDB (via idb library)
- **PWA**: Vite PWA plugin with Workbox
- **Styling**: Custom CSS with CSS variables

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
diary/
├── src/
│   ├── components/
│   │   ├── EntryList.tsx       # List view of entries
│   │   ├── EntryEditor.tsx     # Rich text editor
│   │   └── CalendarView.tsx    # Calendar view
│   ├── db.ts                   # IndexedDB operations
│   ├── types.ts                # TypeScript type definitions
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # App entry point
├── index.html
├── vite.config.ts              # Vite & PWA configuration
└── package.json
```

## Usage

### Creating an Entry

1. Click "New Entry" button
2. Add a title
3. Write your content using the rich text editor
4. Add tags to organize your entry
5. Optionally attach photos
6. Click "Save"

### Searching

Use the search box in the sidebar to find entries by:
- Title
- Content
- Tags

### Viewing by Date

Switch to Calendar view to:
- See which dates have entries (marked with a dot)
- Click any date to see entries from that day
- Click an entry to view/edit it

### Tags

- Add tags when creating/editing entries
- Filter entries by clicking tags in the sidebar
- Click multiple tags to see entries with any of those tags

## Offline Functionality

The app is designed to work offline:
- All data stored locally in IndexedDB
- Service worker caches app assets
- Works in airplane mode or with no internet
- Online/offline status shown in header

## Installing as PWA

### Desktop (Chrome/Edge)
1. Click the install icon in the address bar
2. Or go to Menu > Install Personal Diary

### Mobile (iOS)
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

### Mobile (Android)
1. Open in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home Screen"

## Future Enhancements

### Planned Features
- [ ] Cloud sync with Supabase/Firebase
- [ ] Conflict resolution for synced entries
- [ ] Export entries (PDF, Markdown, JSON)
- [ ] Mood tracking
- [ ] Entry templates
- [ ] Password protection/encryption
- [ ] Dark mode
- [ ] Multiple journals
- [ ] Voice notes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Data Storage

All data is stored locally in your browser's IndexedDB. To backup your data:
1. Use browser's developer tools
2. Export IndexedDB data
3. Or implement the export feature (coming soon)

## Privacy

- All data stays on your device
- No tracking or analytics
- No data sent to external servers (until sync is implemented)
- You own your data

## Troubleshooting

### App won't load
- Clear browser cache
- Check browser console for errors
- Try in incognito/private mode

### Data not saving
- Check browser storage quota
- Ensure IndexedDB is enabled
- Check for browser extensions blocking storage

### PWA won't install
- Ensure using HTTPS (required for PWA)
- Try a different browser
- Check browser PWA support

## License

This project is open source and available under the MIT License.

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## Support

For issues or questions, please open an issue on the project repository.

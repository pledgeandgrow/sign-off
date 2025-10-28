# Asset Generation Script

This script automatically generates all required app store assets (icons, screenshots, graphics) from your source images.

## 📋 Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Source images required:**
   - `assets/images/heriwill-og.png` - Open Graph image (1200x630 recommended)
   - `assets/images/heriwill-favicon.png` - Favicon source (256x256 recommended)
   - `assets/images/heriwill-transparent.png` - App icon with transparent background (1024x1024 recommended)

## 🚀 Usage

Run the asset generation script:

```bash
npm run generate-assets
```

Or directly:

```bash
node scripts/generate-assets.js
```

## 📦 Generated Assets

### iOS App Store (`assets/app-store/ios/`)
- **App Icons:** 13 sizes (20px to 1024px)
  - 1024x1024 - App Store listing
  - 180x180 - iPhone 3x
  - 167x167 - iPad Pro
  - 152x152 - iPad 2x
  - 120x120 - iPhone 2x
  - And more...

### Google Play Store (`assets/app-store/android/`)
- **App Icons:** 6 sizes (48px to 512px)
  - 512x512 - Play Store listing
  - 192x192 - xxxhdpi
  - 144x144 - xxhdpi
  - And more...
- **Feature Graphic:** 1024x500

### Web Assets (`assets/app-store/web/`)
- **Favicons:** 6 sizes (16px to 256px)
- **Apple Touch Icons:** 9 sizes (57px to 180px)
- **PWA Icons:** 2 sizes (192px, 512px)
- **Open Graph Images:** 2 sizes (1200x630, 1200x1200)
- **manifest.json** - PWA manifest file

### Screenshots (`assets/app-store/screenshots/`)
- **iOS:**
  - 3x iPhone 6.7" (1290x2796) - iPhone 14 Pro Max
  - 2x iPad Pro 12.9" (2048x2732)
- **Android:**
  - 3x Phone (1080x1920)
  - 2x Tablet 7" (1200x1920)

*Note: Screenshots are generated as placeholders. Replace them with actual app screenshots.*

## 📸 Creating Real Screenshots

### For iOS:
1. Use Xcode Simulator with iPhone 14 Pro Max
2. Navigate to key screens: Vaults, Heirs, Sign-off, Security
3. Take screenshots (Cmd+S in simulator)
4. Replace placeholder files in `assets/app-store/screenshots/`

### For Android:
1. Use Android Studio Emulator (Pixel 7 Pro or similar)
2. Navigate to the same key screens
3. Take screenshots (Camera icon in emulator toolbar)
4. Replace placeholder files in `assets/app-store/screenshots/`

### Screenshot Recommendations:
- **Screen 1:** Vault overview showing security features
- **Screen 2:** Heir management interface
- **Screen 3:** Sign-off configuration
- **Screen 4:** Item details or encryption features
- **Screen 5:** Settings or profile page

Keep branding consistent across all screenshots!

## 🎨 Customization

Edit `scripts/generate-assets.js` to:
- Add more icon sizes
- Change background colors
- Modify placeholder designs
- Add watermarks or branding
- Generate additional formats

## 📁 Output Structure

```
assets/app-store/
├── ios/
│   ├── app-icon-1024.png
│   ├── app-icon-180.png
│   └── ... (13 total)
├── android/
│   ├── app-icon-512.png
│   ├── app-icon-192.png
│   ├── feature-graphic.png
│   └── ... (7 total)
├── web/
│   ├── favicon-16x16.png
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── og-image.png
│   ├── manifest.json
│   └── ... (18 total)
├── screenshots/
│   ├── screenshot-1-6.7.png (iOS)
│   ├── screenshot-1-phone.png (Android)
│   └── ... (10 total placeholders)
└── README.md
```

## 🔧 Troubleshooting

### "Cannot find module 'sharp'"
```bash
npm install sharp
```

### "Source image not found"
Ensure these files exist:
- `assets/images/heriwill-og.png`
- `assets/images/heriwill-favicon.png`
- `assets/images/heriwill-transparent.png`

### "Permission denied"
Run with appropriate permissions or check file/folder permissions.

### Low quality icons
Use high-resolution source images:
- App icon: 1024x1024 minimum
- OG image: 1200x630 minimum
- Favicon: 256x256 minimum

## 📱 Next Steps

### iOS App Store Connect:
1. Upload `app-icon-1024.png` as app icon
2. Upload screenshots for iPhone 6.7" display
3. Upload screenshots for iPad Pro 12.9" display
4. Add app description and keywords

### Google Play Console:
1. Upload `app-icon-512.png` as high-res icon
2. Upload `feature-graphic.png` as feature graphic
3. Upload phone screenshots (1080x1920)
4. Upload tablet screenshots (1200x1920)
5. Add app description and keywords

### Web Deployment:
1. Copy web assets to `public/` directory
2. Add favicon links to HTML `<head>`:
   ```html
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
   <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
   <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
   <link rel="manifest" href="/manifest.json">
   ```
3. Add Open Graph meta tags:
   ```html
   <meta property="og:image" content="/og-image.png">
   <meta property="og:image:width" content="1200">
   <meta property="og:image:height" content="630">
   ```

## 🎯 Quality Checklist

- [ ] All icons are sharp and clear at all sizes
- [ ] Transparent backgrounds work correctly
- [ ] Screenshots show actual app features (not placeholders)
- [ ] Branding is consistent across all assets
- [ ] Text is readable in all screenshots
- [ ] Colors match brand guidelines
- [ ] No copyrighted content in assets
- [ ] All required sizes are generated
- [ ] manifest.json has correct app details
- [ ] OG images display correctly on social media

## 📚 Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Icon Design Guidelines](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [PWA Icon Guidelines](https://web.dev/add-manifest/)
- [Open Graph Protocol](https://ogp.me/)

## 🐛 Issues?

If you encounter any issues:
1. Check that source images exist and are valid PNG files
2. Ensure Node.js version is 14+ (`node --version`)
3. Clear output directories and regenerate
4. Check console for specific error messages

---

**Generated by:** Heriwill Asset Generator  
**Last Updated:** 2025

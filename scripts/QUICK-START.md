# Quick Start - Asset Generation

## 🚀 Generate All Assets (One Command)

```bash
# Install dependencies first (one time only)
npm install

# Generate all assets
npm run generate-assets
```

## 📦 What Gets Generated

✅ **iOS:** 13 app icons (20px - 1024px)  
✅ **Android:** 6 app icons + feature graphic  
✅ **Web:** Favicons, Apple icons, PWA icons, OG images  
✅ **Screenshots:** 10 placeholder screenshots (iOS + Android)  
✅ **Manifest:** PWA manifest.json  
✅ **README:** Detailed documentation

## 📁 Output Location

```
assets/app-store/
├── ios/          → iOS App Store assets
├── android/      → Google Play Store assets
├── web/          → Web favicons & PWA icons
└── screenshots/  → Placeholder screenshots
```

## ⚡ Next Steps

1. **Replace Screenshots:**
   - Take real app screenshots
   - Replace files in `assets/app-store/screenshots/`

2. **Upload to App Stores:**
   - **iOS:** Use `app-icon-1024.png` + screenshots
   - **Android:** Use `app-icon-512.png` + `feature-graphic.png` + screenshots

3. **Deploy Web Assets:**
   - Copy `assets/app-store/web/*` to `public/`
   - Add favicon links to HTML

## 🎯 Screenshot Sizes Needed

### iOS (Required)
- iPhone 6.7" (1290x2796) - 3-5 screenshots
- iPad Pro 12.9" (2048x2732) - 2-3 screenshots

### Android (Required)
- Phone (1080x1920) - 3-8 screenshots
- Tablet 7" (1200x1920) - 2-4 screenshots

## 💡 Tips

- Use **high-resolution** source images (1024x1024 minimum for icons)
- Keep **branding consistent** across all platforms
- Show **key features** in screenshots: Vaults, Heirs, Sign-off, Security
- Test icons on **different backgrounds** (light/dark mode)

## 🔧 Troubleshooting

**Error: Cannot find module 'sharp'**
```bash
npm install sharp
```

**Error: Source image not found**
- Check that `assets/images/heriwill-*.png` files exist

**Low quality output**
- Use larger source images (1024x1024+ recommended)

---

**Ready to launch?** See `scripts/README-ASSETS.md` for detailed documentation.

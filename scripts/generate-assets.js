/**
 * Asset Generator Script
 * Generates all app store images and icons from source images
 * 
 * Usage: node scripts/generate-assets.js
 * 
 * Requirements: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source images
const SOURCE_IMAGES = {
  og: path.join(__dirname, '../assets/images/heriwill-og.png'),
  favicon: path.join(__dirname, '../assets/images/heriwill-favicon.png'),
  transparent: path.join(__dirname, '../assets/images/heriwill-transparent.png')
};

// Output directories
const OUTPUT_DIRS = {
  ios: path.join(__dirname, '../assets/app-store/ios'),
  android: path.join(__dirname, '../assets/app-store/android'),
  web: path.join(__dirname, '../assets/app-store/web'),
  screenshots: path.join(__dirname, '../assets/app-store/screenshots')
};

// iOS App Store Assets
const IOS_ASSETS = {
  // App Icon (required sizes)
  appIcon: [
    { size: 1024, name: 'app-icon-1024.png', description: 'App Store' },
    { size: 180, name: 'app-icon-180.png', description: 'iPhone 3x' },
    { size: 167, name: 'app-icon-167.png', description: 'iPad Pro' },
    { size: 152, name: 'app-icon-152.png', description: 'iPad 2x' },
    { size: 120, name: 'app-icon-120.png', description: 'iPhone 2x' },
    { size: 87, name: 'app-icon-87.png', description: 'iPhone 3x Settings' },
    { size: 80, name: 'app-icon-80.png', description: 'iPad 2x Settings' },
    { size: 76, name: 'app-icon-76.png', description: 'iPad' },
    { size: 60, name: 'app-icon-60.png', description: 'iPhone' },
    { size: 58, name: 'app-icon-58.png', description: 'iPhone 2x Settings' },
    { size: 40, name: 'app-icon-40.png', description: 'iPad Settings' },
    { size: 29, name: 'app-icon-29.png', description: 'Settings' },
    { size: 20, name: 'app-icon-20.png', description: 'Notifications' }
  ],
  // Screenshots (iPhone 6.7" - iPhone 14 Pro Max)
  screenshots: [
    { width: 1290, height: 2796, name: 'screenshot-1-6.7.png' },
    { width: 1290, height: 2796, name: 'screenshot-2-6.7.png' },
    { width: 1290, height: 2796, name: 'screenshot-3-6.7.png' }
  ],
  // Screenshots (iPad Pro 12.9" 3rd gen)
  screenshotsiPad: [
    { width: 2048, height: 2732, name: 'screenshot-1-ipad.png' },
    { width: 2048, height: 2732, name: 'screenshot-2-ipad.png' }
  ]
};

// Android/Google Play Store Assets
const ANDROID_ASSETS = {
  // App Icon
  appIcon: [
    { size: 512, name: 'app-icon-512.png', description: 'Play Store' },
    { size: 192, name: 'app-icon-192.png', description: 'xxxhdpi' },
    { size: 144, name: 'app-icon-144.png', description: 'xxhdpi' },
    { size: 96, name: 'app-icon-96.png', description: 'xhdpi' },
    { size: 72, name: 'app-icon-72.png', description: 'hdpi' },
    { size: 48, name: 'app-icon-48.png', description: 'mdpi' }
  ],
  // Feature Graphic
  featureGraphic: { width: 1024, height: 500, name: 'feature-graphic.png' },
  // Screenshots (Phone)
  screenshots: [
    { width: 1080, height: 1920, name: 'screenshot-1-phone.png' },
    { width: 1080, height: 1920, name: 'screenshot-2-phone.png' },
    { width: 1080, height: 1920, name: 'screenshot-3-phone.png' }
  ],
  // Screenshots (Tablet 7")
  screenshotsTablet: [
    { width: 1200, height: 1920, name: 'screenshot-1-tablet.png' },
    { width: 1200, height: 1920, name: 'screenshot-2-tablet.png' }
  ]
};

// Web Assets
const WEB_ASSETS = {
  favicons: [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 64, name: 'favicon-64x64.png' },
    { size: 128, name: 'favicon-128x128.png' },
    { size: 256, name: 'favicon-256x256.png' }
  ],
  appleTouchIcons: [
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 152, name: 'apple-touch-icon-152x152.png' },
    { size: 144, name: 'apple-touch-icon-144x144.png' },
    { size: 120, name: 'apple-touch-icon-120x120.png' },
    { size: 114, name: 'apple-touch-icon-114x114.png' },
    { size: 76, name: 'apple-touch-icon-76x76.png' },
    { size: 72, name: 'apple-touch-icon-72x72.png' },
    { size: 60, name: 'apple-touch-icon-60x60.png' },
    { size: 57, name: 'apple-touch-icon-57x57.png' }
  ],
  pwa: [
    { size: 192, name: 'pwa-192x192.png' },
    { size: 512, name: 'pwa-512x512.png' }
  ],
  og: [
    { width: 1200, height: 630, name: 'og-image.png', description: 'Open Graph' },
    { width: 1200, height: 1200, name: 'og-square.png', description: 'Square OG' }
  ]
};

// Create output directories
function createDirectories() {
  Object.values(OUTPUT_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
}

// Generate square icons (app icons)
async function generateSquareIcons(sourceImage, assets, outputDir) {
  console.log(`\n📱 Generating icons from ${path.basename(sourceImage)}...`);
  
  for (const asset of assets) {
    try {
      const outputPath = path.join(outputDir, asset.name);
      await sharp(sourceImage)
        .resize(asset.size, asset.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ ${asset.name} (${asset.size}x${asset.size}) - ${asset.description || ''}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${asset.name}:`, error.message);
    }
  }
}

// Generate rectangular graphics
async function generateRectangularGraphic(sourceImage, asset, outputPath) {
  try {
    await sharp(sourceImage)
      .resize(asset.width, asset.height, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  ✓ ${asset.name} (${asset.width}x${asset.height})`);
  } catch (error) {
    console.error(`  ✗ Failed to generate ${asset.name}:`, error.message);
  }
}

// Generate placeholder screenshots
async function generatePlaceholderScreenshot(asset, outputPath) {
  try {
    // Create a placeholder with app branding
    await sharp({
      create: {
        width: asset.width,
        height: asset.height,
        channels: 4,
        background: { r: 99, g: 102, b: 241, alpha: 1 } // Brand color
      }
    })
    .composite([{
      input: Buffer.from(`
        <svg width="${asset.width}" height="${asset.height}">
          <rect width="100%" height="100%" fill="#6366f1"/>
          <text x="50%" y="50%" font-family="Arial" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
            Heriwill
          </text>
          <text x="50%" y="60%" font-family="Arial" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">
            ${asset.width}x${asset.height}
          </text>
        </svg>
      `),
      top: 0,
      left: 0
    }])
    .png()
    .toFile(outputPath);
    
    console.log(`  ✓ ${asset.name} (placeholder)`);
  } catch (error) {
    console.error(`  ✗ Failed to generate ${asset.name}:`, error.message);
  }
}

// Main generation function
async function generateAllAssets() {
  console.log('🚀 Starting asset generation...\n');
  
  // Create directories
  createDirectories();
  
  // iOS Assets
  console.log('\n📱 iOS App Store Assets');
  console.log('========================');
  await generateSquareIcons(SOURCE_IMAGES.transparent, IOS_ASSETS.appIcon, OUTPUT_DIRS.ios);
  
  console.log('\n📸 iOS Screenshots (placeholders)');
  for (const screenshot of IOS_ASSETS.screenshots) {
    await generatePlaceholderScreenshot(screenshot, path.join(OUTPUT_DIRS.screenshots, screenshot.name));
  }
  for (const screenshot of IOS_ASSETS.screenshotsiPad) {
    await generatePlaceholderScreenshot(screenshot, path.join(OUTPUT_DIRS.screenshots, screenshot.name));
  }
  
  // Android Assets
  console.log('\n🤖 Android/Google Play Store Assets');
  console.log('====================================');
  await generateSquareIcons(SOURCE_IMAGES.transparent, ANDROID_ASSETS.appIcon, OUTPUT_DIRS.android);
  
  console.log('\n🎨 Feature Graphic');
  await generateRectangularGraphic(
    SOURCE_IMAGES.og,
    ANDROID_ASSETS.featureGraphic,
    path.join(OUTPUT_DIRS.android, ANDROID_ASSETS.featureGraphic.name)
  );
  
  console.log('\n📸 Android Screenshots (placeholders)');
  for (const screenshot of ANDROID_ASSETS.screenshots) {
    await generatePlaceholderScreenshot(screenshot, path.join(OUTPUT_DIRS.screenshots, screenshot.name));
  }
  for (const screenshot of ANDROID_ASSETS.screenshotsTablet) {
    await generatePlaceholderScreenshot(screenshot, path.join(OUTPUT_DIRS.screenshots, screenshot.name));
  }
  
  // Web Assets
  console.log('\n🌐 Web Assets');
  console.log('=============');
  
  console.log('\n🔖 Favicons');
  await generateSquareIcons(SOURCE_IMAGES.favicon, WEB_ASSETS.favicons, OUTPUT_DIRS.web);
  
  console.log('\n🍎 Apple Touch Icons');
  await generateSquareIcons(SOURCE_IMAGES.transparent, WEB_ASSETS.appleTouchIcons, OUTPUT_DIRS.web);
  
  console.log('\n📱 PWA Icons');
  await generateSquareIcons(SOURCE_IMAGES.transparent, WEB_ASSETS.pwa, OUTPUT_DIRS.web);
  
  console.log('\n🖼️  Open Graph Images');
  for (const ogAsset of WEB_ASSETS.og) {
    await generateRectangularGraphic(
      SOURCE_IMAGES.og,
      ogAsset,
      path.join(OUTPUT_DIRS.web, ogAsset.name)
    );
  }
  
  // Generate manifest.json
  console.log('\n📄 Generating manifest.json');
  const manifest = {
    name: 'Heriwill',
    short_name: 'Heriwill',
    description: 'Gérez votre héritage numérique et vos dernières volontés',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/assets/app-store/web/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/assets/app-store/web/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIRS.web, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('  ✓ manifest.json');
  
  // Generate README
  console.log('\n📝 Generating README');
  const readme = `# App Store Assets

Generated on: ${new Date().toISOString()}

## iOS App Store
- App Icons: ${IOS_ASSETS.appIcon.length} sizes
- Screenshots: ${IOS_ASSETS.screenshots.length + IOS_ASSETS.screenshotsiPad.length} placeholders

## Google Play Store
- App Icons: ${ANDROID_ASSETS.appIcon.length} sizes
- Feature Graphic: 1024x500
- Screenshots: ${ANDROID_ASSETS.screenshots.length + ANDROID_ASSETS.screenshotsTablet.length} placeholders

## Web Assets
- Favicons: ${WEB_ASSETS.favicons.length} sizes
- Apple Touch Icons: ${WEB_ASSETS.appleTouchIcons.length} sizes
- PWA Icons: ${WEB_ASSETS.pwa.length} sizes
- Open Graph Images: ${WEB_ASSETS.og.length} sizes

## Next Steps

### iOS App Store
1. Replace placeholder screenshots with actual app screenshots
2. Upload app-icon-1024.png to App Store Connect
3. Upload screenshots to App Store Connect

### Google Play Store
1. Replace placeholder screenshots with actual app screenshots
2. Upload app-icon-512.png to Google Play Console
3. Upload feature-graphic.png to Google Play Console
4. Upload screenshots to Google Play Console

### Web
1. Copy web assets to your public/assets directory
2. Update your HTML with favicon links
3. Add manifest.json to your public directory

## Screenshot Recommendations

### iOS
- Use iPhone 14 Pro Max (6.7") for primary screenshots
- Capture key features: vaults, heirs, sign-off, security
- Use consistent branding and colors

### Android
- Use Pixel 7 Pro or similar (1080x1920) for phone screenshots
- Use 7" tablet for tablet screenshots
- Show the same features as iOS for consistency

## Tools for Screenshots
- iOS: Xcode Simulator + Screenshot tool
- Android: Android Studio Emulator + Screenshot tool
- Design: Figma, Sketch, or Adobe XD for mockups
`;
  
  fs.writeFileSync(
    path.join(__dirname, '../assets/app-store/README.md'),
    readme
  );
  console.log('  ✓ README.md');
  
  console.log('\n✅ Asset generation complete!');
  console.log('\n📊 Summary:');
  console.log(`  iOS Icons: ${IOS_ASSETS.appIcon.length}`);
  console.log(`  Android Icons: ${ANDROID_ASSETS.appIcon.length}`);
  console.log(`  Web Icons: ${WEB_ASSETS.favicons.length + WEB_ASSETS.appleTouchIcons.length + WEB_ASSETS.pwa.length}`);
  console.log(`  Screenshots: ${IOS_ASSETS.screenshots.length + IOS_ASSETS.screenshotsiPad.length + ANDROID_ASSETS.screenshots.length + ANDROID_ASSETS.screenshotsTablet.length} (placeholders)`);
  console.log('\n💡 Next: Replace placeholder screenshots with actual app screenshots');
}

// Run the script
generateAllAssets().catch(error => {
  console.error('❌ Error generating assets:', error);
  process.exit(1);
});

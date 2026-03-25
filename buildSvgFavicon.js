const fs = require('fs');

async function createRoundedSvgFavicon() {
    try {
        // Read the transparent or white logo
        const imageBuffer = fs.readFileSync('frontend/src/assest/fav_logo/srv-w.png');
        const base64Image = imageBuffer.toString('base64');
        const dataUri = `data:image/png;base64,${base64Image}`;

        // Create an SVG that wraps the image tightly in a squircle/rounded rectangle
        // viewBox 0 0 512 512, with a 150px border radius (very visibly rounded)
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <clipPath id="roundCorner">
      <rect x="0" y="0" width="512" height="512" rx="120" ry="120"/>
    </clipPath>
  </defs>
  <image href="${dataUri}" width="512" height="512" clip-path="url(#roundCorner)" preserveAspectRatio="xMidYMid slice"/>
</svg>`;

        // Write to both public directories
        fs.writeFileSync('frontend/public/favicon.svg', svgContent);
        fs.writeFileSync('admin/public/favicon.svg', svgContent);
        
        console.log("Successfully created highly rounded SVG favicons!");
    } catch (err) {
        console.error("Failed:", err);
    }
}

createRoundedSvgFavicon();

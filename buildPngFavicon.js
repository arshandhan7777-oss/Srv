const Jimp = require('jimp');

async function createDeepRoundedFavicon() {
    try {
        // Read the solid white logo
        const image = await Jimp.read('frontend/src/assest/fav_logo/srv-w.png');
        const w = image.bitmap.width;  // typically ~512
        const h = image.bitmap.height; // typically ~512

        // Use a massive 25% curve radius to guarantee it looks extremely rounded
        const radius = Math.floor(Math.min(w, h) * 0.25); 

        image.scan(0, 0, w, h, function (x, y, idx) {
            let isOutside = false;

            // Top-left
            if (x < radius && y < radius) {
                if (Math.pow(x - radius, 2) + Math.pow(y - radius, 2) > Math.pow(radius, 2)) {
                    isOutside = true;
                }
            }
            // Top-right
            else if (x > w - radius && y < radius) {
                if (Math.pow(x - (w - radius), 2) + Math.pow(y - radius, 2) > Math.pow(radius, 2)) {
                    isOutside = true;
                }
            }
            // Bottom-left
            else if (x < radius && y > h - radius) {
                if (Math.pow(x - radius, 2) + Math.pow(y - (h - radius), 2) > Math.pow(radius, 2)) {
                    isOutside = true;
                }
            }
            // Bottom-right
            else if (x > w - radius && y > h - radius) {
                if (Math.pow(x - (w - radius), 2) + Math.pow(y - (h - radius), 2) > Math.pow(radius, 2)) {
                    isOutside = true;
                }
            }

            if (isOutside) {
                this.bitmap.data[idx + 3] = 0; // Transparent
            }
        });

        // Save as a totally new filename to aggressively bypass user browser cache natively
        await image.writeAsync('frontend/public/favicon-rounded.png');
        await image.writeAsync('admin/public/favicon-rounded.png');
        
        console.log("Successfully created highly rounded PNG favicons!");
    } catch (err) {
        console.error("Failed:", err);
    }
}

createDeepRoundedFavicon();

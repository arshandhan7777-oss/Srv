const Jimp = require('jimp');
const fs = require('fs');

async function curveCorners(inputFile, outputFiles, radius) {
    try {
        const image = await Jimp.read(inputFile);
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        
        // We iterate through every pixel.
        // If it's outside the rounded rectangle with `radius`, we set alpha to 0.
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
                this.bitmap.data[idx + 3] = 0; // Set alpha strictly to 0
            }
        });

        for (const outPath of outputFiles) {
            await image.writeAsync(outPath);
            console.log(`Successfully wrote curved favicon to: ${outPath}`);
        }
    } catch (err) {
        console.error("Error processing image:", err);
    }
}

// 75px radius on an assumed square (like 512x512) gives a "little bit" of curve
curveCorners(
    'frontend/src/assest/fav_logo/srv-w.png', 
    ['frontend/public/favicon.png', 'admin/public/favicon.png'], 
    40
);

export function compressBase64Image(
  base64Str: string | undefined,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.7,
  removeBg = false
): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str || '');
      return;
    }
    
    // If already reasonably small (e.g., < 200KB) and background removal is not requested, resolve immediately
    if (base64Str.length < 200000 && !removeBg) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      if (removeBg) {
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          
          const centerX = width / 2;
          const centerY = height / 2;
          const maxRadius = Math.min(width, height) / 2;

          // Get corner colors to identify the background color
          const getPixel = (px: number, py: number) => {
            const idx = (Math.min(Math.max(py, 0), height - 1) * width + Math.min(Math.max(px, 0), width - 1)) * 4;
            return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
          };

          const cornerColors = [
            getPixel(0, 0),
            getPixel(width - 1, 0),
            getPixel(0, height - 1),
            getPixel(width - 1, height - 1)
          ];

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              if (a === 0) continue;

              const dx = x - centerX;
              const dy = y - centerY;
              const distToCenter = Math.sqrt(dx * dx + dy * dy);

              // 1. Remove White/Light background (for any position, but especially inside/outside the logo)
              const minVal = Math.min(r, g, b);
              if (minVal >= 190) {
                const ratio = (255 - minVal) / (255 - 190);
                data[idx + 3] = Math.min(a, Math.round(a * ratio));
                continue;
              }

              // 2. Remove Dark/Black/Gray corners or borders
              // If the pixel is near the outer boundary (corners of the square)
              if (distToCenter > maxRadius * 0.8) {
                // Check if it matches any corner color
                const isCloseToCorner = cornerColors.some(([cr, cg, cb, ca]) => {
                  if (ca < 10) return true; // corner is already transparent
                  const colorDist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
                  return colorDist < 95; // generous tolerance for JPEG compression artifacts at corners
                });

                // Also check if it's near-black/dark gray/gray (since background borders are often dark/black)
                const isDarkBorder = (r < 115 && g < 115 && b < 115);
                
                if (isCloseToCorner || isDarkBorder) {
                  // Gradually fade out towards the edges
                  const edgeFactor = (distToCenter - maxRadius * 0.8) / (maxRadius * 0.2);
                  const opacity = Math.max(0, 1 - edgeFactor);
                  data[idx + 3] = Math.min(data[idx + 3], Math.round(a * opacity));
                }
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (err) {
          console.error("Failed to remove backgrounds:", err);
        }
      }

      // Use PNG for transparency if background removal was performed
      const outputFormat = removeBg ? 'image/png' : 'image/jpeg';
      const compressed = canvas.toDataURL(outputFormat, removeBg ? undefined : quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export async function compressSettingsImages(settings: any): Promise<any> {
  if (!settings) return settings;
  const compressed = { ...settings };
  if (compressed.logoSekolah) {
    compressed.logoSekolah = await compressBase64Image(compressed.logoSekolah, 400, 400, 0.75, true);
  }
  if (compressed.kopSurat) {
    // Kop surat is a wide banner, allow larger maxWidth (1200)
    compressed.kopSurat = await compressBase64Image(compressed.kopSurat, 1200, 400, 0.75, false);
  }
  if (compressed.ttdPengasuh) {
    compressed.ttdPengasuh = await compressBase64Image(compressed.ttdPengasuh, 400, 300, 0.7, true);
  }
  if (compressed.ttdKepala) {
    compressed.ttdKepala = await compressBase64Image(compressed.ttdKepala, 400, 300, 0.7, true);
  }
  return compressed;
}

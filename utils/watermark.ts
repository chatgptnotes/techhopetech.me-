export const addWatermarkToImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(imageDataUrl);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Configure watermark style
      const watermarkText = 'Headz';
      const fontSize = Math.min(img.width, img.height) * 0.05; // 5% of smallest dimension

      // Add semi-transparent white background for better visibility
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      const textMetrics = ctx.measureText(watermarkText);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // Position in bottom right with padding
      const padding = fontSize * 0.5;
      const xPosition = canvas.width - textWidth - padding;
      const yPosition = canvas.height - padding;

      // Draw semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(
        xPosition - padding * 0.5,
        yPosition - textHeight - padding * 0.3,
        textWidth + padding,
        textHeight + padding * 0.6
      );

      // Draw watermark text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

      // Add subtle embossed effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillText(watermarkText, canvas.width - padding + 1, canvas.height - padding + 1);

      // Add the main watermark again for prominence
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

      // Optionally add a diagonal watermark for extra protection
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // -30 degrees
      ctx.font = `bold ${fontSize * 2}px Arial, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Headz', 0, 0);
      ctx.restore();

      // Convert canvas back to data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = imageDataUrl;
  });
};

export const addStylishWatermark = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(imageDataUrl);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Configure watermark style
      const watermarkText = 'Headz';
      const fontSize = Math.min(img.width, img.height) * 0.055; // Slightly larger for better visibility

      // Bottom right corner watermark with gradient effect
      const padding = fontSize * 0.8;

      ctx.save();

      // Create gradient for text with higher opacity
      const gradient = ctx.createLinearGradient(
        canvas.width - 200,
        canvas.height - 50,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      gradient.addColorStop(0.5, 'rgba(245, 245, 245, 0.75)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.70)');

      // Shadow effect for visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.70)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      // Draw watermark text
      ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = gradient;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

      ctx.restore();

      // Add subtle repeating pattern for extra protection
      ctx.save();
      ctx.globalAlpha = 0.30;
      const patternSize = fontSize * 4;
      const numCols = Math.ceil(canvas.width / patternSize);
      const numRows = 3;

      ctx.font = `bold ${fontSize * 0.8}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          ctx.save();
          ctx.translate(col * patternSize + patternSize / 2, row * patternSize + patternSize / 2);
          ctx.rotate(-Math.PI / 8); // -22.5 degrees
          ctx.fillText('Headz', 0, 0);
          ctx.restore();
        }
      }

      ctx.restore();

      // Add website URL at the bottom center
      ctx.save();
      const urlText = 'www.headzhairfixing.com';
      const urlFontSize = fontSize * 0.55;
      ctx.font = `${urlFontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(urlText, canvas.width / 2, canvas.height - urlFontSize * 0.5);
      ctx.restore();

      // Convert canvas back to data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = imageDataUrl;
  });
};
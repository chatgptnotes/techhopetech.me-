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

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const watermarkText = 'Headz';
      const fontSize = Math.min(img.width, img.height) * 0.08;

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };

    img.src = imageDataUrl;
  });
};
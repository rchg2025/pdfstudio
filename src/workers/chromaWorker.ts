self.onmessage = function (e) {
    const { imageData, targetColor, tolerance, softness } = e.data;
    const data = imageData.data;
    
    // Max distance in RGB space is sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
    const maxAllowedDistance = (tolerance / 255) * 441.67;
    const innerThreshold = Math.max(0, maxAllowedDistance - (softness * 2));
    const range = maxAllowedDistance - innerThreshold;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        const rDiff = r - targetColor.r;
        const gDiff = g - targetColor.g;
        const bDiff = b - targetColor.b;
        const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

        if (distance <= maxAllowedDistance) {
            if (softness === 0) {
                data[i + 3] = 0;
            } else {
                if (distance <= innerThreshold) {
                    data[i + 3] = 0;
                } else if (range > 0) {
                    const distInRange = distance - innerThreshold;
                    const ratio = distInRange / range;
                    data[i + 3] = Math.floor(a * ratio);
                }
            }
        }
    }

    self.postMessage({ processedData: imageData }, [imageData.data.buffer]);
};

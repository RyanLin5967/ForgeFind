// State variables held in memory
let currentOrgImg = null;
let currentMaskImg = null;
let currentCoords = [];
let canvas = null;
let ctx = null;

// Call this once when your webpage loads
export function initCanvas(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
}

// Called by api.js when the backend responds
export async function draw_visuals(org_url, mask_url, coords) {
    currentCoords = coords || [];
    
    // Load both images into the browser's memory
    currentOrgImg = await loadImage(org_url);
    currentMaskImg = await loadImage(mask_url);
    
    // Size the canvas to fit the uploaded image
    canvas.width = currentOrgImg.width;
    canvas.height = currentOrgImg.height;

    // Default view when upload finishes
    renderView('overall');
}

// what the buttons will call
export function renderView(viewType) {
    if (!currentOrgImg) return; // Do nothing if no image is uploaded yet
    
    // wipe the canvas clean and draw the original base photo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentOrgImg, 0, 0);

    // draw PyTorch Mask
    if (viewType === 'noise' || viewType === 'overall') {
        drawAIOverlay();
    }

    // draw OpenCV Boxes
    if (viewType === 'clone' || viewType === 'overall') {
        drawBoxes();
    }
}

// make image loading a promise so you can use async/await
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Prevents Canvas security taint
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image: " + src));
        img.src = src; 
    });
}

// black/white -> transparent/red
function drawAIOverlay() {
    // Draw the B&W mask to a hidden, temporary canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext('2d');
    
    offCtx.drawImage(currentMaskImg, 0, 0);
    const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const pixels = imageData.data;

    // Loop through every single pixel
    for (let i = 0; i < pixels.length; i += 4) {
        const isWhite = pixels[i] > 128; // Check the Red channel
        
        if (isWhite) {
            // Turn AI-detected pixels Neon Red with 50% opacity
            pixels[i] = 255;       // Red
            pixels[i + 1] = 0;     // Green
            pixels[i + 2] = 0;     // Blue
            pixels[i + 3] = 128;   // Alpha (0 is invisible, 255 is solid)
        } else {
            // Make black pixels completely invisible
            pixels[i + 3] = 0;     
        }
    }
    
    // Apply the manipulated pixels to the hidden canvas, then draw it onto the main canvas
    offCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offCanvas, 0, 0);
}

// draw OpenCV Geometry
function drawBoxes() {
    ctx.strokeStyle = '#00FF00'; // Neon green contrasts well against the red mask
    ctx.lineWidth = 4;
    
    currentCoords.forEach(box => {
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.stroke();
    });
}
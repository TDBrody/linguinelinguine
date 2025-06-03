const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const rowletImage = new Image();
rowletImage.src = 'Rowlet-Sheet.png';

const leafImage = new Image();
leafImage.src = 'Leaf-Sheet.png';

const enemyImage = new Image();
enemyImage.src = 'enemy-sheet.png';

const attackImage = new Image();
attackImage.src = 'attack-sheet.png';

const projectileImage = new Image();
projectileImage.src = 'projectile.png';

const frameSize = 100;
const scale = 2;
const drawWidth = frameSize * scale;
const drawHeight = frameSize * scale;

const rowletFrames = 10;
const leafFrames = 9;
const enemyFrames = 6;
const attackFrames = 15;
const fps = 15;
const frameDuration = 1000 / fps;

let rowletFrame = 0;
let leafFrame = 0;
let enemyFrame = 0;
let attackFrame = 0;
let lastFrameTime = 0;
let cat = 0;

let waffles = {};
let currentAngle = Math.PI * 1.5;
let targetAngle = currentAngle;

let projectileActive = false;
let projectileX = 0;
let projectileY = 0;
let projectileDx = 0;
let projectileDy = 0;

let attackPlaying = false;
let attackSpawnX = 0;
let attackSpawnY = 0;

let lastSpawnIndex = -1;

function getRandomSpawnPosition() {
  const margin = 100;
  const points = [
    {x: margin, y: margin},
    {x: canvas.width / 2, y: margin},
    {x: canvas.width - margin, y: margin},
    {x: canvas.width - margin, y: canvas.height / 2},
    {x: canvas.width - margin, y: canvas.height - margin},
    {x: canvas.width / 2, y: canvas.height - margin},
    {x: margin, y: canvas.height - margin},
    {x: margin, y: canvas.height / 2}
  ];
  let idx;
  do {
    idx = Math.floor(Math.random() * points.length);
  } while (idx === lastSpawnIndex);
  lastSpawnIndex = idx;
  return points[idx];
}

document.addEventListener('keydown', e => {
  waffles[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => waffles[e.key.toLowerCase()] = false);

function getDirectionAngle() {
  let dx = 0, dy = 0;
  if (waffles['arrowup'] || waffles['w']) dy -= 1;
  if (waffles['arrowdown'] || waffles['s']) dy += 1;
  if (waffles['arrowleft'] || waffles['a']) dx -= 1;
  if (waffles['arrowright'] || waffles['d']) dx += 1;
  if (dx === 0 && dy === 0) return null;
  return Math.atan2(dy, dx);
}

function getFramePixelData(img, frameIndex) {
  const offscreen = document.createElement('canvas');
  offscreen.width = frameSize;
  offscreen.height = frameSize;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(img, frameIndex * frameSize, 0, frameSize, frameSize, 0, 0, frameSize, frameSize);
  return offCtx.getImageData(0, 0, frameSize, frameSize);
}

function pixelPerfectCollision(projX, projY, projW, projH, projPixels, targetX, targetY, targetW, targetH, targetPixels) {
  const startX = Math.max(projX, targetX);
  const startY = Math.max(projY, targetY);
  const endX = Math.min(projX + projW, targetX + targetW);
  const endY = Math.min(projY + projH, targetY + targetH);
  if (startX >= endX || startY >= endY) return false;
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      let projPixelX = Math.floor((x - projX) * (projPixels.width / projW));
      let projPixelY = Math.floor((y - projY) * (projPixels.height / projH));
      let targetPixelX = Math.floor((x - targetX) * (targetPixels.width / targetW));
      let targetPixelY = Math.floor((y - targetY) * (targetPixels.height / targetH));
      let projIndex = (projPixelY * projPixels.width + projPixelX) * 4 + 3;
      let targetIndex = (targetPixelY * targetPixels.width + targetPixelX) * 4 + 3;
      if (projPixels.data[projIndex] > 0 && targetPixels.data[targetIndex] > 0) return true;
    }
  }
  return false;
}

function gameLoop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = timestamp - lastFrameTime;

  if (elapsed >= frameDuration) {
    rowletFrame = (rowletFrame + 1) % rowletFrames;
    leafFrame = (leafFrame + 1) % leafFrames;

    cat += 0.5;
    if (cat >= 1) {
      enemyFrame = (enemyFrame + 1) % enemyFrames;
      cat = 0;
    }

    if (attackPlaying) {
      attackFrame++;
      if (attackFrame >= attackFrames) {
        projectileX = attackSpawnX;
        projectileY = attackSpawnY;

        const centerX = Math.floor((canvas.width - drawWidth) / 2);
        const centerY = Math.floor((canvas.height - drawHeight) / 2);
        const rowletCenterX = centerX + drawWidth / 2;
        const rowletCenterY = centerY + drawHeight / 2;

        let dx = rowletCenterX - projectileX;
        let dy = rowletCenterY - projectileY;
        const dist = Math.hypot(dx, dy);
        const speed = 100.69;
        projectileDx = (dx / dist) * speed;
        projectileDy = (dy / dist) * speed;

        projectileActive = true;
        attackPlaying = false;
        attackFrame = 0;
      }
    }

    if (projectileActive) {
      projectileX += projectileDx;
      projectileY += projectileDy;

      const projPixels = getFramePixelData(projectileImage, 0);
      const centerX = Math.floor((canvas.width - drawWidth) / 2);
      const centerY = Math.floor((canvas.height - drawHeight) / 2);
      const rowletX = centerX;
      const rowletY = centerY;
      const rowletPixels = getFramePixelData(rowletImage, rowletFrame);

      const radius = drawWidth * 0.8;
      const newAngle = getDirectionAngle();
      if (newAngle !== null) targetAngle = newAngle;
      const angleDiff = ((targetAngle - currentAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      currentAngle += angleDiff * 0.2;
      const leafX = centerX + Math.cos(currentAngle) * radius + drawWidth / 2;
      const leafY = centerY + Math.sin(currentAngle) * radius + drawHeight / 2;
      const leafPixels = getFramePixelData(leafImage, leafFrame);

      if (
        pixelPerfectCollision(
          projectileX - drawWidth / 2, projectileY - drawHeight / 2,
          drawWidth, drawHeight, projPixels,
          rowletX, rowletY, drawWidth, drawHeight, rowletPixels
        )
      ) {
        projectileActive = false;
      } else if (
        pixelPerfectCollision(
          projectileX - drawWidth / 2, projectileY - drawHeight / 2,
          drawWidth, drawHeight, projPixels,
          leafX - drawWidth / 2, leafY - drawHeight / 2,
          drawWidth, drawHeight, leafPixels
        )
      ) {
        projectileActive = false;
      }

      if (
        projectileX < -drawWidth || projectileX > canvas.width + drawWidth ||
        projectileY < -drawHeight || projectileY > canvas.height + drawHeight
      ) {
        projectileActive = false;
      }
    }

    lastFrameTime = timestamp;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = Math.floor((canvas.width - drawWidth) / 2);
  const centerY = Math.floor((canvas.height - drawHeight) / 2);
  const radius = drawWidth * 0.8;

  const newAngle = getDirectionAngle();
  if (newAngle !== null) targetAngle = newAngle;
  const angleDiff = ((targetAngle - currentAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  currentAngle += angleDiff * 0.2;

  const leafX = centerX + Math.cos(currentAngle) * radius + drawWidth / 2;
  const leafY = centerY + Math.sin(currentAngle) * radius + drawHeight / 2;

  ctx.save();
  ctx.translate(leafX, leafY);
  ctx.rotate(currentAngle + Math.PI / 2);
  ctx.drawImage(
    leafImage,
    leafFrame * frameSize, 0,
    frameSize, frameSize,
    -drawWidth / 2, -drawHeight / 2,
    drawWidth, drawHeight
  );
  ctx.restore();

  ctx.drawImage(
    rowletImage,
    rowletFrame * frameSize, 0,
    frameSize, frameSize,
    centerX, centerY,
    drawWidth, drawHeight
  );

  if (attackPlaying) {
    const rowletCenterX = centerX + drawWidth / 2;
    const rowletCenterY = centerY + drawHeight / 2;
    const loadingAngle = Math.atan2(rowletCenterY - attackSpawnY, rowletCenterX - attackSpawnX) + Math.PI / 2;

    ctx.save();
    ctx.translate(attackSpawnX, attackSpawnY);
    ctx.rotate(loadingAngle);
    ctx.drawImage(
      attackImage,
      attackFrame * frameSize, 0,
      frameSize, frameSize,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();
  }

  if (projectileActive) {
    const angle = Math.atan2(projectileDy, projectileDx) + Math.PI / 2;

    ctx.save();
    ctx.translate(projectileX, projectileY);
    ctx.rotate(angle);
    ctx.drawImage(
      projectileImage,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();
  }
  
  const enemyX = centerX - 6;
  const enemyY = 10;
  ctx.drawImage(
    enemyImage,
    enemyFrame * frameSize, 0,
    frameSize, frameSize,
    enemyX, enemyY,
    drawWidth, drawHeight
  );

  requestAnimationFrame(gameLoop);
}

let loaded = 0;
function tryStart() {
  loaded++;
  if (loaded === 5) requestAnimationFrame(gameLoop);
}
rowletImage.onload = tryStart;
leafImage.onload = tryStart;
enemyImage.onload = tryStart;
attackImage.onload = tryStart;
projectileImage.onload = tryStart;

setInterval(() => {
  if (!attackPlaying && !projectileActive) {
    const pos = getRandomSpawnPosition();
    attackSpawnX = pos.x;
    attackSpawnY = pos.y;
    attackPlaying = true;
    attackFrame = 0;
  }
}, 1000);

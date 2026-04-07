let ptsTop = [];
let ptsBottom = [];
let gameState = 'START'; // START, COUNTDOWN, PLAYING, GAMEOVER, WIN
let numPoints = 10; // 增加為十個點
let startTime;
let countdownValue = 3;
let level = 1; // 新增關卡計數

function setup() {
  createCanvas(windowWidth, windowHeight); // 使用全螢幕
  initGame();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGame();
}

function initGame() {
  ptsTop = [];
  ptsBottom = [];
  let spacing = width / (numPoints - 1);

  // 通道寬度設定在 20 到 45 之間，隨關卡增加而縮小
  let minGap = max(40, 55 - level * 2);
  let maxGap = max(40, 65 - level * 2);

  for (let i = 0; i < numPoints; i++) {
    let x = i * spacing;
    let yTop = random(height * 0.2, height * 0.7);
    let gap = random(minGap, maxGap);
    ptsTop.push({ x: x, y: yTop });
    ptsBottom.push({ x: x, y: yTop + gap });
  }
}

function draw() {
  background(20, 20, 30); // 深色背景

  if (gameState === 'START') {
    drawPath();
    // 開始按鈕優化
    fill(0, 255, 150, 150);
    noStroke();
    rect(0, ptsTop[0].y, 60, ptsBottom[0].y - ptsTop[0].y, 5);
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("START", 30, ptsTop[0].y + (ptsBottom[0].y - ptsTop[0].y)/2);
    
    // 顯示當前難度
    textSize(20);
    textAlign(LEFT, TOP);
    text("Level: " + level, 20, 20);
  } else if (gameState === 'COUNTDOWN') {
    drawPath();
    let elapsed = millis() - startTime;
    let remaining = 3 - floor(elapsed / 1000);
    
    fill(0, 0, 0, 100);
    rect(0, 0, width, height);
    fill(255, 200, 0);
    textSize(80);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(remaining, width / 2, height / 2);
    if (remaining <= 0) {
      gameState = 'PLAYING';
    }
  } else if (gameState === 'PLAYING') {
    drawPath();
    drawProbe(); // 繪製滑鼠探針
    checkCollision();
    
    // 終點提示 (右側金黃色區域)
    fill(255, 215, 0, 100);
    rect(width - 20, ptsTop[numPoints-1].y, 20, ptsBottom[numPoints-1].y - ptsTop[numPoints-1].y);

    if (mouseX >= width - 5) {
      gameState = 'WIN';
    }
  } else if (gameState === 'GAMEOVER') {
    drawPath();
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    fill(255, 50, 50);
    textSize(32);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("遊戲失敗！", width / 2, height / 2);
    textSize(16);
    textStyle(NORMAL);
    text("點擊畫面重置關卡", width / 2, height / 2 + 50);
  } else if (gameState === 'WIN') {
    fill(0, 255, 150);
    textSize(32);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("恭喜通過 Level " + level + " !", width / 2, height / 2);
    textSize(16);
    textStyle(NORMAL);
    text("點擊進入下一關", width / 2, height / 2 + 50);
  }
}

function drawPath() {
  // 繪製路徑填滿感 (安全區)
  noStroke();
  fill(50, 100, 255, 30); 
  beginShape();
  // 上邊界曲線
  curveVertex(ptsTop[0].x, ptsTop[0].y);
  for (let p of ptsTop) curveVertex(p.x, p.y);
  curveVertex(ptsTop[numPoints-1].x, ptsTop[numPoints-1].y);
  // 下邊界曲線
  curveVertex(ptsBottom[numPoints-1].x, ptsBottom[numPoints-1].y);
  for (let i = ptsBottom.length - 1; i >= 0; i--) curveVertex(ptsBottom[i].x, ptsBottom[i].y);
  curveVertex(ptsBottom[0].x, ptsBottom[0].y);
  endShape(CLOSE);

  // 繪製霓虹邊界
  stroke(100, 200, 255);
  strokeWeight(2);
  noFill();
  
  // 加入發光效果
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(100, 200, 255, 0.8)';

  beginShape();
  curveVertex(ptsTop[0].x, ptsTop[0].y); // 控制點
  for (let p of ptsTop) {
    curveVertex(p.x, p.y);
  }
  curveVertex(ptsTop[numPoints-1].x, ptsTop[numPoints-1].y); // 控制點
  endShape();

  beginShape();
  curveVertex(ptsBottom[0].x, ptsBottom[0].y); // 控制點
  for (let p of ptsBottom) {
    curveVertex(p.x, p.y);
  }
  curveVertex(ptsBottom[numPoints-1].x, ptsBottom[numPoints-1].y); // 控制點
  endShape();
  
  // 重設發光，避免影響其他元件
  drawingContext.shadowBlur = 0;
}

function drawProbe() {
  fill(255, 255, 255, 200);
  noStroke();
  ellipse(mouseX, mouseY, 8, 8);
  // 探針光暈
  fill(255, 255, 255, 50);
  ellipse(mouseX, mouseY, 15, 15);
}

function checkCollision() {
  // 找出滑鼠所在的線段區間
  let i = floor(mouseX / (width / (numPoints - 1)));
  if (i >= 0 && i < numPoints - 1) {
    let x1 = ptsTop[i].x;
    let x2 = ptsTop[i+1].x;
    let t = (mouseX - x1) / (x2 - x1);

    // 取得曲線計算所需的四個點索引
    let i0 = max(0, i - 1);
    let i1 = i;
    let i2 = i + 1;
    let i3 = min(numPoints - 1, i + 2);

    // 使用 curvePoint 計算曲線上的精確 Y 座標
    let currentTopY = curvePoint(ptsTop[i0].y, ptsTop[i1].y, ptsTop[i2].y, ptsTop[i3].y, t);
    let currentBottomY = curvePoint(ptsBottom[i0].y, ptsBottom[i1].y, ptsBottom[i2].y, ptsBottom[i3].y, t);

    if (mouseY <= currentTopY || mouseY >= currentBottomY) {
      gameState = 'GAMEOVER';
    }
  } else if (mouseX < 0 || mouseX > width) {
    gameState = 'GAMEOVER';
  }
}

function mousePressed() {
  if (gameState === 'START') {
    // 檢查是否點擊最左邊的開始區域
    if (mouseX >= 0 && mouseX <= 60 && mouseY >= ptsTop[0].y && mouseY <= ptsBottom[0].y) {
      gameState = 'COUNTDOWN';
      startTime = millis();
    }
  } else if (gameState === 'GAMEOVER') {
    level = 1; // 失敗重來
    initGame();
    gameState = 'START';
  } else if (gameState === 'WIN') {
    level++; // 通關增加難度
    initGame();
    gameState = 'START';
  }
}

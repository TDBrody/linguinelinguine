const c = document.getElementById('gameCanvas'); 
const ctx = c.getContext('2d'); 
ctx.imageSmoothingEnabled = false; 
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

  let imgRowlet = new Image(); // rowlet sprite
  imgRowlet.src = 'Rowlet-Sheet.png';
  let imgLeaf = new Image(); // leaf sprite
  imgLeaf.src = 'Leaf-Sheet.png';
  let imgEnemy = new Image(); // woper sprite
  imgEnemy.src = 'enemy-sheet.png';
  let imgAttack = new Image(); 
  imgAttack.src = 'attack-sheet.png';
  let imgProjectile = new Image(); 
  imgProjectile.src = 'projectile.png';

let frameW = 100; 
let scale = 2;  //sspritesheet stuff
let widthDraw = frameW * scale; 
let heightDraw = frameW *69 scale; 

  let rowletF = 0; 
  let leafF = 0; 
  let enemyF = 0; 
  let attackF = 0; 

  let lastTime = 0; // still spritshete stuff
  let fps = 15; 
  let frameTime = 1000 / fps; 

  let projectAct = false;
  let projX = 0;
  let projY = 0; 
  let projDx = 0;
  let projDy = 0; 

  let attackPlay = false;
  let atkX = 0; 
  let atkY = 0; // spritesheet stuff

let lastSpawn = -1; 

let gameOverFlag = false; // game over or not

let waffleKeys = {}; // keys pressed
  document.addEventListener('keydown', function(e){waffleKeys[e.key.toLowerCase()] = true;});
  document.addEventListener('keyup', function(e){waffleKeys[e.key.toLowerCase()] = false;});

function resizeCan(){ 
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}
window.addEventListener('resize',resizeCan);
  resizeCan();

  function randSpawn(){ //spawning the projectil somwhere :)
    let margin = 100;
      let pts = [
        {x:margin,y:margin},
        {x:c.width/2,y:margin},
        {x:c.width-margin,y:margin},
        {x:c.width-margin,y:c.height/2},
        {x:c.width-margin,y:c.height-margin},
        {x:c.width/2,y:c.height-margin},
        {x:margin,y:c.height-margin},
        {x:margin,y:c.height/2}
      ];
  let i;
  do{
    i = Math.floor(Math.random()*pts.length);
  }while(i==lastSpawn);
  lastSpawn = i;
  return pts[i];
}

let angleCur = Math.PI*1.5; //lef angle rn
let angleTarget = angleCur; // leaf angle target to be

function getDirAngle(){ //get angel
  let dx=0; let dy=0;
    if(waffleKeys['arrowup']||waffleKeys['w'])dy-=1;
      if(waffleKeys['arrowdown']||waffleKeys['s'])dy+=1;
      if(waffleKeys['arrowleft']||waffleKeys['a'])dx-=1;
      if(waffleKeys['arrowright']||waffleKeys['d'])dx+=1;
      if(dx==0&&dy==0)return null;
      return Math.atan2(dy,dx);
    }

  function getPixData(im,fI){ //pixel 
    let off = document.createElement('canvas');
    off.width = frameW; off.height=frameW;
    let oc = off.getContext('2d');
    oc.drawImage(im,fI*frameW,0,frameW,frameW,0,0,frameW,frameW);
    return oc.getImageData(0,0,frameW,frameW);
  }

  function pixColl(px,py,pw,ph,pp,tX,tY,tW,tH,tp){ // pixel perfect collision idk
    let sX = Math.max(px,tX);
    let sY = Math.max(py,tY);
    let eX = Math.min(px+pw,tX+tW);
  let eY = Math.min(py+ph,tY+tH);
  if(sX>=eX || sY>=eY) return false;
  for(let y=sY;y<eY;y++){
    for(let x=sX;x<eX;x++){
      let pPX = Math.floor((x-px)*(pp.width/pw));
      let pPY = Math.floor((y-py)*(pp.height/ph));
      let tPX = Math.floor((x-tX)*(tp.width/tW));
      let tPY = Math.floor((y-tY)*(tp.height/tH));
      let pI = (pPY*pp.width+pPX)*4+3; // colors
      let tI = (tPY*tp.width+tPX)*4+3; 
      if(pp.data[pI]>0 && tp.data[tI]>0) return true; // idk
      }
    }
    return false;
  }

  let count = 0; 

  function loop(tStamp){ //main gam loop
    if(gameOverFlag){
      ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='red';
    ctx.font='60px Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
      ctx.fillText('You lost, Rowlet died!', c.width/2, c.height/2);
      return;
    }
    
      if(!lastTime) lastTime = tStamp;
      let elapsed = tStamp - lastTime;
      
      if(elapsed >= frameTime){
        rowletF = (rowletF+1)%10; // animate rowlet
      leafF = (leafF+1)%9; // animate leaf
      count += 0.5; 
      if(count >= 1){
        enemyF = (enemyF+1)%6; 
        count=0;
      }
      
      if(attackPlay){ // when it plays
        attackF++;
        if(attackF >= 15){ //cool animation finished now fire
          projX = atkX;
          projY = atkY;
          let cx = Math.floor((c.width - widthDraw)/2);
          let cy = Math.floor((c.height - heightDraw)/2);
          let rCx = cx + widthDraw/2;
        let rCy = cy + heightDraw/2;
        let dx = rCx - projX;
        let dy = rCy - projY;
        let dist = Math.sqrt(dx*dx+dy*dy);
        let spd = 50.69;
        projDx = (dx/dist)*spd; // set projectile speed x
        projDy = (dy/dist)*spd; // set projectile speed y
        projectAct = true; //start
        attackPlay = false; //stop
        attackF=0; //go back to 0
      }
    }
    
    if(projectAct){ 
      projX += projDx;
        projY += projDy;
        
        let projPix = getPixData(imgProjectile, 0); //pixil stuff
        let cx = Math.floor((c.width - widthDraw)/2);
        let cy = Math.floor((c.height - heightDraw)/2);
        let rX = cx;
        let rY = cy;
      let rowPix = getPixData(imgRowlet,rowletF); // rowlet pixel stuff
      let rad = widthDraw*0.8;
      let newAng = getDirAngle();
        if(newAng!==null) angleTarget=newAng;
        let diff = ((angleTarget-angleCur+Math.PI*3)%(Math.PI*2))-Math.PI;
        angleCur += diff*0.2;
        let leafX = cx + Math.cos(angleCur)*rad + widthDraw/2;
        let leafY = cy + Math.sin(angleCur)*rad + heightDraw/2;
        let leafPix = getPixData(imgLeaf,leafF);
        
        
        if(pixColl(projX-widthDraw/2, projY-heightDraw/2,widthDraw,heightDraw,projPix,rX,rY,widthDraw,heightDraw,rowPix)){
          projectAct = false; 
          gameOverFlag = true; 
        } else if(pixColl(projX-widthDraw/2,projY-heightDraw/2,widthDraw,heightDraw,projPix,leafX-widthDraw/2,leafY-heightDraw/2,widthDraw,heightDraw,leafPix)){
          projectAct = false; // weird overcomplicated math stuff for collision using pixels idk how it works
        }
        
      // stop water attack if offscreen
      if(projX < -widthDraw || projX > c.width+widthDraw || projY < -heightDraw || projY > c.height+heightDraw){
        projectAct = false;
      }
    }
    
    lastTime = tStamp;
  }
  
  ctx.clearRect(0,0,c.width,c.height); //clear screen
  
  let cx = Math.floor((c.width - widthDraw)/2);
    let cy = Math.floor((c.height - heightDraw)/2);
    let rad = widthDraw*0.8;
      
      let newAng = getDirAngle(); //lef angle
      if(newAng!==null)angleTarget=newAng;
      let diff = ((angleTarget-angleCur+Math.PI*3)%(Math.PI*2))-Math.PI;
      angleCur += diff*0.2;
      
      let leafX = cx + Math.cos(angleCur)*rad + widthDraw/2;
      let leafY = cy + Math.sin(angleCur)*rad + heightDraw/2;
    
    ctx.save(); // make leaf with angle
    ctx.translate(leafX,leafY);
    ctx.rotate(angleCur+Math.PI/2);
    ctx.drawImage(imgLeaf,leafF*frameW,0,frameW,frameW,-widthDraw/2,-heightDraw/2,widthDraw,heightDraw);
    ctx.restore();
  
  ctx.drawImage(imgRowlet,rowletF*frameW,0,frameW,frameW,cx,cy,widthDraw,heightDraw); // draw rowlet
  
    if(attackPlay){ 
      let rCx = cx + widthDraw/2;
      let rCy = cy + heightDraw/2;
      let angLoad = Math.atan2(rCy - atkY,rCx - atkX)+Math.PI/2;
      ctx.save();
      ctx.translate(atkX,atkY);
        ctx.rotate(angLoad);
        ctx.drawImage(imgAttack,attackF*frameW,0,frameW,frameW,-widthDraw/2,-heightDraw/2,widthDraw,heightDraw);
        ctx.restore();
        }
        
        if(projectAct){ 
          let ang = Math.atan2(projDy,projDx)+Math.PI/2;
        ctx.save();
        ctx.translate(projX,projY);
        ctx.rotate(ang);
        ctx.drawImage(imgProjectile,-widthDraw/2,-heightDraw/2,widthDraw,heightDraw);
        ctx.restore();
      }
      
    let eX = cx - 6;
    let eY = 10;
    ctx.drawImage(imgEnemy,enemyF*frameW,0,frameW,frameW,eX,eY,widthDraw,heightDraw);
    
    requestAnimationFrame(loop); // next frame
  }

    let imgsLoaded = 0; 
        function tryStart(){
          imgsLoaded++;
          if(imgsLoaded==5)requestAnimationFrame(loop); // start game after images loaded
        }
        imgRowlet.onload = tryStart;
        imgLeaf.onload = tryStart;
        imgEnemy.onload = tryStart;
        imgAttack.onload = tryStart;
        imgProjectile.onload = tryStart;

  setInterval(function(){ // spawn  attack every sec
      if(!attackPlay && !projectAct && !gameOverFlag){
        let pos = randSpawn();
        atkX = pos.x;
        atkY = pos.y;
        attackPlay = true;
        attackF = 0;
      }
    },1000);

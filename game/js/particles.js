// ================================================================
//  PARTICLES / FX
// ================================================================
function mkParticle(x,y,vx,vy,color,size,decay) {
    return {x,y,vx,vy,color,size,alpha:1,decay:decay||0.02};
}
function addSkid(car) {
    let speed = Math.hypot(car.vx, car.vy);
    let w = car.drifting ? 3.5 : 2;
    let intensity = Math.min(1, speed / 6);
    let lx = car.x - Math.cos(car.angle + 0.45) * 14;
    let ly = car.y - Math.sin(car.angle + 0.45) * 14;
    let rx = car.x - Math.cos(car.angle - 0.45) * 14;
    let ry = car.y - Math.sin(car.angle - 0.45) * 14;
    let bx = Math.cos(car.angle) * 4;
    let by = Math.sin(car.angle) * 4;
    skidMarks.push(
        { x1: lx, y1: ly, x2: lx - bx, y2: ly - by, w: w, alpha: 0.5 * intensity, life: 1800, maxLife: 1800 },
        { x1: rx, y1: ry, x2: rx - bx, y2: ry - by, w: w, alpha: 0.5 * intensity, life: 1800, maxLife: 1800 }
    );
}
function spawnSparks(x,y,n) {
    for (let i=0;i<n;i++) particles.push(mkParticle(x,y,(Math.random()-.5)*8,(Math.random()-.5)*8,['#ff0','#fa0','#fff','#ff4'][Math.random()*4|0],2+Math.random()*3,.05));
}
function spawnSmoke(x,y,n) {
    for (let i=0;i<n;i++) particles.push(mkParticle(x+(Math.random()-.5)*10,y+(Math.random()-.5)*10,(Math.random()-.5),(Math.random()-.5),'#666',8+Math.random()*12,.015));
}
function spawnExplosion(x,y,color) {
    for (let i=0;i<40;i++){let a=Math.random()*Math.PI*2,s=2+Math.random()*6;particles.push(mkParticle(x,y,Math.cos(a)*s,Math.sin(a)*s,['#f00','#f80','#ff0','#fff'][Math.random()*4|0],5+Math.random()*10,.02));}
    for (let i=0;i<20;i++){let a=Math.random()*Math.PI*2,s=1+Math.random()*3;particles.push(mkParticle(x,y,Math.cos(a)*s,Math.sin(a)*s,'#333',12+Math.random()*15,.01));}
    for (let i=0;i<12;i++) debris.push({x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.3,size:4+Math.random()*8,color:Math.random()<.5?color:'#444',life:80+Math.random()*80});
}
function updateFX() {
    for (let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.96;p.vy*=.96;p.alpha-=p.decay;p.size*=.99;if(p.alpha<=0)particles.splice(i,1);}
    for (let i = skidMarks.length - 1; i >= 0; i--) {
        let s = skidMarks[i];
        s.life--;
        if (s.life < s.maxLife * 0.3) {
            s.alpha *= 0.995;
        }
        if (s.life <= 0 || s.alpha < 0.01) skidMarks.splice(i, 1);
    }
    if (skidMarks.length > 5000) skidMarks.splice(0, 1000);
    for (let i=debris.length-1;i>=0;i--){let d=debris[i];d.x+=d.vx;d.y+=d.vy;d.vx*=.97;d.vy*=.97;d.angle+=d.spin;d.life--;if(d.life<=0)debris.splice(i,1);}
    for (let i=floatingTexts.length-1;i>=0;i--){let f=floatingTexts[i];f.y+=f.vy;f.life--;f.alpha=Math.min(1,f.life/25);if(f.life<=0)floatingTexts.splice(i,1);}
}

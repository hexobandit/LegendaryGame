// ================================================================
//  INTRO — Grunge/Stamped welcome screen with Speedster C car
//  Click the car to explode it and transition to the start screen.
// ================================================================

var introActive = false;
var introExploded = false;
var introNoiseCanvas = null;
var introParticles = [];
var introDebris = [];
var introExpFrame = 0;
var introCarX, introCarY;
var introFadeAlpha = 0;
var introFading = false;

function initIntro() {
    var screen = document.getElementById('intro-screen');
    var cvs = document.getElementById('intro-canvas');
    var ictx = cvs.getContext('2d');

    function resizeIntro() {
        cvs.width = window.innerWidth;
        cvs.height = window.innerHeight;
        introCarX = cvs.width / 2;
        introCarY = cvs.height * 0.66;
        generateIntroNoise(cvs.width, cvs.height);
    }
    resizeIntro();
    window.addEventListener('resize', function() {
        if (introActive) resizeIntro();
    });

    screen.style.display = 'flex';
    document.getElementById('start-screen').style.display = 'none';
    introActive = true;
    introExploded = false;
    introFading = false;
    introFadeAlpha = 0;
    introParticles = [];
    introDebris = [];
    introExpFrame = 0;

    cvs.onclick = function(e) {
        var r = cvs.getBoundingClientRect();
        var mx = (e.clientX - r.left) * (cvs.width / r.width);
        var my = (e.clientY - r.top) * (cvs.height / r.height);
        if (Math.abs(mx - introCarX) < 90 && Math.abs(my - introCarY) < 50 && !introExploded) {
            introExploded = true;
            introExpFrame = 0;
            spawnIntroExplosion(introCarX, introCarY);
        }
    };

    requestAnimationFrame(function tick() {
        if (!introActive) return;
        drawIntroFrame(cvs, ictx);
        requestAnimationFrame(tick);
    });
}

function generateIntroNoise(w, h) {
    introNoiseCanvas = document.createElement('canvas');
    introNoiseCanvas.width = w;
    introNoiseCanvas.height = h;
    var nctx = introNoiseCanvas.getContext('2d');
    var imgData = nctx.createImageData(w, h);
    for (var i = 0; i < imgData.data.length; i += 4) {
        var v = Math.random() * 30;
        imgData.data[i] = v; imgData.data[i + 1] = v; imgData.data[i + 2] = v; imgData.data[i + 3] = 40;
    }
    nctx.putImageData(imgData, 0, 0);
}

// ── Draw the Speedster Option C (Racing Livery) car ──
function drawIntroCarSpeedsterC(ctx, x, y, col, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    var cw = 40, ch = 22;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(-cw / 2 + 3, -ch / 2 + 3, cw, ch);

    // Body
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 4); ctx.fill();

    // Narrower windshield
    ctx.fillStyle = 'rgba(100,180,255,.55)';
    ctx.fillRect(cw / 2 - 14, -ch / 2 + 5, 8, ch - 10);

    // Rear dark
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(-cw / 2, -ch / 2 + 2, 8, ch - 4);

    // Diagonal racing stripe (clipped to body)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 4);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath();
    ctx.moveTo(-5, -ch / 2); ctx.lineTo(10, -ch / 2);
    ctx.lineTo(-5, ch / 2); ctx.lineTo(-20, ch / 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Headlights
    ctx.fillStyle = '#ffa';
    ctx.fillRect(cw / 2 - 3, -ch / 2 + 2, 3, 4);
    ctx.fillRect(cw / 2 - 3, ch / 2 - 6, 3, 4);

    // Tail lights
    ctx.fillStyle = '#f00';
    ctx.fillRect(-cw / 2, -ch / 2 + 2, 3, 4);
    ctx.fillRect(-cw / 2, ch / 2 - 6, 3, 4);

    // Number circle on roof
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
    ctx.fillText('7', 0.5, 2.5);

    // Wing spoiler — overlaps the tail to cover rounded corners
    ctx.fillStyle = '#222';
    ctx.fillRect(-cw / 2 - 3, -ch / 2 - 1.5, 8, ch + 3);
    // Colored endplates
    ctx.fillStyle = col;
    ctx.fillRect(-cw / 2 - 4, -ch / 2 - 3, 10, 3);
    ctx.fillRect(-cw / 2 - 4, ch / 2, 10, 3);
    // Support struts
    ctx.fillStyle = '#555';
    ctx.fillRect(-cw / 2 + 2, -ch / 2 + 2, 2, 2);
    ctx.fillRect(-cw / 2 + 2, ch / 2 - 4, 2, 2);

    // Twin exhaust glow
    ctx.fillStyle = '#f80';
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(-cw / 2 - 2, -4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-cw / 2 - 2, 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(-cw / 2 - 1, -4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-cw / 2 - 1, 4, 1.8, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}

// ── Explosion ──
function spawnIntroExplosion(cx, cy) {
    introParticles = [];
    introDebris = [];
    // Fire/spark particles
    for (var i = 0; i < 70; i++) {
        var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 9;
        introParticles.push({
            x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: ['#f00', '#f80', '#ff0', '#fff', '#fa0'][Math.random() * 5 | 0],
            size: 3 + Math.random() * 9, alpha: 1, decay: 0.01 + Math.random() * 0.02
        });
    }
    // Smoke
    for (var i = 0; i < 35; i++) {
        var a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 4;
        introParticles.push({
            x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: '#333', size: 8 + Math.random() * 14, alpha: 0.8, decay: 0.006 + Math.random() * 0.01
        });
    }
    // Metal debris
    for (var i = 0; i < 18; i++) {
        var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
        introDebris.push({
            x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.3,
            size: 4 + Math.random() * 9,
            color: Math.random() < 0.5 ? '#e03030' : '#444',
            alpha: 1
        });
    }
}

// ── Main draw ──
function drawIntroFrame(cvs, ctx) {
    var w = cvs.width, h = cvs.height;

    if (introExploded && introExpFrame > 3) {
        // After explosion, gradually fade background
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, 0, w, h);
    } else {
        ctx.clearRect(0, 0, w, h);
    }

    if (!introExploded || introExpFrame <= 3) {
        // ── Background ──
        ctx.fillStyle = '#121210';
        ctx.fillRect(0, 0, w, h);
        if (introNoiseCanvas) ctx.drawImage(introNoiseCanvas, 0, 0);

        // Scratched lines
        ctx.strokeStyle = 'rgba(255,255,255,.03)'; ctx.lineWidth = 1;
        for (var i = 0; i < 30; i++) {
            var x1 = Math.random() * w, y1 = Math.random() * h;
            ctx.beginPath(); ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + (Math.random() - 0.5) * 200, y1 + (Math.random() - 0.5) * 40);
            ctx.stroke();
        }

        // Yellow caution stripes at top and bottom
        ctx.fillStyle = '#cc9900';
        for (var x = 0; x < w; x += 40) {
            if ((x / 40 | 0) % 2 === 0) {
                ctx.fillRect(x, 0, 20, 6);
                ctx.fillRect(x, h - 6, 20, 6);
            }
        }
        ctx.fillStyle = '#111';
        for (var x = 0; x < w; x += 40) {
            if ((x / 40 | 0) % 2 !== 0) {
                ctx.fillRect(x, 0, 20, 6);
                ctx.fillRect(x, h - 6, 20, 6);
            }
        }

        // ── "LEGENDARY" — stamped/embossed ──
        var titleY = h * 0.22;
        var fontSize1 = Math.min(76, w * 0.08);
        ctx.save();
        ctx.font = 'bold ' + fontSize1 + 'px Arial'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,.8)';
        ctx.fillText('LEGENDARY', w / 2 + 3, titleY + 3);
        ctx.fillStyle = '#ccaa30';
        ctx.fillText('LEGENDARY', w / 2, titleY);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#fff';
        ctx.fillText('LEGENDARY', w / 2 - 1, titleY - 1);
        ctx.globalAlpha = 1;
        ctx.restore();

        // ── "DESTRUCTION DERBY" — red/distressed ──
        var subtitleY = titleY + fontSize1 * 0.85;
        var fontSize2 = Math.min(44, w * 0.05);
        ctx.save();
        ctx.font = 'bold ' + fontSize2 + 'px Arial'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,.7)';
        ctx.fillText('DESTRUCTION DERBY', w / 2 + 2, subtitleY + 2);
        ctx.fillStyle = '#cc3322';
        ctx.fillText('DESTRUCTION DERBY', w / 2, subtitleY);
        ctx.restore();

        // Divider — tire marks
        var divY = subtitleY + fontSize2 * 0.6;
        ctx.strokeStyle = 'rgba(40,40,40,.6)'; ctx.lineWidth = 8;
        ctx.setLineDash([15, 10]);
        ctx.beginPath(); ctx.moveTo(w / 2 - 220, divY); ctx.lineTo(w / 2 + 220, divY); ctx.stroke();
        ctx.setLineDash([]);
    }

    // ── Car or explosion ──
    if (!introExploded) {
        // Skid marks leading to car
        ctx.strokeStyle = 'rgba(30,30,30,.4)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(introCarX - 150, introCarY + 15);
        ctx.quadraticCurveTo(introCarX - 60, introCarY + 10, introCarX - 30, introCarY - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(introCarX - 140, introCarY - 15);
        ctx.quadraticCurveTo(introCarX - 50, introCarY - 10, introCarX - 25, introCarY + 5);
        ctx.stroke();

        // Draw the Speedster C car
        drawIntroCarSpeedsterC(ctx, introCarX, introCarY, '#e03030', 3.5);

        // "CLICK THE CAR TO START" pulsing text
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
        ctx.fillStyle = '#aa8830';
        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText('CLICK THE CAR TO START', w / 2, introCarY + 65);
        ctx.globalAlpha = 1;
    } else {
        introExpFrame++;

        // Draw particles
        for (var i = 0; i < introParticles.length; i++) {
            var p = introParticles[i];
            p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97;
            p.alpha -= p.decay; p.size *= 0.99;
            if (p.alpha <= 0) continue;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }

        // Draw debris
        for (var i = 0; i < introDebris.length; i++) {
            var d = introDebris[i];
            d.x += d.vx; d.y += d.vy; d.vx *= 0.96; d.vy *= 0.96;
            d.angle += d.spin; d.alpha -= 0.01;
            if (d.alpha <= 0) continue;
            ctx.globalAlpha = d.alpha;
            ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle);
            ctx.fillStyle = d.color;
            ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // Start fade to black after explosion settles
        if (introExpFrame > 80) {
            introFading = true;
        }
        if (introFading) {
            introFadeAlpha += 0.03;
            ctx.fillStyle = 'rgba(0,0,0,' + Math.min(introFadeAlpha, 1) + ')';
            ctx.fillRect(0, 0, w, h);
        }

        // Transition to start screen
        if (introFadeAlpha >= 1) {
            introActive = false;
            document.getElementById('intro-screen').style.display = 'none';
            showStartScreen();
        }
    }
}

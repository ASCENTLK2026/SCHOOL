// --- CONFIGURATION ---
const countdownDate = new Date("Feb 6, 2026 10:30:00").getTime();
const countdownEl = document.getElementById("countdown");

// --- MAIN COUNTDOWN ENGINE ---
const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
        countdownEl.innerHTML = "<div class='time-box' style='width:100%'>LAUNCH INITIATED</div>";
        return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    countdownEl.innerHTML = `
        <div class="time-box"><span class="time-val">${d}</span><span class="time-label">DAYS</span></div>
        <div class="time-box"><span class="time-val">${h}</span><span class="time-label">HRS</span></div>
        <div class="time-box"><span class="time-val">${m}</span><span class="time-label">MIN</span></div>
        <div class="time-box"><span class="time-val">${s}</span><span class="time-label">SEC</span></div>
    `;
};
setInterval(updateCountdown, 1000);
updateCountdown();

// ==========================================
// --- MANUAL POLL SYSTEM (Ethos_poll.txt) ---
// ==========================================
const qrArea = document.getElementById('qr-area');
const resultsArea = document.getElementById('results-area');

async function initPoll() {
    try {
        const response = await fetch('Ethos_poll.txt?v=' + new Date().getTime());
        if (!response.ok) throw new Error("Poll file missing");

        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // 1. Parse Data
        const dateLine = lines[lines.length - 1];
        let pollDeadline;

        if(dateLine.includes('-')) {
            const parts = dateLine.split('-');
            const dParts = parts[0].trim().split('.');
            pollDeadline = new Date(`${dParts[1].trim()}/${dParts[0].trim()}/${dParts[2].trim()} ${parts[1].trim()}:00`).getTime();
        } else {
            const dParts = dateLine.split('.');
            pollDeadline = new Date(`${dParts[1].trim()}/${dParts[0].trim()}/${dParts[2].trim()} 23:59:00`).getTime();
        }

        let options = [];
        lines.forEach(line => {
            if (line.startsWith('-')) {
                const parts = line.replace('-', '').split('=');
                options.push({
                    name: parts[0].trim(),
                    count: parseInt(parts[1].trim()) || 0
                });
            }
        });

        // 2. Render Results
        renderResults(options);

        // 3. QR Code Logic
        const now = new Date().getTime();
        if (now < pollDeadline) {
            qrArea.style.display = 'flex';
            // Points to 'vote.html' in the same directory
            const votePage = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + "/vote.html";
            document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${votePage}`;
        } else {
            qrArea.style.display = 'none';
        }

    } catch (err) {
        console.error("Poll Error:", err);
    }
}

function renderResults(options) {
    options.sort((a, b) => b.count - a.count);
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;

    const total = options.reduce((sum, item) => sum + item.count, 0);

    options.forEach((opt, index) => {
        const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
        const color = index === 0 ? '#ffd700' : 'var(--toxic)';

        html += `
            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:4px; position:relative; overflow:hidden;">
                <div style="position:absolute; top:0; left:0; height:100%; width:${percent}%; background:${color}; opacity:0.15; transition:width 1s;"></div>
                <div style="display:flex; justify-content:space-between; position:relative; z-index:2; align-items:center;">
                    <span style="color:white; font-weight:bold; font-size:0.9rem;">${opt.name}</span>
                    <span style="color:${color}; font-family:var(--font-display); font-size:1.1rem;">${opt.count}</span>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    resultsArea.innerHTML = html;
}

initPoll();
setInterval(initPoll, 30000); // Poll every 30s

// ==========================================
// --- NEWS FEED SYSTEM (Ethos.txt) ---
// ==========================================
const newsContainer = document.getElementById('news-feed');
let newsIndex = 0;
let newsData = [];
let newsInterval;

async function fetchNews() {
    try {
        const response = await fetch('Ethos.txt?v=' + new Date().getTime());
        if (!response.ok) throw new Error("News file missing");
        const text = await response.text();
        const rawPosts = text.split('/l').map(p => p.trim()).filter(p => p.length > 0);

        newsData = rawPosts.map(post => {
            let html = '';
            const lines = post.split('\n');
            let insideList = false;
            lines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine.startsWith('# ')) {
                    if (insideList) { html += '</ul>'; insideList = false; }
                    html += `<h3>${cleanLine.substring(2)}</h3>`;
                } else if (cleanLine.startsWith('- ')) {
                    if (!insideList) { html += '<ul>'; insideList = true; }
                    html += `<li>${cleanLine.substring(2)}</li>`;
                } else if (cleanLine.length > 0) {
                    if (insideList) { html += '</ul>'; insideList = false; }
                    html += `<p>${cleanLine}</p>`;
                }
            });
            if (insideList) html += '</ul>';
            return html;
        });

        if (newsData.length > 0) {
            showNews(0);
            resetTimer();
        }
    } catch (e) { console.log(e); }
}

function showNews(index) {
    if (newsData.length === 0) return;
    newsContainer.classList.add('fade-out');
    setTimeout(() => {
        if(index >= newsData.length) index = 0;
        newsContainer.innerHTML = newsData[index];
        newsContainer.classList.remove('fade-out');
    }, 500);
}

function changeSlide(dir) {
    newsIndex += dir;
    if(newsIndex >= newsData.length) newsIndex = 0;
    if(newsIndex < 0) newsIndex = newsData.length - 1;
    showNews(newsIndex);
    resetTimer();
}

function resetTimer() {
    clearInterval(newsInterval);
    newsInterval = setInterval(() => changeSlide(1), 10000);
}
fetchNews();
setInterval(fetchNews, 30000);

// Buttons
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
if(prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => changeSlide(-1));
    nextBtn.addEventListener('click', () => changeSlide(1));
}

// Fog Engine
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [];
function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();
class FogParticle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * width; this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 400 + 200; this.alpha = 0;
        this.targetAlpha = Math.random() * 0.15 + 0.05;
        this.life = 0; this.maxLife = Math.random() * 800 + 500;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.life++;
        if (this.life < 200) this.alpha = (this.life / 200) * this.targetAlpha;
        else if (this.life > this.maxLife - 200) this.alpha = ((this.maxLife - this.life) / 200) * this.targetAlpha;
        if (this.x < -this.size) this.x = width + this.size; if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size; if (this.y > height + this.size) this.y = -this.size;
        if (this.life > this.maxLife) this.reset();
    }
    draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, `rgba(0, 255, 65, ${this.alpha})`);
        g.addColorStop(0.6, `rgba(0, 100, 30, ${this.alpha * 0.5})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
}
for(let i=0; i<45; i++) particles.push(new FogParticle());
function animate() {
    ctx.clearRect(0,0,width,height); particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}
animate();
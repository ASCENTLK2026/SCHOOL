// --- CONFIGURATION ---
const countdownDate = new Date("Feb 6, 2026 10:30:00").getTime();
const countdownEl = document.getElementById("countdown");

// --- MAIN COUNTDOWN ENGINE ---
const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
        countdownEl.innerHTML = "<div class='time-box' style='grid-column: span 4'>LAUNCH INITIATED</div>";
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

// --- POLL SYSTEM ---
const qrArea = document.getElementById('qr-area');
const resultsArea = document.getElementById('results-area');

async function initPoll() {
    try {
        const response = await fetch('Ethos_poll.txt?v=' + Date.now());
        if (!response.ok) throw new Error("Poll file missing");

        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Parse Date/Deadline
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
                options.push({ name: parts[0].trim(), count: parseInt(parts[1].trim()) || 0 });
            }
        });

        renderResults(options);

        // QR Logic
        if (Date.now() < pollDeadline) {
            qrArea.style.display = 'flex';
            const votePage = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + "/vote.html";
            document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(votePage)}`;
        } else {
            qrArea.style.display = 'none';
        }
    } catch (err) { console.error("Poll Error:", err); }
}

function renderResults(options) {
    options.sort((a, b) => b.count - a.count);
    const total = options.reduce((sum, item) => sum + item.count, 0);
    let html = `<div style="display:flex; flex-direction:column; gap:6px;">`;

    options.forEach((opt, index) => {
        const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
        const color = index === 0 ? '#ffd700' : 'var(--toxic)';
        html += `
            <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
                <div style="position:absolute; top:0; left:0; height:100%; width:${percent}%; background:${color}; opacity:0.1; transition:width 1s;"></div>
                <div style="display:flex; justify-content:space-between; position:relative; z-index:2; align-items:center;">
                    <span style="color:white; font-weight:bold; font-size:0.85rem;">${opt.name}</span>
                    <span style="color:${color}; font-family:var(--font-ui); font-size:1rem; font-weight:700;">${opt.count}</span>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    resultsArea.innerHTML = html;
}
initPoll();

// --- NEWS SYSTEM ---
const newsContainer = document.getElementById('news-feed');
let newsIndex = 0;
let newsData = [];

async function fetchNews() {
    try {
        const response = await fetch('Ethos.txt?v=' + Date.now());
        if (!response.ok) throw new Error("News file missing");
        const text = await response.text();
        const rawPosts = text.split('/l').map(p => p.trim()).filter(p => p.length > 0);

        newsData = rawPosts.map(post => {
            let html = '';
            const lines = post.split('\n');
            let insideList = false;
            lines.forEach(line => {
                const cl = line.trim();
                if (cl.startsWith('# ')) {
                    if (insideList) { html += '</ul>'; insideList = false; }
                    html += `<h3>${cl.substring(2)}</h3>`;
                } else if (cl.startsWith('- ')) {
                    if (!insideList) { html += '<ul>'; insideList = true; }
                    html += `<li>${cl.substring(2)}</li>`;
                } else if (cl.length > 0) {
                    if (insideList) { html += '</ul>'; insideList = false; }
                    html += `<p>${cl}</p>`;
                }
            });
            if (insideList) html += '</ul>';
            return html;
        });

        if (newsData.length > 0) showNews(newsIndex);
    } catch (e) { console.log(e); }
}

function showNews(index) {
    if (newsData.length === 0) return;
    newsContainer.style.opacity = 0;
    setTimeout(() => {
        newsContainer.innerHTML = newsData[index];
        newsContainer.style.opacity = 1;
    }, 300);
}

document.getElementById('prevBtn').onclick = () => { newsIndex = (newsIndex - 1 + newsData.length) % newsData.length; showNews(newsIndex); };
document.getElementById('nextBtn').onclick = () => { newsIndex = (newsIndex + 1) % newsData.length; showNews(newsIndex); };

fetchNews();
setInterval(fetchNews, 60000);

// --- FOG ENGINE ---
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
window.onresize = resize; resize();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * w; this.y = Math.random() * h;
        this.v = (Math.random() - 0.5) * 0.2; this.s = Math.random() * 300 + 150;
        this.a = 0; this.ta = Math.random() * 0.12 + 0.03;
        this.l = 0; this.ml = Math.random() * 1000 + 500;
    }
    update() {
        this.x += this.v; this.l++;
        if (this.l < 200) this.a = (this.l/200)*this.ta;
        else if (this.l > this.ml-200) this.a = ((this.ml-this.l)/200)*this.ta;
        if (this.l > this.ml) this.reset();
    }
    draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.s);
        g.addColorStop(0, `rgba(0, 255, 65, ${this.a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, 7); ctx.fill();
    }
}
for(let i=0; i<30; i++) particles.push(new Particle());
function loop() { ctx.clearRect(0,0,w,h); particles.forEach(p => {p.update(); p.draw();}); requestAnimationFrame(loop); }
loop();
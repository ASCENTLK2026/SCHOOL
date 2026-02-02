// --- COUNTDOWN CONFIG ---
const countdownDate = new Date("Feb 6, 2026 10:30:00").getTime();
const countdownEl = document.getElementById("countdown");

const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = countdownDate - now;
    if (distance < 0) {
        countdownEl.innerHTML = "<div class='time-box' style='grid-column: span 4; background: rgba(0,255,65,0.2)'><span class='time-val' style='color: white'>CONTAINMENT BROKEN</span></div>";
        return;
    }
    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    countdownEl.innerHTML = `
        <div class="time-box"><span class="time-val">${d}</span><span class="time-label">DAYS</span></div>
        <div class="time-box"><span class="time-val">${h}</span><span class="time-label">HOURS</span></div>
        <div class="time-box"><span class="time-val">${m}</span><span class="time-label">MINUTES</span></div>
        <div class="time-box"><span class="time-val">${s}</span><span class="time-label">SECONDS</span></div>
    `;
};
setInterval(updateCountdown, 1000);
updateCountdown();

// --- TICKER DATA (Seamless Loop Logic) ---
async function initTicker() {
    try {
        const response = await fetch('News.txt?v=' + Date.now());
        const text = await response.text();
        const items = text.split('\n').map(i => i.trim()).filter(i => i.length > 0);
        const separator = "   <span>///</span>   ";
        const coreString = items.join(separator);
        const finalString = coreString + separator + coreString;

        const tickerEl = document.getElementById('newsTicker');
        tickerEl.innerHTML = finalString;

    } catch (e) { console.error("Ticker failed", e); }
}

// --- NEWS SYSTEM (Ethos.txt) ---
const newsContainer = document.getElementById('news-feed');
let newsData = [];
let newsIndex = 0;

async function fetchNews() {
    try {
        const response = await fetch('Ethos.txt?v=' + Date.now());
        const text = await response.text();
        const rawPosts = text.split('/l').map(p => p.trim()).filter(p => p.length > 0);

        newsData = rawPosts.map(post => {
            let html = '<div class="news-entry">';
            post.split('\n').forEach(line => {
                const cl = line.trim();
                if (cl.startsWith('# ')) {
                    html += `<h3>${cl.substring(2)}</h3>`;
                }
                else if (cl.startsWith('- ')) {
                    html += `<p class="news-bullet">• ${cl.substring(2)}</p>`;
                }
                else if (cl.length > 0) {
                    html += `<p>${cl}</p>`;
                }
            });
            html += '</div>';
            return html;
        });

        if (newsContainer.innerHTML.includes("Initializing")) {
             renderNews();
        }
    } catch (e) { console.error(e); }
}

function renderNews() {
    if (newsData.length === 0) return;
    newsContainer.innerHTML = newsData[newsIndex];
}

document.getElementById('prevBtn').onclick = () => {
    newsIndex = (newsIndex - 1 + newsData.length) % newsData.length;
    renderNews();
};
document.getElementById('nextBtn').onclick = () => {
    newsIndex = (newsIndex + 1) % newsData.length;
    renderNews();
};

// --- POLL SYSTEM (Ethos_poll.txt) ---
async function fetchPoll() {
    try {
        const response = await fetch('Ethos_poll.txt?v=' + Date.now());
        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let options = [];
        lines.forEach(line => {
            // NEW: Check for title in text file
            if (line.startsWith('#')) {
                const titleText = line.replace('#', '').trim();
                const titleEl = document.getElementById('voting-title');
                if (titleEl && titleEl.innerText !== titleText) {
                    titleEl.innerText = titleText;
                }
            }
            if (line.startsWith('-')) {
                const parts = line.replace('-', '').split('=');
                options.push({ name: parts[0].trim(), count: parseInt(parts[1].trim()) || 0 });
            }
        });

        const total = options.reduce((sum, item) => sum + item.count, 0);
        let html = '';
        options.sort((a,b) => b.count - a.count).forEach(opt => {
            const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
            html += `
                <div class="poll-bar-item">
                    <div class="poll-label"><span>${opt.name}</span><span>${opt.count}</span></div>
                    <div class="poll-track"><div class="poll-fill" style="width:${percent}%"></div></div>
                </div>
            `;
        });
        document.getElementById('results-area').innerHTML = html;
    } catch (e) { console.error(e); }
}

// Start Systems
initTicker();
fetchNews();
fetchPoll();
// Refresh data every 30 seconds
setInterval(() => { initTicker(); fetchNews(); fetchPoll(); }, 30000);

// Fog/Smoke Effect
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.onresize = resize;
class P {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * w; this.y = Math.random() * h;
        this.v = (Math.random() - 0.5) * 0.3; this.s = Math.random() * 300 + 150;
        this.a = 0; this.l = 0; this.ml = Math.random() * 500 + 500;
    }
    update() {
        this.x += this.v; this.l++;
        this.a = Math.sin((this.l / this.ml) * Math.PI) * 0.12;
        if (this.l > this.ml) this.reset();
    }
    draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.s);
        g.addColorStop(0, `rgba(0, 255, 65, ${this.a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, 7); ctx.fill();
    }
}
for(let i=0; i<30; i++) particles.push(new P());
function loop() { ctx.clearRect(0,0,w,h); particles.forEach(p => {p.update(); p.draw();}); requestAnimationFrame(loop); }
loop();
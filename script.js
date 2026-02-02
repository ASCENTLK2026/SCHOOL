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

// --- TICKER DATA (Dynamic Speed + Seamless Loop) ---
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

        // --- DYNAMIC SPEED LOGIC ---
        // Formula: Duration (s) = Width (px) / Speed (px/s)
        const totalWidth = tickerEl.scrollWidth;
        const speed = 100; // Pixels per second (Adjust for preference)
        const duration = totalWidth / speed;
        tickerEl.style.animationDuration = `${duration}s`;

    } catch (e) { console.error("Ticker failed", e); }
}

// --- UPDATED NEWS SYSTEM (Ethos.txt) ---
const newsContainer = document.getElementById('news-feed');
const newsSection = document.querySelector('.section-bottom'); // For hover detection
let newsItems = [];
let currentNewsIndex = 0;
let newsInterval;

// 1. Typewriter Effect
function typeWriter(element, text, speed = 20) {
    element.innerHTML = ""; // Clear existing
    element.classList.add('typing-cursor');

    let i = 0;
    function type() {
        if (i < text.length) {
            let char = text.charAt(i);
            // Handle newlines as HTML breaks
            if(char === '\n') {
                element.innerHTML += '<br>';
            } else {
                element.innerHTML += char;
            }
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typing-cursor');
        }
    }
    type();
}

// 2. Render Single News Item
function updateNewsDisplay() {
    if (newsItems.length === 0) return;

    const item = newsItems[currentNewsIndex];

    // Create structure with ID for typing target
    let html = `<div class="news-entry" style="animation: fadeSlideIn 0.5s ease forwards">
                    <h3>${item.title}</h3>
                    <div id="type-target" style="line-height: 1.4; color: #ddd;"></div>
                </div>`;

    newsContainer.innerHTML = html;

    // Trigger typing on body text
    const target = document.getElementById('type-target');
    typeWriter(target, item.body, 15); // Speed: 15ms per char

    // Update index
    currentNewsIndex = (currentNewsIndex + 1) % newsItems.length;
}

// 3. Fetch & Parse Data
async function fetchNews() {
    try {
        const response = await fetch('Ethos.txt?v=' + Date.now());
        const text = await response.text();
        const rawPosts = text.split('/l').map(p => p.trim()).filter(p => p.length > 0);

        // Parse into Objects { title, body }
        newsItems = rawPosts.map(post => {
            let title = "SYSTEM UPDATE";
            let bodyParts = [];

            post.split('\n').forEach(line => {
                const cl = line.trim();
                if (cl.startsWith('# ')) {
                    title = cl.substring(2);
                } else if (cl.startsWith('- ')) {
                    bodyParts.push(`• ${cl.substring(2)}`);
                } else if (cl.length > 0) {
                    bodyParts.push(cl);
                }
            });
            // Join with newlines for the typeWriter to process
            return { title: title, body: bodyParts.join('\n') };
        });

        if (newsItems.length > 0 && newsContainer.innerHTML.includes("Initializing")) {
             updateNewsDisplay();
             startNewsCycle();
        }
    } catch (e) { console.error(e); }
}

// 4. Cycle Controls (Pause on Hover)
function startNewsCycle() {
    if (newsInterval) clearInterval(newsInterval);
    newsInterval = setInterval(updateNewsDisplay, 10000);
}

function stopNewsCycle() {
    clearInterval(newsInterval);
}

// Manual Buttons
document.getElementById('prevBtn').onclick = () => {
    stopNewsCycle();
    // Logic to go back 2 steps because updateNewsDisplay increments immediately
    currentNewsIndex = (currentNewsIndex - 2 + newsItems.length) % newsItems.length;
    updateNewsDisplay();
    // Don't restart cycle immediately so user can read
};
document.getElementById('nextBtn').onclick = () => {
    stopNewsCycle();
    updateNewsDisplay(); // Index is already set to next
};

// Hover Events
if (newsSection) {
    newsSection.addEventListener('mouseenter', stopNewsCycle);
    newsSection.addEventListener('mouseleave', startNewsCycle);
}

// --- RANDOM GLITCH TRIGGER ---
const triggerStatusGlitch = () => {
    const statusText = document.querySelector('.status-text');
    if (statusText) {
        statusText.classList.add('glitch-active');
        setTimeout(() => {
            statusText.classList.remove('glitch-active');
        }, 400);
    }
    const nextGlitch = Math.random() * (30000 - 15000) + 15000;
    setTimeout(triggerStatusGlitch, nextGlitch);
};
triggerStatusGlitch();

// --- POLL SYSTEM (Ethos_poll.txt) ---
async function fetchPoll() {
    try {
        const response = await fetch('Ethos_poll.txt?v=' + Date.now());
        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let options = [];
        lines.forEach(line => {
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

// --- UPDATED FOG/SMOKE EFFECT ---
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];

const colors = [
    "0, 255, 65",   // Classic Toxic Green
    "0, 200, 150",  // Cyan/Teal
    "50, 255, 100", // Bright Green
    "200, 255, 200" // Faint White/Green mist
];

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

class P {
    constructor() { this.reset(); }

    reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.s = Math.random() * 300 + 150;
        this.a = 0;
        this.l = 0;
        this.ml = Math.random() * 500 + 500;
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.l++;
        this.a = Math.sin((this.l / this.ml) * Math.PI) * 0.15;
        if (this.l > this.ml || this.x < -this.s || this.x > w + this.s || this.y < -this.s || this.y > h + this.s) {
            this.reset();
        }
    }

    draw() {
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.s);
        g.addColorStop(0, `rgba(${this.color}, ${this.a})`);
        g.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

particles = [];
for(let i=0; i<12; i++) {
    particles.push(new P());
}

function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}
animate();
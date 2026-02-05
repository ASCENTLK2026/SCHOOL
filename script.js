// --- COUNTDOWN CONFIG ---
const countdownDate = new Date("Feb 6, 2026 10:30:00").getTime();
// Start date for the progress bar scaling (arbitrary 'start' of the campaign)
const voteStartDate = new Date("Jan 29, 2026 00:00:00").getTime();
// Default vote end date (will be overwritten by file data)
let voteEndDate = new Date("Feb 6, 2026 10:30:00").getTime();

const countdownEl = document.getElementById("countdown");
const voteProgressEl = document.getElementById("vote-progress-bar");
const voteTimeTextEl = document.getElementById("vote-time-text");

const updateCountdown = () => {
    const now = new Date().getTime();

    // Main Event Countdown
    const distance = countdownDate - now;
    if (distance < 0) {
        countdownEl.innerHTML = "<div class='time-box' style='grid-column: span 4; background: rgba(0,255,65,0.2)'><span class='time-val' style='color: white'>CONTAINMENT BROKEN</span></div>";
    } else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        countdownEl.innerHTML = `
            <div class="time-box"><span class="time-val">${d}</span><span class="time-label">DAYS</span></div>
            <div class="time-box"><span class="time-val">${h}</span><span class="time-label">HOURS</span></div>topics
            <div class="time-box"><span class="time-val">${m}</span><span class="time-label">MINUTES</span></div>
            <div class="time-box"><span class="time-val">${s}</span><span class="time-label">SECONDS</span></div>
        `;
    }

    // Voting Progress Bar Logic
    if(voteProgressEl && voteTimeTextEl) {
        const totalDuration = voteEndDate - voteStartDate;
        const timeElapsed = now - voteStartDate;
        const timeLeft = voteEndDate - now;

        // Calculate percentage (0 to 100)
        let percent = (timeElapsed / totalDuration) * 100;

        // Clamp values
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        voteProgressEl.style.width = `${percent}%`;

        if (timeLeft < 0) {
            voteTimeTextEl.innerText = "CLOSED";
            voteTimeTextEl.style.color = "#ff003c";
            voteProgressEl.style.background = "#ff003c";
        } else {
            const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if(daysLeft > 0) {
                voteTimeTextEl.innerText = `${daysLeft}d ${hoursLeft}h REMAINING`;
            } else {
                const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                voteTimeTextEl.innerText = `${hoursLeft}h ${minsLeft}m REMAINING`;
            }
        }
    }
};
setInterval(updateCountdown, 1000);
updateCountdown();

// --- TICKER DATA ---
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

        const totalWidth = tickerEl.scrollWidth;
        const speed = 100;
        const duration = totalWidth / speed;
        tickerEl.style.animationDuration = `${duration}s`;
    } catch (e) { console.error("Ticker failed", e); }
}

// --- NEWS SYSTEM WITH INDICATORS ---
const newsContainer = document.getElementById('news-feed');
const newsSection = document.querySelector('.section-bottom');
const indicatorsContainer = document.getElementById('news-indicators');
let newsItems = [];
let currentNewsIndex = 0;
let newsInterval;

function typeWriter(element, text, speed = 20) {
    element.innerHTML = "";
    element.classList.add('typing-cursor');
    let i = 0;
    function type() {
        if (i < text.length) {
            let char = text.charAt(i);
            element.innerHTML += (char === '\n') ? '<br>' : char;
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typing-cursor');
        }
    }
    type();
}

function updateIndicators() {
    if (!indicatorsContainer) return;
    const dots = indicatorsContainer.querySelectorAll('.news-indicator-box');
    dots.forEach((dot, idx) => {
        if (idx === currentNewsIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function updateNewsDisplay() {
    if (newsItems.length === 0) return;

    const item = newsItems[currentNewsIndex];
    let html = `<div class="news-entry" style="animation: fadeSlideIn 0.5s ease forwards">
                    <h3>${item.title}</h3>
                    <div id="type-target" style="line-height: 1.4; color: #ddd;"></div>
                </div>`;
    newsContainer.innerHTML = html;

    const target = document.getElementById('type-target');
    typeWriter(target, item.body, 15);

    updateIndicators();

    const totalStories = newsItems.length;
    currentNewsIndex = (currentNewsIndex + 1) % totalStories;
}

async function fetchNews() {
    try {
        const response = await fetch('Ethos.txt?v=' + Date.now());
        const text = await response.text();
        const rawPosts = text.split('/l').map(p => p.trim()).filter(p => p.length > 0);

        newsItems = rawPosts.map(post => {
            let title = "SYSTEM UPDATE";
            let bodyParts = [];
            post.split('\n').forEach(line => {
                const cl = line.trim();
                if (cl.startsWith('# ')) title = cl.substring(2);
                else if (cl.startsWith('- ')) bodyParts.push(`• ${cl.substring(2)}`);
                else if (cl.length > 0) bodyParts.push(cl);
            });
            return { title: title, body: bodyParts.join('\n') };
        });

        if (newsItems.length > 4) newsItems = newsItems.slice(0, 4);

        if (newsItems.length > 0) {
            if(indicatorsContainer) {
                let indicatorsHtml = '';
                for(let i=0; i<newsItems.length; i++) {
                    indicatorsHtml += `<div class="news-indicator-box"></div>`;
                }
                indicatorsContainer.innerHTML = indicatorsHtml;
            }
             updateNewsDisplay();
             startNewsCycle();
        }
    } catch (e) { console.error(e); }
}

function startNewsCycle() {
    if (newsInterval) clearInterval(newsInterval);
    newsInterval = setInterval(updateNewsDisplay, 10000);
}

function stopNewsCycle() { clearInterval(newsInterval); }

if (newsSection) {
    newsSection.addEventListener('mouseenter', stopNewsCycle);
    newsSection.addEventListener('mouseleave', startNewsCycle);
}

// --- SYSTEM STABILITY MONITOR ---
function initSystemMonitor() {
    const container = document.querySelector('.status-indicator');
    if (!container) return;
    const dot = container.querySelector('.status-dot');
    const textSpan = container.querySelector('.status-text');

    const checkStability = () => {
        const timeLeft = countdownDate - Date.now();
        if (timeLeft <= 0) {
            if(dot) { dot.style.background = "#ff003c"; dot.style.animation = "none"; }
            if(textSpan) { textSpan.innerText = "CONTAINMENT BROKEN // EVACUATE"; textSpan.style.color = "#ff003c"; }
            return;
        }

        const dangerLevel = Math.max(0, Math.min(1, 1 - (timeLeft / (3 * 24 * 60 * 60 * 1000))));
        if (Math.random() < (0.05 + dangerLevel * 0.9) && dangerLevel > 0.01) {
            if(dot) dot.style.background = "#ff003c";
            if(textSpan) {
                textSpan.innerText = (dangerLevel > 0.8) ? "CRITICAL ERROR // LEAK DETECTED" : "WARNING // PRESSURE RISING";
                textSpan.style.color = "#ff003c";
                textSpan.classList.add('glitch-active');
            }
            setTimeout(() => {
                if(dot) dot.style.background = "";
                if(textSpan) { textSpan.innerText = "CONTAINMENT STABLE // PROTOCOL ACTIVE"; textSpan.style.color = ""; textSpan.classList.remove('glitch-active'); }
                setTimeout(checkStability, 4000 - (dangerLevel * 3900));
            }, 100 + (dangerLevel * 1900));
        } else {
            setTimeout(checkStability, 2000 - (dangerLevel * 1500));
        }
    };
    checkStability();
}

initSystemMonitor();

// --- POLL SYSTEM ---
async function fetchPoll() {
    try {
        const response = await fetch('Ethos_poll.txt?v=' + Date.now());
        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let options = [];
        let dateFound = false;

        lines.forEach(line => {
            // Check for Date Format: "6 . 2 . 2026 - 13:15"
            // Simple regex to match D . M . YYYY
            if (line.match(/^\d{1,2}\s\.\s\d{1,2}\s\.\s\d{4}/)) {
                // Parse date
                // Format: D . M . YYYY - HH:mm
                try {
                    const parts = line.split('-');
                    const datePart = parts[0].trim(); // "6 . 2 . 2026"
                    const timePart = parts[1].trim(); // "13:15"

                    const dParts = datePart.split('.').map(s => s.trim());
                    const tParts = timePart.split(':').map(s => s.trim());

                    // Month is 0-indexed in JS Date
                    const newDate = new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1]);

                    if (!isNaN(newDate.getTime())) {
                        voteEndDate = newDate.getTime();
                    }
                } catch(e) { console.log("Date parse error", e); }
            }

            if (line.startsWith('#')) {
                const titleEl = document.getElementById('voting-title');
                if (titleEl) titleEl.innerText = line.replace('#', '').trim();
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
            html += `<div class="poll-bar-item">
                <div class="poll-label"><span>${opt.name}</span><span>${opt.count}</span></div>
                <div class="poll-track"><div class="poll-fill" style="width:${percent}%"></div></div>
            </div>`;
        });
        document.getElementById('results-area').innerHTML = html;

        // Trigger countdown update immediately to reflect new date
        updateCountdown();

    } catch (e) { console.error(e); }
}

initTicker();
fetchNews();
fetchPoll();
setInterval(() => { initTicker(); fetchNews(); fetchPoll(); }, 30000);

// --- SMOKE EFFECT ---
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let w, h, particles = [];
const colors = ["0, 255, 65", "0, 200, 150", "50, 255, 100", "200, 255, 200"];
function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
window.onresize = resize;
resize();

class P {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * w; this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5;
        this.s = Math.random() * 300 + 150; this.a = 0; this.l = 0;
        this.ml = Math.random() * 500 + 500; this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.l++;
        this.a = Math.sin((this.l / this.ml) * Math.PI) * 0.15;
        if (this.l > this.ml || this.x < -this.s || this.x > w + this.s || this.y < -this.s || this.y > h + this.s) this.reset();
    }
    draw() {
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.s);
        g.addColorStop(0, `rgba(${this.color}, ${this.a})`);
        g.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

for(let i=0; i<12; i++) particles.push(new P());
function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}
animate();

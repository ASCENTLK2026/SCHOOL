// --- CONFIGURATION ---
const countdownDate = new Date("Feb 6, 2026 10:30:00").getTime();
const countdownEl = document.getElementById("countdown");

// --- COUNTDOWN ENGINE ---
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
        <div class="time-box">
            <span class="time-val">${d}</span>
            <span class="time-label">DAYS</span>
        </div>
        <div class="time-box">
            <span class="time-val">${h}</span>
            <span class="time-label">HRS</span>
        </div>
        <div class="time-box">
            <span class="time-val">${m}</span>
            <span class="time-label">MIN</span>
        </div>
        <div class="time-box">
            <span class="time-val">${s}</span>
            <span class="time-label">SEC</span>
        </div>
    `;
};

setInterval(updateCountdown, 1000);
updateCountdown();


// --- NEWS FEED SYSTEM ---
const newsContainer = document.getElementById('news-feed');
let newsIndex = 0;
let newsData = [];
let newsInterval; // To store the auto-rotation timer

async function fetchNews() {
    try {
        const response = await fetch('Ethos.news');
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const text = await response.text();

        // Split and Parse
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
                }
                else if (cleanLine.startsWith('- ')) {
                    if (!insideList) { html += '<ul>'; insideList = true; }
                    html += `<li>${cleanLine.substring(2)}</li>`;
                }
                else if (cleanLine.length > 0) {
                    if (insideList) { html += '</ul>'; insideList = false; }
                    html += `<p>${cleanLine}</p>`;
                }
            });
            if (insideList) html += '</ul>';
            return html;
        });

        if (newsData.length > 0) {
            showNews(0); // Show first immediately
            resetTimer(); // Start auto-rotation
        } else {
            newsContainer.innerHTML = "<p>> No data found in Ethos.news</p>";
        }

    } catch (error) {
        console.error("News System Error:", error);
        newsContainer.innerHTML = `
            <div style="color: #ff3333; font-size: 0.8rem;">
                <strong>> UPLINK FAILED (CORS)</strong><br>
                Run local server: python -m http.server 8000
            </div>
        `;
    }
}

// Function to display specific index with animation
function showNews(index) {
    if (newsData.length === 0) return;

    // Fade Out
    newsContainer.classList.add('fade-out');

    setTimeout(() => {
        // Update Content
        newsContainer.innerHTML = newsData[index];
        // Fade In
        newsContainer.classList.remove('fade-out');
    }, 500);
}

// Function to handle Next/Prev logic
function changeSlide(direction) {
    if (newsData.length === 0) return;

    // Calculate new index
    newsIndex += direction;

    // Handle Wrap-around (Looping)
    if (newsIndex >= newsData.length) {
        newsIndex = 0;
    } else if (newsIndex < 0) {
        newsIndex = newsData.length - 1;
    }

    showNews(newsIndex);
    resetTimer(); // Reset the 10s timer so it doesn't skip immediately
}

// Reset the Auto-Rotation Timer
function resetTimer() {
    clearInterval(newsInterval);
    newsInterval = setInterval(() => {
        changeSlide(1); // Auto-advance
    }, 10000);
}

// Initialize
fetchNews();


// --- NAVIGATION BUTTON LISTENERS ---
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if(prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => changeSlide(-1));
    nextBtn.addEventListener('click', () => changeSlide(1));
}


// --- FOG ENGINE (UNCHANGED) ---
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class FogParticle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 400 + 200;
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.15 + 0.05;
        this.life = 0;
        this.maxLife = Math.random() * 800 + 500;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.life++;
        if (this.life < 200) this.alpha = (this.life / 200) * this.targetAlpha;
        else if (this.life > this.maxLife - 200) this.alpha = ((this.maxLife - this.life) / 200) * this.targetAlpha;
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
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
    ctx.clearRect(0,0,width,height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}
animate();
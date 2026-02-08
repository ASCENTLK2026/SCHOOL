// --- CONFIG ---
const voteStartDate = new Date("Feb 8, 2026 00:00:00").getTime();
let voteEndDate = new Date("Feb 13, 2026 10:30:00").getTime();

// --- ELEMENTS ---
const voteProgressEl = document.getElementById("vote-progress-bar");
const voteTimeTextEl = document.getElementById("vote-time-text");
const resultsArea = document.getElementById('results-area');

// --- MAIN LOOP (Timers) ---
const updateSystem = () => {
    const now = new Date().getTime();

    // VOTING TIMER LOGIC
    if(voteProgressEl && voteTimeTextEl) {
        const totalDuration = voteEndDate - voteStartDate;
        const timeElapsed = now - voteStartDate;
        const timeLeft = voteEndDate - now;

        let percent = (timeElapsed / totalDuration) * 100;
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        voteProgressEl.style.width = `${percent}%`;

        if (timeLeft < 0) {
            voteTimeTextEl.innerText = "CLOSED";
        } else {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            voteTimeTextEl.innerText = days > 0 ? `${days}d ${hours}h LEFT` : `${hours}h LEFT`;
        }
    }
};
setInterval(updateSystem, 1000);
updateSystem();

// --- POLL DATA SYSTEM (The missing part) ---
async function fetchPollData() {
    try {
        // Fetch the file with a timestamp to prevent caching
        const response = await fetch('Ethos_poll.txt?v=' + Date.now());
        const text = await response.text();

        // PARSE THE TEXT FILE
        const lines = text.split('\n');
        let question = "Current Poll";
        let options = [];
        let totalVotes = 0;

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('#')) {
                // This is the question
                question = cleanLine.substring(1).trim();
            } else if (cleanLine.startsWith('-')) {
                // This is an option: "- Yes = 10"
                const parts = cleanLine.substring(1).split('=');
                if (parts.length === 2) {
                    const label = parts[0].trim();
                    const val = parseInt(parts[1].trim()) || 0;
                    options.push({ label, val });
                    totalVotes += val;
                }
            }
        });

        // GENERATE HTML
        let html = `<div class="poll-question">${question}</div>`;

        options.forEach(opt => {
            let percentage = totalVotes === 0 ? 0 : Math.round((opt.val / totalVotes) * 100);
            html += `
                <div class="poll-option">
                    <div class="poll-header">
                        <span class="p-label">${opt.label}</span>
                        <span class="p-val">${percentage}%</span>
                    </div>
                    <div class="p-bar-track">
                        <div class="p-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });

        // Update the Title in the header if you want
        const titleEl = document.getElementById('voting-title');
        if(titleEl) titleEl.innerText = "LIVE POLL";

        if(resultsArea) resultsArea.innerHTML = html;

    } catch (e) {
        console.error("Poll Error:", e);
        if(resultsArea) resultsArea.innerHTML = `<p class="error-text">POLL DATA OFFLINE</p>`;
    }
}

// Refresh poll data every 5 seconds
fetchPollData();
setInterval(fetchPollData, 5000);


// --- NEWS SYSTEM ---
const newsContainer = document.getElementById('news-feed');
const indicatorsContainer = document.getElementById('news-indicators');
let newsItems = [];
let currentNewsIndex = 0;

function typeWriter(element, text, speed = 10) {
    if (!element) return;
    element.innerHTML = "";
    let i = 0;
    function type() {
        if (i < text.length) {
            let char = text.charAt(i);
            element.innerHTML += (char === '\n') ? '<br>' : char;
            i++;
            setTimeout(type, speed);
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
    if (newsItems.length === 0 || !newsContainer) return;
    const item = newsItems[currentNewsIndex];

    let html = `<div class="news-entry">
                    <h3>${item.title}</h3>
                    <div id="type-target"></div>
                </div>`;
    newsContainer.innerHTML = html;

    const target = document.getElementById('type-target');
    typeWriter(target, item.body, 10);
    updateIndicators();

    currentNewsIndex = (currentNewsIndex + 1) % newsItems.length;
}

async function fetchNews() {
    try {
        const response = await fetch('Ethos.txt?v=' + Date.now());
        const text = await response.text();
        const rawPosts = text.split('/l').map(p => p.trim()).filter(p => p.length > 0);

        newsItems = rawPosts.map(post => {
            let title = "UPDATE";
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
            setInterval(updateNewsDisplay, 8000);
        }
    } catch (e) { console.error("News Error", e); }
}

// --- TICKER ---
async function initTicker() {
    try {
        const response = await fetch('News.txt?v=' + Date.now());
        const text = await response.text();
        const items = text.split('\n').map(i => i.trim()).filter(i => i.length > 0);
        const separator = "   ///   ";
        const finalString = items.join(separator);

        const tickerEl = document.getElementById('newsTicker');
        if (tickerEl) tickerEl.innerText = finalString + separator + finalString;
    } catch (e) { console.log(e); }
}

// Init
fetchNews();
initTicker();
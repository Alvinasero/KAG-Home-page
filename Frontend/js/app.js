// app.js
function getApiBaseUrl() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://kag-website.onrender.com'
        : '';
}

function resolveMediaUrl(url, baseUrl = getApiBaseUrl()) {
    if (!url) return '#';
    return url.startsWith('http') ? url : `${baseUrl}${url}`;
}

async function loadSermons() {
    try {
        const baseUrl = getApiBaseUrl();

        const response = await fetch(`${baseUrl}/api/sermons?t=${Date.now()}`, { cache: 'no-store' }); // Your backend route
        const sermons = await response.json();
        
        const container = document.getElementById('sermon-list');
        if (!container) return;
        
        container.innerHTML = ''; // Clear loader

        sermons.forEach(sermon => {
            const videoPath = resolveMediaUrl(sermon.video_url, baseUrl);
            const description = sermon.description ? sermon.description.substring(0, 100) + '...' : 'No description available.';

            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card kag-card h-100 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-maridadi-navy fw-bold">${sermon.title}</h5>
                            <p class="text-muted small">By ${sermon.speaker} | ${new Date(sermon.upload_date || Date.now()).toLocaleDateString()}</p>
                            <p class="card-text">${description}</p>
                            <a href="${videoPath}" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener">Watch Now</a>
                            <a href="${videoPath}" download class="btn btn-sm btn-link text-maridadi-gold">Download</a>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading sermons:", error);
    }
}

async function loadAnnouncements() {
    const container = document.getElementById('announcementContainer');
    if (!container) return; // Exit if not on the homepage

    try {
        const baseUrl = getApiBaseUrl();

        const res = await fetch(`${baseUrl}/api/announcements?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No current announcements.</div>';
            return;
        }

        data.forEach(item => {
            container.innerHTML += `
                <div class="col-md-6 mb-3">
                    <div class="p-4 bg-white shadow-sm rounded border-start border-gold border-5 h-100">
                        <h5 class="fw-bold text-navy">${item.title}</h5>
                        <p class="text-gold small mb-2"><i class="fas fa-calendar-check me-2"></i>Scheduled: ${item.date}</p>
                        <p class="mb-0 text-secondary">${item.description}</p>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading announcements:", error);
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSermons();
    loadAnnouncements();
});

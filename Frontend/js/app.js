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
    const container = document.getElementById('sermon-list');
    if (!container) return;

    try {
        const baseUrl = window.location.origin;

        const response = await fetch(`${baseUrl}/api/sermons`);
        if (!response.ok) throw new Error('Could not load sermons. Please refresh and try again.');
        const sermons = await response.json();
        container.innerHTML = ''; // Clear loader

        const availableSermons = (Array.isArray(sermons) ? sermons : []).filter(sermon =>
            (sermon._id && sermon.video_available) || (sermon.image_available && sermon.image_url)
        );

        if (availableSermons.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No sermons with available media have been published yet.</div>';
            return;
        }

        availableSermons.forEach(sermon => {
            const videoPath = sermon._id && sermon.video_available
                ? `${baseUrl}/api/sermons/${encodeURIComponent(sermon._id)}/video`
                : '';
            const imagePath = sermon.image_available ? sermon.image_url : '';
            const posterPath = sermon.poster_available ? sermon.poster_url : '';
            const mediaMarkup = videoPath
                ? `<video class="sermon-media-video" controls preload="metadata" playsinline poster="${posterPath}" aria-label="Watch ${sermon.title || 'sermon'}"><source src="${videoPath}" type="video/mp4">Your browser does not support video playback.</video>`
                : imagePath
                    ? `<img class="sermon-media-image" src="${imagePath}" alt="${sermon.title || 'Sermon'}" loading="lazy">`
                    : '';
            const description = sermon.description ? sermon.description.substring(0, 100) + '...' : 'No description available.';
            const downloadPath = sermon._id
                ? `${baseUrl}/api/sermons/${encodeURIComponent(sermon._id)}/download`
                : videoPath;

            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card kag-card h-100 shadow-sm">
                        <div class="sermon-media">${mediaMarkup}</div>
                        <div class="card-body">
                            <h5 class="card-title text-maridadi-navy fw-bold">${sermon.title || 'Untitled Message'}</h5>
                            <p class="text-muted small">By ${sermon.speaker || 'KAG Maridadi'} | ${new Date(sermon.created_at || Date.now()).toLocaleDateString()}</p>
                            <p class="card-text">${description}</p>
                            ${videoPath ? `<a href="${videoPath}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">Open Video</a>` : '<span class="text-muted small">Sermon image</span>'}
                            ${downloadPath && sermon.media_available ? `<a href="${downloadPath}" class="btn btn-sm btn-link text-maridadi-gold">Download</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        window.addSermonVideoPreviews?.(container);
    } catch (error) {
        console.error("Error loading sermons:", error);
        container.innerHTML = '<div class="col-12 text-center text-muted">Sermons could not load right now. Please refresh to try again.</div>';
    }
}

async function loadAnnouncements() {
    const container = document.getElementById('announcementContainer');
    if (!container) return; // Exit if not on the homepage

    try {
        const baseUrl = window.location.origin;

        const res = await fetch(`${baseUrl}/api/announcements`);
        if (!res.ok) throw new Error('Announcement request failed');
        const data = await res.json();

        container.replaceChildren();
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="announcement-empty">There are no current announcements.</div>';
            return;
        }

        data.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'announcement-card';

            const date = document.createElement('time');
            date.className = 'announcement-date';
            const parsedDate = item.date ? new Date(`${item.date}T00:00:00`) : null;
            if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
                date.dateTime = item.date;
                date.textContent = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsedDate);
            } else {
                date.textContent = 'Church update';
            }

            const title = document.createElement('h3');
            title.textContent = item.title || 'Church announcement';
            const description = document.createElement('p');
            description.textContent = item.description || '';

            card.append(date, title, description);
            container.append(card);
        });
    } catch (error) {
        console.error("Error loading announcements:", error);
        container.innerHTML = '<div class="announcement-empty">Announcements could not load right now. Please refresh to try again.</div>';
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSermons();
    loadAnnouncements();
});

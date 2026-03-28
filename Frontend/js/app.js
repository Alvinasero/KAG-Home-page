// app.js
async function loadSermons() {
    try {
        const response = await fetch('/api/sermons'); // Your backend route
        const sermons = await response.json();
        
        const container = document.getElementById('sermon-list');
        container.innerHTML = ''; // Clear loader

        sermons.forEach(sermon => {
            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card kag-card h-100 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-maridadi-navy fw-bold">${sermon.title}</h5>
                            <p class="text-muted small">By ${sermon.speaker} | ${new Date(sermon.upload_date).toLocaleDateString()}</p>
                            <p class="card-text">${sermon.description.substring(0, 100)}...</p>
                            <a href="${sermon.video_url}" class="btn btn-sm btn-outline-primary">Watch Now</a>
                            <a href="${sermon.video_url}" download class="btn btn-sm btn-link text-maridadi-gold">Download</a>
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
        const res = await fetch('/api/announcements');
        const data = await res.json();
        
        container.innerHTML = '';
        data.forEach(item => {
            container.innerHTML += `
                <div class="col-md-6 mb-3">
                    <div class="p-4 bg-white shadow-sm rounded border-start border-warning border-4">
                        <h5>${item.title}</h5>
                        <p class="text-muted small">Date: ${item.date}</p>
                        <p>${item.description}</p>
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

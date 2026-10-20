// Keep the responsive site menu usable when the optional Bootstrap script is offline.
window.addSermonVideoPreviews = function (container) {
    container.querySelectorAll('.sermon-media-video[poster=""]').forEach((video) => {
        video.addEventListener('loadeddata', () => {
            if (video.poster || !video.videoWidth || !video.videoHeight) return;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                video.poster = canvas.toDataURL('image/jpeg', 0.82);
                video.pause();
                video.currentTime = 0;
            } catch (error) {
                console.warn('Could not create a sermon preview frame:', error);
            }
        }, { once: true });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.navbar-nav').forEach((nav) => {
        if (nav.querySelector('[data-find-church-link]')) return;
        const item = document.createElement('li');
        item.className = 'nav-item';
        item.innerHTML = '<a class="nav-link" data-find-church-link href="index.html#find-a-church">Find a Church</a>';
        const contact = [...nav.querySelectorAll('.nav-link')].find((link) => /contact/i.test(link.textContent));
        nav.insertBefore(item, contact ? contact.closest('.nav-item') : null);
    });

    const districtSearch = document.getElementById('districtSearch');
    const districtSelect = document.getElementById('districtSelect');
    const districtCount = document.getElementById('districtCount');
    const resetDistrictSearch = document.getElementById('resetDistrictSearch');
    if (districtSearch && districtSelect && districtCount && resetDistrictSearch) {
        const districts = [...districtSelect.options].slice(1);
        const updateDistrictOptions = () => {
            const query = districtSearch.value.trim().toLocaleLowerCase();
            let visibleCount = 0;
            districts.forEach((option) => {
                option.hidden = !option.text.toLocaleLowerCase().includes(query);
                if (!option.hidden) visibleCount += 1;
            });
            if (districtSelect.selectedOptions[0]?.hidden) districtSelect.value = '';
            districtCount.textContent = query
                ? `${visibleCount} district${visibleCount === 1 ? '' : 's'} match “${districtSearch.value.trim()}”.`
                : 'Browse KAG districts across Kenya.';
        };
        districtSearch.addEventListener('input', updateDistrictOptions);
        districtSelect.addEventListener('change', () => {
            districtCount.textContent = districtSelect.value
                ? `${districtSelect.value} selected. Contact KAG National Office to be connected with the district superintendent.`
                : 'Browse KAG districts across Kenya.';
        });
        resetDistrictSearch.addEventListener('click', () => {
            districtSearch.value = '';
            districtSelect.value = '';
            updateDistrictOptions();
            districtSearch.focus();
        });
    }

    // Keep leader cards compact and reveal the complete role description on demand.
    document.querySelectorAll('.profile-link[href^="#profile-"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const profile = document.querySelector(link.getAttribute('href'));
            if (!profile || typeof profile.showModal !== 'function') return;
            event.preventDefault();
            profile.showModal();
        });
    });
    document.querySelectorAll('.leader-dialog .dialog-close').forEach((button) => {
        button.addEventListener('click', () => button.closest('dialog').close());
    });

    // Use one shared footer layout across the public pages.
    document.querySelectorAll('footer').forEach((footer) => {
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="site-footer-main">
                <div class="site-footer-about">
                    <a class="site-footer-brand" href="index.html"><img src="/assets/kag-maridadi-logo.svg" alt=""><span>Kenya Assemblies of God<small>EST. 1972 · MARIDADI</small></span></a>
                    <p>Growing in faith, serving our community, and sharing the transforming love of Jesus Christ.</p>
                </div>
                <nav class="site-footer-column" aria-label="Organization"><h2>Organization</h2><a href="about.html">About us</a><a href="about.html#leadership">KAG Leadership</a><a href="about.html#beliefs">Our beliefs</a><a href="contact.html">Contact</a></nav>
                <nav class="site-footer-column" aria-label="Ministries"><h2>Ministries</h2><a href="departments.html">Departments</a><a href="events.html">Events &amp; gatherings</a><a href="sermons.html">Sermons &amp; education</a><a href="gallery.html">Church life</a></nav>
                <nav class="site-footer-column" aria-label="Connect"><h2>Connect</h2><a href="index.html#find-a-church">Find a KAG Church</a><a href="contact.html">Plan a visit</a><a href="contact.html?topic=giving#contactForm">Give</a><a href="blog.html">News</a><a href="contact.html">Maridadi Estate, Nairobi</a></nav>
            </div>
            <div class="site-footer-bottom"><span>© 2026 KAG Maridadi Church. All rights reserved.</span><span>Maridadi Estate, Nairobi, Kenya</span><a href="contact.html">Get in touch <span aria-hidden="true">→</span></a></div>`;
    });

    if (window.bootstrap) return;
    document.querySelectorAll('.navbar-toggler[data-bs-target]').forEach((button) => {
        const target = document.querySelector(button.getAttribute('data-bs-target'));
        if (!target) return;
        button.addEventListener('click', () => {
            const expanded = target.classList.toggle('show');
            button.setAttribute('aria-expanded', String(expanded));
        });
    });
});

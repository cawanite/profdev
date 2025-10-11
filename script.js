document.addEventListener('DOMContentLoaded', function () {
		const navToggle = document.querySelector('.nav-toggle');
		const mainNav = document.querySelector('.main-nav');
		const navLinks = document.querySelectorAll('.main-nav a');

		// Toggle nav visibility on small screens
		if (navToggle && mainNav) {
				navToggle.addEventListener('click', function () {
						const expanded = this.getAttribute('aria-expanded') === 'true';
						this.setAttribute('aria-expanded', String(!expanded));
						mainNav.classList.toggle('active');
				});
		}

		// Auto-close mobile menu when a link is clicked
		navLinks.forEach(link => {
				link.addEventListener('click', () => {
						if (window.innerWidth <= 768 && mainNav && navToggle) {
								mainNav.classList.remove('active');
								navToggle.setAttribute('aria-expanded', 'false');
						}
				});
		});

		// Mark current page link as active
		const currentPath = window.location.pathname.split('/').pop() || 'main.html';
		navLinks.forEach(link => {
				const href = link.getAttribute('href');
				if (href === currentPath || (href === 'main.html' && currentPath === '')) {
						link.classList.add('active');
				}
		});
});

// Debugging helper: toggle visible boundaries for header/nav elements
function toggleDebugBoundaries(enable) {
	const body = document.body;
	const isOn = typeof enable === 'boolean' ? enable : !body.classList.contains('debug-boundaries');
	if (isOn) body.classList.add('debug-boundaries'); else body.classList.remove('debug-boundaries');
}

// Keyboard shortcut: Ctrl+Shift+D toggles debug boundaries
document.addEventListener('keydown', function (e) {
	if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
		toggleDebugBoundaries();
	}
});

// Expose to console for quick toggling
window.toggleDebugBoundaries = toggleDebugBoundaries;

/* Utility: load project data from localStorage and populate a page */
function loadProjectData(projectKey) {
	const data = JSON.parse(localStorage.getItem(projectKey) || '{}');
	// Title
	const titleEl = document.querySelector('.project h2');
	if (titleEl && data.title) titleEl.textContent = data.title;

	// Media
	const mediaWrapper = document.querySelector('.project .project-media');
	const mediaElImg = document.querySelector('.project .project-image');
	const mediaElVideo = document.querySelector('.project .project-video');
	if (data.media && mediaWrapper) {
		// detect YouTube URL
		const ytMatch = extractYouTubeID(data.media);
		if (ytMatch) {
			// remove existing children
			mediaWrapper.innerHTML = '';
			const iframeWrap = document.createElement('div');
			iframeWrap.className = 'youtube-embed';
			iframeWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytMatch}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;min-height:360px;border-radius:8px"></iframe>`;
			mediaWrapper.appendChild(iframeWrap);
		} else {
			const isVideo = data.media.endsWith('.mp4') || data.media.endsWith('.webm') || data.media.endsWith('.ogg');
			if (isVideo && mediaElVideo) {
				mediaElVideo.src = data.media;
				mediaElVideo.style.display = 'block';
				if (mediaElImg) mediaElImg.style.display = 'none';
			} else if (mediaElImg) {
				// if mediaWrapper still contains elements, replace the img src instead of wiping other images (we may have multiple imgs)
				mediaElImg.src = data.media;
				mediaElImg.style.display = 'block';
				if (mediaElVideo) mediaElVideo.style.display = 'none';
			}
		}
	}

	// Description (HTML allowed)
	const contentEl = document.querySelector('.project-content');
	if (contentEl && data.description) {
		contentEl.querySelector('p')?.remove();
		contentEl.insertAdjacentHTML('beforeend', data.description);
	}

	// Wire up lightbox triggers
	setupLightboxTriggers();
}

/* Lightbox implementation */
function setupLightboxTriggers() {
	// create lightbox if missing
	let lightbox = document.querySelector('.lightbox');
	if (!lightbox) {
		lightbox = document.createElement('div');
		lightbox.className = 'lightbox';
		lightbox.innerHTML = `
			<div class="lightbox-content">
				<button class="lightbox-close" aria-label="Close">×</button>
				<div class="lightbox-media"></div>
			</div>
		`;
		document.body.appendChild(lightbox);
	}

	const mediaContainer = lightbox.querySelector('.lightbox-media');
	const closeBtn = lightbox.querySelector('.lightbox-close');

	// open handlers
	document.querySelectorAll('.project-image, .project-video').forEach(el => {
		el.style.cursor = 'zoom-in';
		el.addEventListener('click', () => {
			// clear
			mediaContainer.innerHTML = '';
			if (el.tagName.toLowerCase() === 'img') {
				const img = document.createElement('img');
				img.src = el.src;
				mediaContainer.appendChild(img);
			} else if (el.tagName.toLowerCase() === 'video') {
				const vid = document.createElement('video');
				vid.src = el.src;
				vid.controls = true;
				vid.autoplay = true;
				mediaContainer.appendChild(vid);
			}
			lightbox.classList.add('active');
		});
	});

	// close handlers
	closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
	lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
}

// Expose loadProjectData globally so project pages can call it inline
window.loadProjectData = loadProjectData;

// helper: extract youtube video ID from URL, supports youtu.be and youtube.com/watch?v=
function extractYouTubeID(url) {
	if (!url) return null;
	try {
		const u = new URL(url, window.location.href);
		if (u.hostname.includes('youtu.be')) {
			return u.pathname.slice(1);
		}
		if (u.hostname.includes('youtube.com')) {
			return u.searchParams.get('v');
		}
	} catch (e) {
		// fallback regex
		const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
		return m ? m[1] : null;
	}
	return null;
}

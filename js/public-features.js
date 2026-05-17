document.addEventListener('DOMContentLoaded', () => {
    // 1. Page Transitions
    document.body.classList.add('page-loaded');

    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="."], a[href^="index.html"], a[href^="user/"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Ignore target blank and hash links
            if (this.target === '_blank' || this.getAttribute('href').startsWith('#')) return;

            e.preventDefault();
            const targetUrl = this.href;

            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-exit');

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 400); // Matches CSS transition duration
        });
    });

    // 2. Custom Cursor
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });
    });

    const hoverables = document.querySelectorAll('a, button, .project-card, .filter-btn');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // 3. Parallax Scrolling
    const heroPhoto = document.querySelector('.hero-photo');
    if (heroPhoto) {
        document.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                // Move image slightly slower than scroll
                heroPhoto.style.transform = `translateY(${scrolled * 0.15}px)`;
            });
        });
    }

    // 4. Reading Progress Bar
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('reading-progress-container');
    const progressBar = document.createElement('div');
    progressBar.classList.add('reading-progress-bar');
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    document.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (height > 0) {
                const scrolled = (winScroll / height) * 100;
                progressBar.style.width = scrolled + "%";
            }
        });
    });

    // 5. Back to Top Button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.classList.add('back-to-top');
    backToTopBtn.innerHTML = '↑'; // Could be an SVG
    backToTopBtn.setAttribute('aria-label', 'Retour en haut de la page');
    document.body.appendChild(backToTopBtn);

    document.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 6. Real-time Form Validation
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                }
            });

            input.addEventListener('blur', function() {
                if (!this.checkValidity() && this.value.trim() !== '') {
                    this.classList.add('is-invalid');
                }
            });
        });

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = contactForm.querySelector('#name').value.trim();
            const email = contactForm.querySelector('#email').value.trim();
            const message = contactForm.querySelector('#message').value.trim();
            const subject = contactForm.querySelector('#subject') ? contactForm.querySelector('#subject').value.trim() : '';

            if (!name || !email || !message) {
                showPublicToast('Veuillez remplir le nom, l\'email et le message.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/public/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, subject, content: message })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Erreur lors de l\'envoi du message.');
                }

                showPublicToast(result.message || 'Message envoyé avec succès.', 'success');
                contactForm.reset();
            } catch (error) {
                console.error('Erreur envoi message contact:', error);
                showPublicToast(error.message || 'Impossible d\'envoyer le message.', 'error');
            }
        });
    }

    initPublicData();

    // 7. Project Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectFilters = document.querySelector('.project-filters');

    if (projectFilters) {
        projectFilters.addEventListener('click', (event) => {
            const btn = event.target.closest('.filter-btn');
            if (!btn) return;

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const dynamicCards = document.querySelectorAll('.project-card');

            dynamicCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 400);
                }
            });
        });
    }

    // 8. Skeleton Loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Add skeleton class to parent or self initially if not already loaded
        if (!img.complete) {
            img.parentElement.classList.add('skeleton');
            img.style.opacity = '0'; // Hide actual image temporarily
            
            img.addEventListener('load', function() {
                this.parentElement.classList.remove('skeleton');
                this.style.opacity = '1';
                this.style.transition = 'opacity 0.3s ease';
            });

            img.addEventListener('error', function() {
                this.parentElement.classList.remove('skeleton');
                // Handle error state if needed
            });
        }
    });
});

function showPublicToast(message, type = 'success') {
    let toastContainer = document.querySelector('.public-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'public-toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `public-toast public-toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);

    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3500);
}

async function initPublicData() {
    const settings = await fetchPublicSettings();

    if (document.body.classList.contains('page-home')) {
        if (settings.home_title) {
            const titleElement = document.querySelector('.hero-title');
            if (titleElement) titleElement.textContent = settings.home_title;
        }
        if (settings.home_subtitle) {
            const descriptionElement = document.querySelector('.hero-description');
            if (descriptionElement) descriptionElement.textContent = settings.home_subtitle;
        }
        if (settings.hero_image) {
            const heroImg = document.querySelector('.hero-photo');
            if (heroImg) heroImg.src = settings.hero_image;
        }
        if (settings.footer_text) {
            const footerText = document.querySelector('.site-footer .footer-content p');
            if (footerText) footerText.textContent = settings.footer_text;
        }
        await loadGallery();
    }

    if (document.body.classList.contains('page-about')) {
        if (settings.about_intro) {
            const aboutIntro = document.querySelector('.about-intro p');
            if (aboutIntro) aboutIntro.textContent = settings.about_intro;
        }
        if (settings.footer_text) {
            const footerText = document.querySelector('.site-footer .footer-content p');
            if (footerText) footerText.textContent = settings.footer_text;
        }
    }

    if (document.body.classList.contains('page-contact')) {
        const contactInfo = document.querySelector('.contact-info');
        if (contactInfo) {
            contactInfo.innerHTML = `
                <h2>Informations</h2>
                <p>Email : ${settings.contact_email || 'contact@example.com'}</p>
                <p>Téléphone : ${settings.contact_phone || '+33 6 00 00 00 00'}</p>
                <p>Localisation : ${settings.contact_address || 'Ville, Pays'}</p>
            `;
        }
        if (settings.footer_text) {
            const footerText = document.querySelector('.site-footer .footer-content p');
            if (footerText) footerText.textContent = settings.footer_text;
        }
    }

    if (document.body.classList.contains('page-projects')) {
        await loadProjects();
        if (settings.footer_text) {
            const footerText = document.querySelector('.site-footer .footer-content p');
            if (footerText) footerText.textContent = settings.footer_text;
        }
    }
}

async function fetchPublicSettings() {
    try {
        const response = await fetch('/api/public/settings');
        if (!response.ok) throw new Error('Impossible de charger les paramètres.');
        return await response.json();
    } catch (error) {
        console.error('Erreur chargement paramètres publics:', error);
        return {};
    }
}

async function loadGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    try {
        const response = await fetch('/api/public/gallery');
        if (!response.ok) throw new Error('Impossible de charger la galerie.');
        const images = await response.json();

        if (!images.length) {
            galleryGrid.innerHTML = '<p>Aucune image en galerie pour le moment.</p>';
            return;
        }

        galleryGrid.innerHTML = images.map(image => `
            <figure class="gallery-item reveal">
                <img src="${image.image_url}" alt="${escapeHtml(image.title || 'Galerie')}">
                <figcaption>${escapeHtml(image.title || '')}</figcaption>
            </figure>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement galerie publique:', error);
        galleryGrid.innerHTML = '<p>Impossible de charger la galerie.</p>';
    }
}

function normalizeCategory(technologies) {
    const techs = technologies.toLowerCase();
    if (techs.includes('design')) return 'design';
    if (techs.includes('web') || techs.includes('html') || techs.includes('css') || techs.includes('javascript')) return 'web';
    return 'all';
}

async function loadProjects() {
    const projectCardsContainer = document.getElementById('project-cards');
    if (!projectCardsContainer) return;

    try {
        const response = await fetch('/api/public/projects');
        if (!response.ok) throw new Error('Impossible de charger les projets.');
        const projects = await response.json();

        if (!projects.length) {
            projectCardsContainer.innerHTML = '<p>Aucun projet trouvé pour le moment.</p>';
            return;
        }

        projectCardsContainer.innerHTML = projects.map(project => `
            <article class="project-card reveal" data-category="${normalizeCategory(project.technologies)}">
                <header class="project-card-header">
                    <h2 class="project-title">${escapeHtml(project.title)}</h2>
                    <p class="project-status">Projet publié</p>
                </header>
                <div class="project-body">
                    <figure class="project-capture">
                        <img src="${project.image_url || 'assets/images/project-1.jpg'}" alt="${escapeHtml(project.title)}">
                        <figcaption>${escapeHtml(project.title)}</figcaption>
                    </figure>
                    <div class="project-details">
                        <p class="project-description">${escapeHtml(project.description)}</p>
                        <div class="project-info">
                            <p><strong>Technologies utilisées :</strong> ${escapeHtml(project.technologies)}</p>
                            <p><strong>GitHub :</strong> ${project.github_link ? `<a href="${project.github_link}" target="_blank" rel="noreferrer">Lien vers le dépôt</a>` : '<span>-</span>'}</p>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');

        setupProjectFiltering();
    } catch (error) {
        console.error('Erreur chargement projets publics:', error);
        projectCardsContainer.innerHTML = '<p>Impossible de charger les projets.</p>';
    }
}

function setupProjectFiltering() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');
            const cards = document.querySelectorAll('.project-card');
            cards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 400);
                }
            });
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

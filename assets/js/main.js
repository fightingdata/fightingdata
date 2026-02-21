// FightingData.com - Main JavaScript

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuButton && mobileMenu) {
        const isClickInside = menuButton.contains(event.target) || mobileMenu.contains(event.target);
        
        if (!isClickInside && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }
});

// Fighter Directory — Live Search
document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('fighter-search');
    if (!searchInput) return;

    var grid = document.getElementById('fighter-dir-grid');
    var countEl = document.getElementById('fighter-results-count');
    var allRows = grid ? Array.from(grid.querySelectorAll('.fighter-dir-row')) : [];
    var activeRows = allRows.filter(function(r) { return !r.classList.contains('inactive-fighter'); });

    // Show initial count
    if (countEl) {
        countEl.textContent = activeRows.length + ' active fighters';
    }

    searchInput.addEventListener('input', function() {
        var query = this.value.toLowerCase().trim();
        var shown = 0;

        allRows.forEach(function(row) {
            var name = (row.getAttribute('data-name') || '').toLowerCase();
            var isActive = !row.classList.contains('inactive-fighter');

            if (query) {
                // When searching, show ALL matching fighters (active + inactive)
                if (name.indexOf(query) !== -1) {
                    row.style.display = '';
                    shown++;
                } else {
                    row.style.display = 'none';
                }
            } else {
                // No search query — show only active fighters
                if (isActive) {
                    row.style.display = '';
                    shown++;
                } else {
                    row.style.display = 'none';
                }
            }
        });

        if (countEl) {
            if (query) {
                countEl.textContent = shown + ' fighter' + (shown !== 1 ? 's' : '') + ' found';
            } else {
                countEl.textContent = activeRows.length + ' active fighters';
            }
        }
    });
});

export function generateToC(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    // Check if sidebar already exists, remove it
    var existingSidebar = container.parentNode.querySelector('.doc-sidebar');
    if (existingSidebar) existingSidebar.remove();

    // Wrap the container in a layout grid if not already wrapped
    if (!container.parentNode.classList.contains('doc-layout')) {
        var wrapper = document.createElement('div');
        wrapper.className = 'doc-layout';
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
    }

    var wrapper = container.parentNode;

    // Create sidebar and nav
    var sidebar = document.createElement('aside');
    sidebar.className = 'doc-sidebar';
    var nav = document.createElement('nav');
    nav.className = 'toc-nav';
    var title = document.createElement('div');
    title.className = 'toc-title';
    title.innerHTML = '&#x1F4D1; Table of Contents';
    nav.appendChild(title);

    // Find all h2 and h3
    var headers = container.querySelectorAll('h2, h3');
    if (headers.length === 0) return;

    var ul = document.createElement('ul');
    var links = [];

    headers.forEach(function(h, i) {
        if (!h.id) {
            h.id = 'heading-' + i + '-' + h.textContent.trim().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        }
        
        var li = document.createElement('li');
        li.className = 'toc-item toc-' + h.tagName.toLowerCase();
        
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/¶/g, '').trim(); // Remove marked anchors if any
        
        a.onclick = function(e) {
            e.preventDefault();
            // Scroll to element with an offset for the fixed header
            var y = h.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            history.pushState(null, null, '#' + h.id);
        };

        li.appendChild(a);
        ul.appendChild(li);
        links.push({ el: h, link: a });
    });

    nav.appendChild(ul);
    sidebar.appendChild(nav);
    wrapper.insertBefore(sidebar, container);

    // Intersection Observer to highlight active ToC item
    var observerOptions = {
        root: null,
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0
    };

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                // Remove active class from all links
                links.forEach(function(l) { l.link.classList.remove('active'); });
                
                // Find corresponding link and add active class
                var match = links.find(function(l) { return l.el === entry.target; });
                if (match) {
                    match.link.classList.add('active');
                    // Scroll sidebar to show active link
                    var linkTop = match.link.offsetTop;
                    var navEl = match.link.closest('nav');
                    if (linkTop > navEl.scrollTop + navEl.clientHeight - 50 || linkTop < navEl.scrollTop) {
                        navEl.scrollTo({ top: linkTop - 50, behavior: 'smooth' });
                    }
                }
            }
        });
    }, observerOptions);

    headers.forEach(function(h) { observer.observe(h); });
}

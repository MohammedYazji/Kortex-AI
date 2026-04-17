//  Navbar: scrolled class 
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });


//  Hamburger menu 
const hamburger = document.getElementById('hamburger');
const navCenter = document.querySelector('.nav-center');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navCenter.classList.toggle('open');
});

// Close menu when a link is clicked
navCenter.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navCenter.classList.remove('open');
  });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target)) {
    hamburger.classList.remove('open');
    navCenter.classList.remove('open');
  }
});


// Active nav link on scroll 
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-center a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.3, rootMargin: '-68px 0px 0px 0px' });

sections.forEach(s => sectionObserver.observe(s));


// Scroll reveal animations
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // animate once
    }
  });
}, { threshold: 0.12 });

// Auto-add reveal class to major cards/sections
const revealTargets = document.querySelectorAll(
  '.why-card, .step, .class-card, .feature, .member, .focus-card'
);

revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  revealObserver.observe(el);
});


//  Smooth scroll for anchor links 
document.querySelectorAll('a[href^="#"], button[onclick*="#"]').forEach(el => {
  el.addEventListener('click', function (e) {
    const href = this.getAttribute('href') || this.getAttribute('onclick');
    const match = href && href.match(/#([\w-]+)/);
    if (!match) return;
    const target = document.getElementById(match[1]);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
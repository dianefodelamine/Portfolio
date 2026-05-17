/**
 * Logique pour l'animation au défilement (Scroll Reveal)
 */
document.addEventListener("DOMContentLoaded", () => {
  // Sélectionner tous les éléments ayant la classe 'reveal'
  const reveals = document.querySelectorAll('.reveal');

  if (!reveals.length) return;

  // Options de l'IntersectionObserver
  // rootMargin permet de déclencher l'animation un peu avant que l'élément ne soit complètement visible
  // threshold (0.15) signifie que 15% de l'élément doit être visible pour déclencher l'animation
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.15
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // Si l'élément entre dans le champ de vision
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optionnel : arrêter d'observer l'élément une fois animé pour améliorer les performances
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Assigner l'observateur à chaque élément
  reveals.forEach(reveal => {
    revealObserver.observe(reveal);
  });
});

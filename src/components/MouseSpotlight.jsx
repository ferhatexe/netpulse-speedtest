import React, { useEffect } from 'react';

export default function MouseSpotlight() {
  useEffect(() => {
    let ticking = false;

    const handleMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const root = document.documentElement;
          root.style.setProperty('--mouse-x', `${e.clientX}px`);
          root.style.setProperty('--mouse-y', `${e.clientY}px`);

          // Update relative positions for all hovered spotlight cards
          const cards = document.querySelectorAll('.bento-card, .bento-card-dark');
          cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            // Only calculate if visible in viewport
            if (
              e.clientX >= rect.left - 150 &&
              e.clientX <= rect.right + 150 &&
              e.clientY >= rect.top - 150 &&
              e.clientY <= rect.bottom + 150
            ) {
              card.style.setProperty('--card-left', `${rect.left}px`);
              card.style.setProperty('--card-top', `${rect.top}px`);
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <div className="mouse-glow-canvas" aria-hidden="true" />;
}

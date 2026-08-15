import React from 'react';
import { motion } from 'framer-motion';

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.55,
  yOffset = 32,
  className = "",
  scale = 0.98
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1], // Smooth Apple / Linear spring-like curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

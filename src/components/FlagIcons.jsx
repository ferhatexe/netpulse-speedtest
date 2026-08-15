import React from 'react';

// Crisp, vector SVG flag badges that render beautifully on ALL devices and Windows
export function FlagTR({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} rounded-sm shadow-xs border border-black/10 shrink-0 inline-block overflow-hidden`} viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#E30A17" />
      <circle cx="425" cy="400" r="200" fill="#FFFFFF" />
      <circle cx="475" cy="400" r="160" fill="#E30A17" />
      <polygon points="583,400 706,440 630,335 630,465 706,360" fill="#FFFFFF" />
    </svg>
  );
}

export function FlagGB({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} rounded-sm shadow-xs border border-black/10 shrink-0 inline-block overflow-hidden`} viewBox="0 0 60 30">
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z"/>
      </clipPath>
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
      </clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  );
}

export function FlagDE({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} rounded-sm shadow-xs border border-black/10 shrink-0 inline-block overflow-hidden`} viewBox="0 0 5 3">
      <rect width="5" height="1" y="0" fill="#000000" />
      <rect width="5" height="1" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  );
}

export function FlagES({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} rounded-sm shadow-xs border border-black/10 shrink-0 inline-block overflow-hidden`} viewBox="0 0 750 500">
      <rect width="750" height="500" fill="#AA151B" />
      <rect width="750" height="250" y="125" fill="#F1BF00" />
      <circle cx="200" cy="250" r="32" fill="#AA151B" opacity="0.85" />
    </svg>
  );
}

const badge = `rounded-sm shadow-xs border border-black/10 shrink-0 inline-block overflow-hidden`;

// Three vertical bands — France, Italy, Belgium-style tricolours
function Tricolour({ className, left, mid, right }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 3 2">
      <rect width="1" height="2" x="0" fill={left} />
      <rect width="1" height="2" x="1" fill={mid} />
      <rect width="1" height="2" x="2" fill={right} />
    </svg>
  );
}

// Three horizontal bands
function Triband({ className, top, mid, bottom }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 3 3">
      <rect width="3" height="1" y="0" fill={top} />
      <rect width="3" height="1" y="1" fill={mid} />
      <rect width="3" height="1" y="2" fill={bottom} />
    </svg>
  );
}

export function FlagFR({ className = "w-5 h-3.5" }) {
  return <Tricolour className={className} left="#002395" mid="#FFFFFF" right="#ED2939" />;
}

export function FlagIT({ className = "w-5 h-3.5" }) {
  return <Tricolour className={className} left="#008C45" mid="#F4F5F0" right="#CD212A" />;
}

export function FlagNL({ className = "w-5 h-3.5" }) {
  return <Triband className={className} top="#AE1C28" mid="#FFFFFF" bottom="#21468B" />;
}

export function FlagRU({ className = "w-5 h-3.5" }) {
  return <Triband className={className} top="#FFFFFF" mid="#0039A6" bottom="#D52B1E" />;
}

export function FlagPT({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#FF0000" />
      <rect width="240" height="400" fill="#006600" />
      <circle cx="240" cy="200" r="72" fill="#FFFF00" stroke="#FFFFFF" strokeWidth="6" />
      <circle cx="240" cy="200" r="44" fill="#FFFFFF" />
      <circle cx="240" cy="200" r="34" fill="#FF0000" />
    </svg>
  );
}

export function FlagPL({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 8 5">
      <rect width="8" height="2.5" y="0" fill="#FFFFFF" />
      <rect width="8" height="2.5" y="2.5" fill="#DC143C" />
    </svg>
  );
}

export function FlagJP({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 900 600">
      <rect width="900" height="600" fill="#FFFFFF" />
      <circle cx="450" cy="300" r="180" fill="#BC002D" />
    </svg>
  );
}

export function FlagCN({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 900 600">
      <rect width="900" height="600" fill="#DE2910" />
      <polygon points="150,80 178,166 268,166 195,219 223,305 150,252 77,305 105,219 32,166 122,166" fill="#FFDE00" />
      <circle cx="330" cy="60" r="26" fill="#FFDE00" />
      <circle cx="400" cy="130" r="26" fill="#FFDE00" />
      <circle cx="400" cy="225" r="26" fill="#FFDE00" />
      <circle cx="330" cy="295" r="26" fill="#FFDE00" />
    </svg>
  );
}

export function FlagSA({ className = "w-5 h-3.5" }) {
  return (
    <svg className={`${className} ${badge}`} viewBox="0 0 900 600">
      <rect width="900" height="600" fill="#006C35" />
      <rect x="150" y="240" width="600" height="34" rx="17" fill="#FFFFFF" />
      <rect x="200" y="330" width="500" height="26" rx="13" fill="#FFFFFF" />
      <rect x="640" y="300" width="30" height="140" rx="15" fill="#FFFFFF" />
    </svg>
  );
}

const FLAGS = {
  tr: FlagTR,
  en: FlagGB,
  de: FlagDE,
  es: FlagES,
  fr: FlagFR,
  it: FlagIT,
  pt: FlagPT,
  nl: FlagNL,
  pl: FlagPL,
  ru: FlagRU,
  ja: FlagJP,
  zh: FlagCN,
  ar: FlagSA
};

export function FlagIcon({ code, lang, className = "w-5 h-3.5" }) {
  const Flag = FLAGS[code || lang] || FlagTR;
  return <Flag className={className} />;
}

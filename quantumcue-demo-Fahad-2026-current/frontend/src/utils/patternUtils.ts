interface PatternStyles {
    background: string;
    opacity?: number;
}

const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};


const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const brandColors = [
    '#102a43',
    '#334e68',
    '#06b6d4',
    '#a855f7',
    '#3b82f6',
    '#6366f1',
    '#ec4899',
];

export const generateProviderPattern = (seedStr: string): PatternStyles => {
    const seed = simpleHash(seedStr);
    const type = seed % 3;

    const color1 = brandColors[seed % brandColors.length];
    const color2 = brandColors[(seed + 3) % brandColors.length];
    const color3 = brandColors[(seed + 5) % brandColors.length];

    const angle = (seed % 360);

    if (type === 0) {
        return {
            background: `
        radial-gradient(at 0% 0%, ${color1}25 0px, transparent 50%),
        radial-gradient(at 50% 0%, ${color2}20 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${color3}20 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${color2}15 0px, transparent 50%),
        radial-gradient(at 50% 100%, ${color1}20 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${color2}15 0px, transparent 50%)
      `,
            opacity: 0.6,
        };
    } else if (type === 1) {
        const dotSize = 10 + (seed % 20);
        return {
            background: `
        radial-gradient(${color1}15 1px, transparent 1px),
        linear-gradient(${angle}deg, ${color1}05 0%, ${color2}10 100%)
      `,
            opacity: 0.8,
        };
    } else {
        return {
            background: `linear-gradient(${angle}deg, ${color1}15 0%, ${color2}10 50%, ${color3}15 100%)`,
            opacity: 0.7,
        };
    }
};

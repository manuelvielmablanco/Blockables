import type { CSSProperties } from 'react';

export type MininPose =
  | 'idle'
  | 'programando'
  | 'cansado'
  | 'contento'
  | 'costipado'
  | 'cables'
  | 'leyendo'
  | 'manual_app';

export type MininAnimation = 'float' | 'bounce' | 'shake' | 'think' | 'none';

export interface MininProps {
  pose?: MininPose;
  size?: number;
  animation?: MininAnimation;
  withShadow?: boolean;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

const animClassMap: Record<MininAnimation, string> = {
  float:  'anim-float',
  bounce: 'anim-bounce',
  shake:  'anim-shake',
  think:  'anim-think',
  none:   '',
};

export default function Minin({
  pose = 'idle',
  size = 120,
  animation = 'none',
  withShadow = true,
  className = '',
  style,
  alt,
}: MininProps) {
  const src = `${import.meta.env.BASE_URL}characters/turquesa/${pose}.png`;
  const animCls = animClassMap[animation];
  const altText = alt ?? `Minin Turquesa ${pose}`;

  if (!withShadow) {
    return (
      <img
        src={src}
        alt={altText}
        width={size}
        height={size}
        className={`${animCls} ${className}`.trim()}
        style={{ width: size, height: size, objectFit: 'contain', ...style }}
      />
    );
  }

  return (
    <div className={`minin-with-shadow ${className}`.trim()} style={style}>
      <img
        src={src}
        alt={altText}
        width={size}
        height={size}
        className={animCls}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
      <div
        className="minin-shadow"
        style={{ width: Math.round(size * 0.62), height: Math.max(8, Math.round(size * 0.07)) }}
      />
    </div>
  );
}

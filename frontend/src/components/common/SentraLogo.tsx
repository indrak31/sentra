import React from 'react';

interface SentraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withText?: boolean;
}

/**
 * Official SENTRA Monochrome Black Brand Identity Lockup
 * Directly vectorized from the official design system specification.
 */
export const SentraLogo: React.FC<SentraLogoProps> = ({
  className = '',
  size = 'md',
  withText = true,
}) => {
  const sizeMap = {
    sm: {
      lockupClass: 'h-7 w-auto',
      iconClass: 'h-7 w-auto',
    },
    md: {
      lockupClass: 'h-10 w-auto',
      iconClass: 'h-10 w-auto',
    },
    lg: {
      lockupClass: 'h-[52px] w-auto',
      iconClass: 'h-[52px] w-auto',
    },
    xl: {
      lockupClass: 'h-[62px] w-auto',
      iconClass: 'h-[62px] w-auto',
    },
    '2xl': {
      lockupClass: 'h-[76px] w-auto',
      iconClass: 'h-[76px] w-auto',
    },
  };

  const { lockupClass, iconClass } = sizeMap[size];

  if (!withText) {
    return (
      <div className={`inline-flex items-center select-none text-[#0F172A] ${className}`}>
        <svg
          viewBox="0 0 149 163"
          fill="currentColor"
          className={`shrink-0 ${iconClass}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="SENTRA Icon"
        >
          {/* Bottom Right Arm */}
          <path d="M 73 97 L 73 128 L 82 133 L 122 160 L 126 161 L 126 131 L 89 108 L 87 106 L 87 94 L 84 96 Z" fillRule="evenodd" />
          {/* Right Square Node */}
          <path d="M 134 89 L 135 103 L 148 102 L 147 88 Z" fillRule="evenodd" />
          {/* Left Square Node */}
          <path d="M 1 69 L 1 89 L 20 89 L 19 69 Z" fillRule="evenodd" />
          {/* Left Middle Bracket */}
          <path d="M 30 50 L 30 79 L 32 81 L 45 88 L 48 91 L 44 95 L 30 104 L 30 134 L 61 115 L 62 70 L 35 52 Z" fillRule="evenodd" />
          {/* Right Chevron Arm */}
          <path d="M 126 44 L 118 48 L 113 52 L 110 53 L 105 57 L 99 60 L 97 62 L 95 68 L 91 67 L 89 68 L 92 72 L 95 73 L 97 75 L 97 96 L 115 108 L 126 114 L 126 92 L 113 84 L 111 79 L 114 78 L 122 72 L 125 71 Z" fillRule="evenodd" />
          {/* Top Left Isometric Arm */}
          <path d="M 30 0 L 30 30 L 47 42 L 50 43 L 64 53 L 70 56 L 73 59 L 73 75 L 87 74 L 87 35 L 38 3 L 35 2 L 33 0 Z" fillRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none text-[#0F172A] ${className}`}>
      {/* Official Monochrome Primary Lockup: Vectorized Icon + Geometric SENTRA Wordmark */}
      <svg
        viewBox="0 0 467 163"
        fill="currentColor"
        className={`shrink-0 ${lockupClass}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SENTRA Brand Lockup"
      >
        {/* Icon: Bottom Right Arm */}
        <path d="M 73 97 L 73 128 L 82 133 L 122 160 L 126 161 L 126 131 L 89 108 L 87 106 L 87 94 L 84 96 Z" fillRule="evenodd" />
        {/* Icon: Right Square Node */}
        <path d="M 134 89 L 135 103 L 148 102 L 147 88 Z" fillRule="evenodd" />
        {/* Icon: Left Square Node */}
        <path d="M 1 69 L 1 89 L 20 89 L 19 69 Z" fillRule="evenodd" />
        {/* Wordmark: A */}
        <path d="M 433 64 L 432 68 L 427 78 L 427 80 L 425 83 L 425 85 L 420 95 L 420 97 L 417 102 L 416 107 L 413 112 L 424 113 L 426 111 L 426 109 L 430 101 L 450 102 L 454 112 L 463 113 L 466 112 L 463 104 L 460 99 L 458 92 L 455 87 L 453 80 L 450 75 L 450 73 L 448 70 L 446 63 Z" fillRule="evenodd" />
        {/* Wordmark: A cutout */}
        <path d="M 441 77 L 442 79 L 442 81 L 444 84 L 444 86 L 446 89 L 447 92 L 433 92 L 433 90 L 434 87 L 436 84 L 436 82 L 438 79 Z" fillRule="evenodd" />
        {/* Wordmark: R */}
        <path d="M 364 63 L 364 112 L 366 113 L 374 112 L 375 94 L 390 94 L 392 95 L 396 100 L 398 112 L 400 113 L 409 112 L 407 98 L 406 96 L 400 91 L 405 88 L 408 83 L 408 72 L 407 70 L 402 65 L 395 63 Z" fillRule="evenodd" />
        {/* Wordmark: R cutout */}
        <path d="M 375 71 L 392 71 L 394 72 L 397 75 L 397 81 L 393 85 L 374 84 Z" fillRule="evenodd" />
        {/* Wordmark: T */}
        <path d="M 315 63 L 315 71 L 331 72 L 331 112 L 339 113 L 341 112 L 342 71 L 358 71 L 358 63 Z" fillRule="evenodd" />
        {/* Wordmark: N */}
        <path d="M 266 63 L 266 112 L 268 113 L 276 112 L 277 78 L 296 112 L 298 113 L 309 112 L 309 63 L 300 63 L 299 99 L 280 64 Z" fillRule="evenodd" />
        {/* Wordmark: E */}
        <path d="M 228 65 L 221 72 L 217 85 L 218 96 L 221 104 L 226 109 L 232 112 L 255 113 L 257 112 L 257 104 L 238 104 L 233 102 L 229 96 L 230 92 L 257 92 L 257 84 L 229 83 L 229 79 L 231 75 L 235 72 L 239 71 L 257 71 L 257 63 L 234 63 Z" fillRule="evenodd" />
        {/* Wordmark: S */}
        <path d="M 171 65 L 168 68 L 165 75 L 165 80 L 168 87 L 174 91 L 197 92 L 200 96 L 200 101 L 196 104 L 168 104 L 168 112 L 170 113 L 197 113 L 205 111 L 210 106 L 212 99 L 211 92 L 207 86 L 199 83 L 180 83 L 177 80 L 177 74 L 179 72 L 183 71 L 209 71 L 209 63 L 177 63 Z" fillRule="evenodd" />
        {/* Icon: Left Middle Bracket */}
        <path d="M 30 50 L 30 79 L 32 81 L 45 88 L 48 91 L 44 95 L 30 104 L 30 134 L 61 115 L 62 70 L 35 52 Z" fillRule="evenodd" />
        {/* Icon: Right Chevron Arm */}
        <path d="M 126 44 L 118 48 L 113 52 L 110 53 L 105 57 L 99 60 L 97 62 L 95 68 L 91 67 L 89 68 L 92 72 L 95 73 L 97 75 L 97 96 L 115 108 L 126 114 L 126 92 L 113 84 L 111 79 L 114 78 L 122 72 L 125 71 Z" fillRule="evenodd" />
        {/* Icon: Top Left Isometric Arm */}
        <path d="M 30 0 L 30 30 L 47 42 L 50 43 L 64 53 L 70 56 L 73 59 L 73 75 L 87 74 L 87 35 L 38 3 L 35 2 L 33 0 Z" fillRule="evenodd" />
      </svg>
    </div>
  );
};

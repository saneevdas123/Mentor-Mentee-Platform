import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/** App favicon — bold CM mark (full crest is too detailed at 16–32px). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FDF8F0',
        }}
      >
        <div
          style={{
            width: 420,
            height: 420,
            borderRadius: 96,
            background: '#FF4B3E',
            border: '28px solid #141414',
            boxShadow: '28px 28px 0 0 #141414',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 190,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            fontFamily: 'system-ui, sans-serif',
            paddingBottom: 12,
          }}
        >
          CM
        </div>
      </div>
    ),
    { ...size }
  );
}

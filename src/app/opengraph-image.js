import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const alt = `${SITE.name} — ${SITE.orgShort}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoBytes = await readFile(join(process.cwd(), 'public/cutm-logo.png'));
  const logoSrc = `data:image/png;base64,${logoBytes.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FDF8F0',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* soft dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 1px 1px, #d6d0c4 1px, transparent 0)',
            backgroundSize: '18px 18px',
            opacity: 0.55,
          }}
        />
        {/* left brand panel */}
        <div
          style={{
            width: '38%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#141414',
            borderRight: '4px solid #141414',
            padding: '48px 36px',
            gap: 20,
          }}
        >
          <img
            src={logoSrc}
            width={168}
            height={260}
            alt="Centurion University"
            style={{ objectFit: 'contain' }}
          />
          <div
            style={{
              color: '#F9CA24',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Centurion University
          </div>
        </div>

        {/* right copy */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '56px 56px 56px 52px',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#FF4B3E',
                border: '3px solid #141414',
                boxShadow: '4px 4px 0 0 #141414',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              CM
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#141414' }}>
              CUTM Mentoring
            </div>
          </div>

          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#141414',
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              maxWidth: 620,
            }}
          >
            Credits, counselling & mentoring meetings — in one place.
          </div>

          <div
            style={{
              fontSize: 22,
              color: 'rgba(20,20,20,0.62)',
              lineHeight: 1.4,
              maxWidth: 560,
            }}
          >
            CBCS tracker · Meet minutes · NAAC / NIRF / NBA reports
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 8,
            }}
          >
            {['Mentors', 'Mentees', 'HoDs', 'IQAC'].map((t) => (
              <div
                key={t}
                style={{
                  background: '#FCF6BD',
                  border: '2px solid #141414',
                  borderRadius: 999,
                  padding: '8px 16px',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#141414',
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

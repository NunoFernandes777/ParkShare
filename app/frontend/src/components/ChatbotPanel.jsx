import { useEffect, useMemo, useRef, useState } from 'react';

const BOTPRESS_SCRIPT_URL = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';

function injectBotpressScript() {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${BOTPRESS_SCRIPT_URL}"]`);

    if (existingScript) {
      if (window.botpress) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = BOTPRESS_SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Impossible de charger Botpress.'));
    document.head.appendChild(script);
  });
}

function buildContextPayload({ selectedRegion, selectedCity, summary, tariffOverview, kpis }) {
  return {
    type: 'dashboard_context',
    payload: {
      filters: {
        region: selectedRegion || 'Toutes',
        city: selectedCity || 'Toutes'
      },
      summary: {
        avgPrice: Number(summary.avgPrice.toFixed(2)),
        avgOccupancy: Number((summary.avgOccupancy * 100).toFixed(1)),
        topCity: summary.topCity,
        cheapestRegion: tariffOverview.cheapestRegion
      },
      visibleCities: kpis.slice(0, 5).map((row) => ({
        date: row.date,
        region: row.region,
        city: row.city,
        avgPrice: Number(row.avg_price.toFixed(2)),
        avgOccupancy: Number((row.avg_occupancy * 100).toFixed(1)),
        observations: row.observations
      }))
    }
  };
}

export function ChatbotPanel({
  selectedRegion,
  selectedCity,
  summary,
  tariffOverview,
  kpis
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const lastContextRef = useRef('');
  const shouldOpenRef = useRef(false);

  const botId = import.meta.env.VITE_BOTPRESS_BOT_ID;
  const clientId = import.meta.env.VITE_BOTPRESS_CLIENT_ID;

  const contextPayload = useMemo(
    () => buildContextPayload({ selectedRegion, selectedCity, summary, tariffOverview, kpis }),
    [selectedRegion, selectedCity, summary, tariffOverview, kpis]
  );

  useEffect(() => {
    let isMounted = true;

    async function setupBotpress() {
      if (!botId || !clientId) {
        if (isMounted) {
          setError('Ajoutez VITE_BOTPRESS_BOT_ID et VITE_BOTPRESS_CLIENT_ID dans app/frontend/.env.');
        }
        return;
      }

      try {
        await injectBotpressScript();

        if (!window.botpress) {
          throw new Error('Botpress est charge, mais indisponible dans la page.');
        }

        window.botpress.init({
          botId,
          clientId,
          configuration: {
            variant: 'soft',
            themeMode: 'light',
            fontFamily: 'Manrope'
          }
        });

        window.botpress.on('webchat:initialized', () => {
          if (!isMounted) return;
          setIsReady(true);

          if (shouldOpenRef.current) {
            setTimeout(() => {
              window.botpress.open();
            }, 500);
          }
        });
      } catch (setupError) {
        if (isMounted) {
          setError(setupError.message || 'Botpress n a pas pu etre initialise.');
        }
      }
    }

    setupBotpress();

    return () => {
      isMounted = false;
    };
  }, [botId, clientId]);

  useEffect(() => {
    if (!window.botpress) return;

    shouldOpenRef.current = isOpen;
    if (!isReady) return;

    if (isOpen) {
      setTimeout(() => {
        window.botpress.open();
      }, 150);
    } else {
      window.botpress.close();
    }
  }, [isOpen, isReady]);

  useEffect(() => {
    if (!isReady || !isOpen || !window.botpress) return;
    const serializedPayload = JSON.stringify(contextPayload);
    if (lastContextRef.current === serializedPayload) return;

    // Le contexte est envoye en evenement invisible plutot
    // qu en message affiche dans la conversation.
    window.botpress.sendEvent(contextPayload);
    lastContextRef.current = serializedPayload;
  }, [contextPayload, isOpen, isReady]);

  return (
    <div className="chatbot-widget">
      {error ? <div className="chatbot-hint">{error}</div> : null}

      <button
        type="button"
        className="chatbot-trigger"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        disabled={!botId || !clientId}
      >
        Chat
      </button>
    </div>
  );
}

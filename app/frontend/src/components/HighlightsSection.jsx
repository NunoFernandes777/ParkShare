export function HighlightsSection({ highlights }) {
  if (!highlights.length) {
    return null;
  }

  return (
    <section className="surface-card highlights-section">

      <div className="highlights-grid highlights-grid--hero">
        {highlights.map((item) => (
          <article key={item.id} className="highlight-card">
            <span className="highlight-card__label">{item.label}</span>
            <h4>{item.city}</h4>
            <strong>{item.value}</strong>
            <p className="highlight-card__meta">{item.meta}</p>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

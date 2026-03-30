export function FiltersPanel({
  regions,
  cities,
  selectedRegion,
  selectedCity,
  dateRange,
  onRegionChange,
  onCityChange,
  onDateRangeChange
}) {
  return (
    <aside className="control-panel" id="filters">
      <div className="section-heading">
        <p className="eyebrow">Filtres</p>
        <h3>Affiner la vue</h3>
      </div>

      <label htmlFor="region">Region</label>
      <select id="region" value={selectedRegion} onChange={(event) => onRegionChange(event.target.value)}>
        <option value="">Toutes</option>
        {regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>

      <label htmlFor="city">Ville</label>
      <select id="city" value={selectedCity} onChange={(event) => onCityChange(event.target.value)}>
        <option value="">Toutes</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <label htmlFor="start-date">Date debut</label>
      <input
        id="start-date"
        type="date"
        value={dateRange[0]}
        onChange={(event) => onDateRangeChange([event.target.value, dateRange[1]])}
      />

      <label htmlFor="end-date">Date fin</label>
      <input
        id="end-date"
        type="date"
        value={dateRange[1]}
        onChange={(event) => onDateRangeChange([dateRange[0], event.target.value])}
      />

      <div className="control-panel__summary">
        <div>
          <span>Region active</span>
          <strong>{selectedRegion || 'Toutes'}</strong>
        </div>
        <div>
          <span>Ville active</span>
          <strong>{selectedCity || 'Toutes'}</strong>
        </div>
      </div>
    </aside>
  );
}

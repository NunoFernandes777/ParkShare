import { useEffect, useMemo, useState } from 'react';

function findMatchingOption(options, value) {
  const normalizedValue = value.trim().toLocaleLowerCase();

  if (!normalizedValue) {
    return '';
  }

  return options.find((option) => option.toLocaleLowerCase() === normalizedValue) || '';
}

function filterOptions(options, value) {
  const normalizedValue = value.trim().toLocaleLowerCase();

  if (!normalizedValue) {
    return options.slice(0, 8);
  }

  return options
    .filter((option) => option.toLocaleLowerCase().includes(normalizedValue))
    .slice(0, 8);
}

export function FiltersPanel({
  regions,
  cities,
  selectedRegion,
  selectedCity,
  onRegionChange,
  onCityChange
}) {
  const [regionQuery, setRegionQuery] = useState(selectedRegion);
  const [cityQuery, setCityQuery] = useState(selectedCity);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);

  useEffect(() => {
    setRegionQuery(selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    setCityQuery(selectedCity);
  }, [selectedCity]);

  const filteredRegions = useMemo(() => filterOptions(regions, regionQuery), [regions, regionQuery]);
  const filteredCities = useMemo(() => filterOptions(cities, cityQuery), [cities, cityQuery]);

  const handleRegionInputChange = (value) => {
    setRegionQuery(value);
    setIsRegionMenuOpen(true);

    if (!value.trim()) {
      onRegionChange('');
      return;
    }

    const matchedRegion = findMatchingOption(regions, value);

    if (matchedRegion) {
      onRegionChange(matchedRegion);
    }
  };

  const handleCityInputChange = (value) => {
    setCityQuery(value);
    setIsCityMenuOpen(true);

    if (!value.trim()) {
      onCityChange('');
      return;
    }

    const matchedCity = findMatchingOption(cities, value);

    if (matchedCity) {
      onCityChange(matchedCity);
    }
  };

  const handleRegionBlur = () => {
    const matchedRegion = findMatchingOption(regions, regionQuery);
    setRegionQuery(matchedRegion || selectedRegion);
    setTimeout(() => setIsRegionMenuOpen(false), 120);
  };

  const handleCityBlur = () => {
    const matchedCity = findMatchingOption(cities, cityQuery);
    setCityQuery(matchedCity || selectedCity);
    setTimeout(() => setIsCityMenuOpen(false), 120);
  };

  const handleRegionSelect = (region) => {
    setRegionQuery(region);
    setIsRegionMenuOpen(false);
    onRegionChange(region);
  };

  const handleCitySelect = (city) => {
    setCityQuery(city);
    setIsCityMenuOpen(false);
    onCityChange(city);
  };

  return (
    <aside className="control-panel" id="filters">
      <div className="section-heading">
        <p className="eyebrow">Filtres</p>
        <h3>Affiner la vue</h3>
      </div>

      <label htmlFor="region">Departement</label>
      <div className="filter-combobox">
        <input
          id="region"
          type="text"
          value={regionQuery}
          onChange={(event) => handleRegionInputChange(event.target.value)}
          onFocus={() => setIsRegionMenuOpen(true)}
          onBlur={handleRegionBlur}
          placeholder="Toutes"
          autoComplete="off"
        />
        {isRegionMenuOpen && filteredRegions.length > 0 ? (
          <div className="filter-combobox__menu" role="listbox" aria-label="Suggestions departements">
            {filteredRegions.map((region) => (
              <button
                key={region}
                type="button"
                className="filter-combobox__option"
                onMouseDown={() => handleRegionSelect(region)}
              >
                {region}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <label htmlFor="city">Ville</label>
      <div className="filter-combobox">
        <input
          id="city"
          type="text"
          value={cityQuery}
          onChange={(event) => handleCityInputChange(event.target.value)}
          onFocus={() => setIsCityMenuOpen(true)}
          onBlur={handleCityBlur}
          placeholder="Toutes"
          autoComplete="off"
        />
        {isCityMenuOpen && filteredCities.length > 0 ? (
          <div className="filter-combobox__menu" role="listbox" aria-label="Suggestions villes">
            {filteredCities.map((city) => (
              <button
                key={city}
                type="button"
                className="filter-combobox__option"
                onMouseDown={() => handleCitySelect(city)}
              >
                {city}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="control-panel__summary">
        <div>
          <span>Departement actif</span>
          <strong>{selectedRegion || 'Tous'}</strong>
        </div>
        <div>
          <span>Ville active</span>
          <strong>{selectedCity || 'Toutes'}</strong>
        </div>
      </div>
    </aside>
  );
}

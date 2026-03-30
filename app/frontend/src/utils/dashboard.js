export const DEFAULT_DATE_RANGE = ['2025-01-01', '2025-12-31'];
export const DEFAULT_MAP_CENTER = [46.5, 2.5];

export const formatDate = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);
export const formatCurrency = (value) => `${Number(value).toFixed(2)} EUR`;

export const getRegionsFromKpis = (rows) => [...new Set(rows.map((row) => row.region))].sort();

export const getCitiesForRegion = (rows, region) => {
  const filteredRows = region ? rows.filter((row) => row.region === region) : rows;
  return [...new Set(filteredRows.map((row) => row.city))].sort();
};

export const filterBySelection = (rows, region, city, dateRange) =>
  rows.filter((row) => {
    if (region && row.region !== region) return false;
    if (city && row.city !== city) return false;
    if (dateRange[0] && row.date < dateRange[0]) return false;
    if (dateRange[1] && row.date > dateRange[1]) return false;
    return true;
  });

export const getPriceBand = (price) => {
  if (price < 3.5) return 'Economique';
  if (price < 5.5) return 'Intermediaire';
  return 'Premium';
};

export const getPriceBandClassName = (price) => {
  if (price < 3.5) return 'tariff-chip tariff-chip--low';
  if (price < 5.5) return 'tariff-chip tariff-chip--mid';
  return 'tariff-chip tariff-chip--high';
};

export const groupKpisByRegion = (kpis) =>
  kpis.reduce((grouping, row) => {
    grouping[row.region] = grouping[row.region] || [];
    grouping[row.region].push(row);
    return grouping;
  }, {});

export const buildSummary = (kpis) => {
  if (!kpis.length) {
    return {
      avgPrice: 0,
      avgOccupancy: 0,
      topCity: '-'
    };
  }

  const totals = kpis.reduce(
    (accumulator, row) => {
      accumulator.price += row.avg_price;
      accumulator.occupancy += row.avg_occupancy;
      accumulator.cityObservations[row.city] = (accumulator.cityObservations[row.city] || 0) + row.observations;
      return accumulator;
    },
    { price: 0, occupancy: 0, cityObservations: {} }
  );

  const topCity = Object.entries(totals.cityObservations).sort((left, right) => right[1] - left[1])[0]?.[0];

  return {
    avgPrice: totals.price / kpis.length,
    avgOccupancy: totals.occupancy / kpis.length,
    topCity: topCity || '-'
  };
};

export const buildChartPriceData = (kpisByRegion) =>
  Object.entries(kpisByRegion).map(([region, rows]) => ({
    region,
    avg_price: rows.reduce((sum, row) => sum + row.avg_price, 0) / rows.length
  }));

export const buildTariffOverview = (kpis, kpisByRegion) => {
  if (!kpis.length) {
    return {
      average: 0,
      min: 0,
      max: 0,
      spread: 0,
      cheapestRegion: '-'
    };
  }

  const prices = kpis.map((row) => row.avg_price);
  const regionAverages = Object.entries(kpisByRegion).map(([region, rows]) => ({
    region,
    average: rows.reduce((sum, row) => sum + row.avg_price, 0) / rows.length
  }));

  const cheapestRegion = [...regionAverages].sort((left, right) => left.average - right.average)[0];

  return {
    average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
    spread: Math.max(...prices) - Math.min(...prices),
    cheapestRegion: cheapestRegion?.region || '-'
  };
};

export const buildTariffDetails = (kpisByRegion) =>
  Object.entries(kpisByRegion)
    .map(([region, rows]) => {
      const prices = rows.map((row) => row.avg_price);
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const occupancy = rows.reduce((sum, row) => sum + row.avg_occupancy, 0) / rows.length;
      const topCity = [...rows].sort((left, right) => right.observations - left.observations)[0];

      return {
        region,
        average,
        min: Math.min(...prices),
        max: Math.max(...prices),
        occupancy,
        topCity: topCity?.city || '-',
        topObservations: topCity?.observations || 0,
        priceBand: getPriceBand(average)
      };
    })
    .sort((left, right) => left.average - right.average);

export const DEFAULT_MAP_CENTER = [46.5, 2.5];
const LOW_PRICE_THRESHOLD = 3.5;
const MID_PRICE_THRESHOLD = 5.5;

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const formatDate = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);
export const formatCurrency = (value) => `${Number(value).toFixed(2)} EUR`;

export const getRegionsFromKpis = (rows) => [...new Set(rows.map((row) => row.region))].sort();

export const getCitiesForRegion = (rows, region) => {
  const filteredRows = region ? rows.filter((row) => row.region === region) : rows;
  return [...new Set(filteredRows.map((row) => row.city))].sort();
};

export const filterBySelection = (rows, region, city) =>
  rows.filter((row) => {
    if (region && row.region !== region) return false;
    if (city && row.city !== city) return false;
    return true;
  });

export const getPriceBand = (price) => {
  if (price < LOW_PRICE_THRESHOLD) return 'Economique';
  if (price < MID_PRICE_THRESHOLD) return 'Intermediaire';
  return 'Premium';
};

export const getPriceBandClassName = (price) => {
  if (price < LOW_PRICE_THRESHOLD) return 'tariff-chip tariff-chip--low';
  if (price < MID_PRICE_THRESHOLD) return 'tariff-chip tariff-chip--mid';
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
    avg_price: average(rows.map((row) => row.avg_price))
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
    average: average(rows.map((row) => row.avg_price))
  }));

  const cheapestRegion = [...regionAverages].sort((left, right) => left.average - right.average)[0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    average: average(prices),
    min: minPrice,
    max: maxPrice,
    spread: maxPrice - minPrice,
    cheapestRegion: cheapestRegion?.region || '-'
  };
};

export const buildTariffDetails = (kpisByRegion) =>
  Object.entries(kpisByRegion)
    .map(([region, rows]) => {
      const prices = rows.map((row) => row.avg_price);
      const averagePrice = average(prices);
      const occupancy = average(rows.map((row) => row.avg_occupancy));
      const topCity = [...rows].sort((left, right) => right.observations - left.observations)[0];

      return {
        region,
        average: averagePrice,
        min: Math.min(...prices),
        max: Math.max(...prices),
        occupancy,
        topCity: topCity?.city || '-',
        topObservations: topCity?.observations || 0,
        priceBand: getPriceBand(averagePrice)
      };
    })
    .sort((left, right) => left.average - right.average);

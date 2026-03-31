export const DEFAULT_MAP_CENTER = [46.5, 2.5];

const LOW_SCORE_THRESHOLD = 35;
const MID_SCORE_THRESHOLD = 60;
const MAX_DEPARTMENTS_IN_CHART = 15;
const MAX_SCATTER_POINTS = 40;
const MAX_KPI1_CITY_BARS = 20;
const MAX_KPI1_DEPARTMENT_BARS = 20;
const MAX_KPI4_SCATTER_POINTS = 50;

const KPI3_STATUS_COLORS = {
  Actif: '#1f8c5d',
  'Fin imminente': '#c99a00',
  'Mandat termine': '#d96b4d',
  Expire: '#b13a30',
  Autre: '#6f7d73'
};

const KPI3_AGE_ORDER = ['Historique', 'Etabli', 'Recent', 'Nouveau'];
const KPI4_PROFILE_COLORS = {
  Surplus: '#1f8c5d',
  Equilibre: '#c99a00',
  Tension: '#d49a00',
  'Forte tension': '#b13a30'
};

const DEPARTMENT_NAMES = {
  '01': 'Ain',
  '02': 'Aisne',
  '03': 'Allier',
  '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes',
  '07': 'Ardeche',
  '08': 'Ardennes',
  '09': 'Ariege',
  '10': 'Aube',
  '11': 'Aude',
  '12': 'Aveyron',
  '13': 'Bouches-du-Rhone',
  '14': 'Calvados',
  '15': 'Cantal',
  '16': 'Charente',
  '17': 'Charente-Maritime',
  '18': 'Cher',
  '19': 'Correze',
  '21': "Cote-d'Or",
  '22': "Cotes-d'Armor",
  '23': 'Creuse',
  '24': 'Dordogne',
  '25': 'Doubs',
  '26': 'Drome',
  '27': 'Eure',
  '28': 'Eure-et-Loir',
  '29': 'Finistere',
  '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse',
  '30': 'Gard',
  '31': 'Haute-Garonne',
  '32': 'Gers',
  '33': 'Gironde',
  '34': 'Herault',
  '35': 'Ille-et-Vilaine',
  '36': 'Indre',
  '37': 'Indre-et-Loire',
  '38': 'Isere',
  '39': 'Jura',
  '40': 'Landes',
  '41': 'Loir-et-Cher',
  '42': 'Loire',
  '43': 'Haute-Loire',
  '44': 'Loire-Atlantique',
  '45': 'Loiret',
  '46': 'Lot',
  '47': 'Lot-et-Garonne',
  '48': 'Lozere',
  '49': 'Maine-et-Loire',
  '50': 'Manche',
  '51': 'Marne',
  '52': 'Haute-Marne',
  '53': 'Mayenne',
  '54': 'Meurthe-et-Moselle',
  '55': 'Meuse',
  '56': 'Morbihan',
  '57': 'Moselle',
  '58': 'Nievre',
  '59': 'Nord',
  '60': 'Oise',
  '61': 'Orne',
  '62': 'Pas-de-Calais',
  '63': 'Puy-de-Dome',
  '64': 'Pyrenees-Atlantiques',
  '65': 'Hautes-Pyrenees',
  '66': 'Pyrenees-Orientales',
  '67': 'Bas-Rhin',
  '68': 'Haut-Rhin',
  '69': 'Rhone',
  '70': 'Haute-Saone',
  '71': 'Saone-et-Loire',
  '72': 'Sarthe',
  '73': 'Savoie',
  '74': 'Haute-Savoie',
  '75': 'Paris',
  '76': 'Seine-Maritime',
  '77': 'Seine-et-Marne',
  '78': 'Yvelines',
  '79': 'Deux-Sevres',
  '80': 'Somme',
  '81': 'Tarn',
  '82': 'Tarn-et-Garonne',
  '83': 'Var',
  '84': 'Vaucluse',
  '85': 'Vendee',
  '86': 'Vienne',
  '87': 'Haute-Vienne',
  '88': 'Vosges',
  '89': 'Yonne',
  '90': 'Territoire de Belfort',
  '91': 'Essonne',
  '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne',
  '95': "Val-d'Oise",
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'La Reunion',
  '976': 'Mayotte'
};

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const formatInteger = (value) => new Intl.NumberFormat('fr-FR').format(Number(value) || 0);
export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
export const formatScore = (value) => Number(value || 0).toFixed(1);
export const formatDepartment = (value) => {
  const code = String(value || '').trim();

  if (!code) {
    return '-';
  }

  return DEPARTMENT_NAMES[code] ? `${DEPARTMENT_NAMES[code]} (${code})` : `Dept ${code}`;
};
export const formatDate = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);
export const formatCurrency = (value) => `${Number(value).toFixed(2)} EUR`;

export const getRegionsFromKpis = (rows) => [...new Set(rows.map((row) => row.department))].sort();

export const getCitiesForRegion = (rows, department) => {
  const filteredRows = department ? rows.filter((row) => row.department === department) : rows;
  return [...new Set(filteredRows.map((row) => row.city))].sort();
};

export const filterBySelection = (rows, department, city) =>
  rows.filter((row) => {
    if (department && row.department !== department) return false;
    if (city && row.city !== city) return false;
    return true;
  });

export const getScoreBand = (score) => {
  if (score < LOW_SCORE_THRESHOLD) return 'A renforcer';
  if (score < MID_SCORE_THRESHOLD) return 'Solide';
  return 'Prioritaire';
};

export const getScoreBandClassName = (score) => {
  if (score < LOW_SCORE_THRESHOLD) return 'tariff-chip tariff-chip--low';
  if (score < MID_SCORE_THRESHOLD) return 'tariff-chip tariff-chip--mid';
  return 'tariff-chip tariff-chip--high';
};

export const groupKpisByRegion = (kpis) =>
  kpis.reduce((grouping, row) => {
    grouping[row.department] = grouping[row.department] || [];
    grouping[row.department].push(row);
    return grouping;
  }, {});

export const buildSummary = (kpis) => {
  if (!kpis.length) {
    return {
      averageScore: 0,
      averageMotorization: 0,
      totalLots: 0,
      topCity: '-'
    };
  }

  const topCity = [...kpis].sort((left, right) => right.nb_lots_stat_total - left.nb_lots_stat_total)[0];

  return {
    averageScore: average(kpis.map((row) => row.score_potentiel)),
    averageMotorization: average(kpis.map((row) => row.taux_motorisation_pct)),
    totalLots: kpis.reduce((sum, row) => sum + row.nb_lots_stat_total, 0),
    topCity: topCity?.city || '-'
  };
};

export const buildChartScoreData = (kpisByRegion) =>
  Object.entries(kpisByRegion)
    .map(([department, rows]) => ({
      department: formatDepartment(department),
      score_potentiel: average(rows.map((row) => row.score_potentiel))
    }))
    .sort((left, right) => right.score_potentiel - left.score_potentiel)
    .slice(0, MAX_DEPARTMENTS_IN_CHART);

const isEligibleForPotentialScore = (row) =>
  Number(row.nb_logements || 0) > 50 && Number(row.nb_copros || 0) > 0 && Number(row.nb_lots_stat_total || 0) > 0;

export const buildKpi1CityScoreData = (kpis) =>
  kpis
    .filter(isEligibleForPotentialScore)
    .sort((left, right) => Number(right.score_potentiel || 0) - Number(left.score_potentiel || 0))
    .slice(0, MAX_KPI1_CITY_BARS)
    .map((row, index) => ({
      city: row.city,
      department: formatDepartment(row.department),
      score_potentiel: Number(row.score_potentiel || 0),
      nb_copros: Number(row.nb_copros || 0),
      lots_stationnement: Number(row.nb_lots_stat_total || 0),
      nb_appartements: Number(row.nb_appartements || 0),
      nb_logements: Number(row.nb_logements || 0),
      taux_motorisation_pct: Number(row.taux_motorisation_pct || 0),
      rank: index + 1,
      priority:
        index < 4
          ? 'Priorite 1'
          : index < 10
            ? 'Priorite 2'
          : 'Priorite 3'
    }));

export const buildKpi1DepartmentScoreData = (kpis) =>
  Object.entries(
    kpis.filter(isEligibleForPotentialScore).reduce((grouping, row) => {
      const department = row.department || '-';
      grouping[department] = grouping[department] || [];
      grouping[department].push(row);
      return grouping;
    }, {})
  )
    .map(([department, rows]) => {
      const leader = [...rows].sort((left, right) => Number(right.score_potentiel || 0) - Number(left.score_potentiel || 0))[0];

      return {
        department: formatDepartment(department),
        score_potentiel: average(rows.map((row) => Number(row.score_potentiel || 0))),
        totalCommunes: rows.length,
        leaderCity: leader?.city || '-',
        lots_stationnement: rows.reduce((sum, row) => sum + Number(row.nb_lots_stat_total || 0), 0),
        nb_appartements: rows.reduce((sum, row) => sum + Number(row.nb_appartements || 0), 0),
        taux_motorisation_pct: average(rows.map((row) => Number(row.taux_motorisation_pct || 0)))
      };
    })
    .sort((left, right) => right.score_potentiel - left.score_potentiel)
    .slice(0, MAX_KPI1_DEPARTMENT_BARS)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      priority:
        index < 4
          ? 'Priorite 1'
          : index < 10
            ? 'Priorite 2'
            : 'Priorite 3'
    }));

export const buildPotentialOverview = (kpis, kpisByRegion) => {
  if (!kpis.length) {
    return {
      averageScore: 0,
      minScore: 0,
      maxScore: 0,
      spread: 0,
      topDepartment: '-'
    };
  }

  const scores = kpis.map((row) => row.score_potentiel);
  const departmentAverages = Object.entries(kpisByRegion).map(([department, rows]) => ({
    department,
    averageScore: average(rows.map((row) => row.score_potentiel))
  }));
  const topDepartment = [...departmentAverages].sort((left, right) => right.averageScore - left.averageScore)[0];
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  return {
    averageScore: average(scores),
    minScore,
    maxScore,
    spread: maxScore - minScore,
    topDepartment: formatDepartment(topDepartment?.department)
  };
};

export const buildPotentialDetails = (kpisByRegion) =>
  Object.entries(kpisByRegion)
    .map(([department, rows]) => {
      const leader = [...rows].sort((left, right) => right.score_potentiel - left.score_potentiel)[0];

      return {
        department: formatDepartment(department),
        averageScore: average(rows.map((row) => row.score_potentiel)),
        totalLots: rows.reduce((sum, row) => sum + row.nb_lots_stat_total, 0),
        averageMotorization: average(rows.map((row) => row.taux_motorisation_pct)),
        leadCity: leader?.city || '-',
        totalCommunes: rows.length,
        scoreBand: getScoreBand(average(rows.map((row) => row.score_potentiel)))
      };
    })
    .sort((left, right) => right.averageScore - left.averageScore);

export const buildMotorizationScatterData = (kpis) => {
  if (!kpis.length) {
    return [];
  }

  const topRows = [...kpis]
    .sort((left, right) => right.score_potentiel - left.score_potentiel)
    .slice(0, MAX_SCATTER_POINTS);

  const maxApartments = Math.max(...topRows.map((row) => row.nb_appartements || 0), 1);

  return topRows.map((row, index) => ({
    city: row.city,
    taux_motorisation_pct: Number(row.taux_motorisation_pct || 0),
    lots_stationnement_copro: Number(row.nb_lots_stat_total || 0),
    nb_appartements: Number(row.nb_appartements || 0),
    score_potentiel: Number(row.score_potentiel || 0),
    bubble_size: Math.max((Number(row.nb_appartements || 0) / maxApartments) * 800, 30),
    showLabel: index < 10
  }));
};

export const buildMotorizationScatterBounds = (scatterData) => {
  if (!scatterData.length) {
    return {
      xDomain: [0, 100],
      yDomain: [0, 1000]
    };
  }

  const xValues = scatterData.map((row) => row.taux_motorisation_pct);
  const yValues = scatterData.map((row) => row.lots_stationnement_copro);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);

  return {
    xDomain: [Math.max(0, Math.floor(minX - 3)), Math.min(100, Math.ceil(maxX + 3))],
    yDomain: [0, Math.ceil(maxY * 1.12 / 250) * 250]
  };
};

export const buildInterestingHighlights = (kpis) => {
  if (!kpis.length) {
    return [];
  }

  const topOpportunity = [...kpis].sort((left, right) => right.score_potentiel - left.score_potentiel)[0];
  const biggestParkingGap = [...kpis].sort((left, right) => right.parking_gap - left.parking_gap)[0];
  const strongestPublicSupply = [...kpis].sort((left, right) => right.nb_places_publiques - left.nb_places_publiques)[0];
  const densestApartmentMarket = [...kpis].sort((left, right) => right.nb_appartements - left.nb_appartements)[0];

  return [
    {
      id: 'top-opportunity',
      label: 'Commune la plus prometteuse',
      city: topOpportunity?.city || '-',
      value: formatScore(topOpportunity?.score_potentiel || 0),
      meta: `Score potentiel · Dept ${topOpportunity?.department || '-'}`,
      description: `${formatInteger(topOpportunity?.nb_lots_stat_total || 0)} lots copro et ${formatPercent(topOpportunity?.taux_motorisation_pct || 0)} de motorisation.`
    },
    {
      id: 'parking-gap',
      label: 'Demande non satisfaite la plus forte',
      city: biggestParkingGap?.city || '-',
      value: formatInteger(biggestParkingGap?.parking_gap || 0),
      meta: 'Menages motorises sans parking',
      description: `${formatPercent(biggestParkingGap?.pct_motorises_sans_parking || 0)} des menages restent sans solution de stationnement.`
    },
    {
      id: 'public-supply',
      label: 'Stock public le plus important',
      city: strongestPublicSupply?.city || '-',
      value: formatInteger(strongestPublicSupply?.nb_places_publiques || 0),
      meta: 'Places publiques declarees',
      description: `${formatInteger(strongestPublicSupply?.nb_parkings_publics || 0)} parkings publics repertories sur la commune.`
    },
    {
      id: 'apartments',
      label: 'Marche appartement le plus dense',
      city: densestApartmentMarket?.city || '-',
      value: formatInteger(densestApartmentMarket?.nb_appartements || 0),
      meta: 'Appartements recenses',
      description: `${formatInteger(densestApartmentMarket?.nb_copros || 0)} coproprietes visibles et ${formatInteger(densestApartmentMarket?.nb_logements || 0)} logements au total.`
    }
  ];
};

const cleanKpi3StatusLabel = (label) => {
  const cleaned = String(label || '').replace(/[✅⚠️❌⚫🔵🟢🆕]/g, '').trim();

  if (cleaned.startsWith('Actif')) return 'Actif';
  if (cleaned.startsWith('Fin imminente')) return 'Fin imminente';
  if (cleaned.startsWith('Mandat termine')) return 'Mandat termine';
  if (cleaned.startsWith('Expire')) return 'Expire';
  return cleaned || 'Autre';
};

const cleanKpi3AgeLabel = (label) => {
  const cleaned = String(label || '').replace(/[✅⚠️❌⚫🔵🟢🆕]/g, '').trim();

  if (cleaned.startsWith('Historique')) return 'Historique';
  if (cleaned.startsWith('Etabli')) return 'Etabli';
  if (cleaned.startsWith('Recent')) return 'Recent';
  if (cleaned.startsWith('Nouveau')) return 'Nouveau';
  return cleaned || 'Autre';
};

export const buildKpi3StatusData = (rows) => {
  const grouped = rows.reduce((accumulator, row) => {
    const label = cleanKpi3StatusLabel(row.alerte_commerciale);
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([label, value]) => ({
    label,
    value,
    color: KPI3_STATUS_COLORS[label] || KPI3_STATUS_COLORS.Autre
  }));
};

export const buildKpi3AgeStackData = (rows) => {
  const grouped = rows.reduce((accumulator, row) => {
    const ageLabel = cleanKpi3AgeLabel(row.anciennete_label);
    const statusLabel = cleanKpi3StatusLabel(row.alerte_commerciale);

    accumulator[ageLabel] = accumulator[ageLabel] || {
      ageLabel,
      Actif: 0,
      'Fin imminente': 0,
      'Mandat termine': 0,
      Expire: 0,
      Autre: 0,
      total: 0
    };

    accumulator[ageLabel][statusLabel] += 1;
    accumulator[ageLabel].total += 1;
    return accumulator;
  }, {});

  return Object.values(grouped).sort((left, right) => {
    const leftIndex = KPI3_AGE_ORDER.indexOf(left.ageLabel);
    const rightIndex = KPI3_AGE_ORDER.indexOf(right.ageLabel);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
};

const getKpi4ProfileLabel = (row) => {
  const ratio = Number(row.ratio_stat_par_logement || 0);
  const missingParkingPct = Number(row.pct_motorises_sans_parking || 0);

  if (ratio >= 0.05 && missingParkingPct <= 8) return 'Surplus';
  if (missingParkingPct <= 14) return 'Equilibre';
  if (missingParkingPct <= 22) return 'Tension';
  return 'Forte tension';
};

export const buildKpi4ProfileData = (rows) => {
  const grouped = rows.reduce((accumulator, row) => {
    const label = getKpi4ProfileLabel(row);
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  return ['Surplus', 'Equilibre', 'Tension', 'Forte tension']
    .filter((label) => grouped[label])
    .map((label) => ({
      label,
      value: grouped[label],
      color: KPI4_PROFILE_COLORS[label]
    }));
};

export const buildKpi4OfferDemandData = (rows) =>
  [...rows]
    .sort((left, right) => Number(right.index_partageabilite || 0) - Number(left.index_partageabilite || 0))
    .slice(0, MAX_KPI4_SCATTER_POINTS)
    .map((row, index) => ({
      city: row.ville,
      lots_stat_copro: Number(row.lots_stat_copro || 0),
      parking_gap: Math.max(Number(row.parking_gap || 0), 0),
      ratio_stat_par_logement: Number(row.ratio_stat_par_logement || 0),
      pct_motorises_sans_parking: Number(row.pct_motorises_sans_parking || 0),
      bubble_size: Math.max(Number(row.nb_appartements || 0) / 120, 40),
      showLabel: index < 10
    }));

export const buildKpi4OfferDemandBounds = (rows) => {
  if (!rows.length) {
    return {
      xDomain: [0, 1000],
      yDomain: [0, 1000]
    };
  }

  const xValues = rows.map((row) => row.lots_stat_copro);
  const yValues = rows.map((row) => row.parking_gap);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);

  return {
    xDomain: [0, Math.ceil(maxX * 1.12 / 250) * 250],
    yDomain: [0, Math.ceil(maxY * 1.12 / 5000) * 5000]
  };
};

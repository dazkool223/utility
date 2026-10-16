import { ToolError } from '@/core/types';

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  aliases?: string[];
  /** Multiply by this to get the category's base unit. */
  factor: number;
  /** For non-linear units (temperature). */
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
}

export interface Category {
  id: string;
  name: string;
  base: string;
  units: Unit[];
}

const u = (id: string, name: string, symbol: string, factor: number, aliases: string[] = []): Unit => ({ id, name, symbol, factor, aliases });

const KiB = 1024;

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'Length',
    base: 'm',
    units: [
      u('nm', 'Nanometre', 'nm', 1e-9, ['nanometer', 'nanometers', 'nanometres']),
      u('um', 'Micrometre', 'µm', 1e-6, ['µm', 'micron', 'micrometer', 'micrometers']),
      u('mm', 'Millimetre', 'mm', 1e-3, ['millimeter', 'millimeters', 'millimetres']),
      u('cm', 'Centimetre', 'cm', 1e-2, ['centimeter', 'centimeters', 'centimetres']),
      u('m', 'Metre', 'm', 1, ['meter', 'meters', 'metres']),
      u('km', 'Kilometre', 'km', 1e3, ['kilometer', 'kilometers', 'kilometres']),
      u('in', 'Inch', 'in', 0.0254, ['inch', 'inches', '"']),
      u('ft', 'Foot', 'ft', 0.3048, ['foot', 'feet', "'"]),
      u('yd', 'Yard', 'yd', 0.9144, ['yard', 'yards']),
      u('mi', 'Mile', 'mi', 1609.344, ['mile', 'miles']),
      u('nmi', 'Nautical mile', 'nmi', 1852, ['nautical mile', 'nautical miles']),
      u('au', 'Astronomical unit', 'au', 149597870700, ['astronomical unit']),
      u('ly', 'Light year', 'ly', 9460730472580800, ['light year', 'light years', 'lightyear']),
    ],
  },
  {
    id: 'mass',
    name: 'Mass',
    base: 'kg',
    units: [
      u('mg', 'Milligram', 'mg', 1e-6, ['milligram', 'milligrams']),
      u('g', 'Gram', 'g', 1e-3, ['gram', 'grams']),
      u('kg', 'Kilogram', 'kg', 1, ['kilogram', 'kilograms', 'kilo', 'kilos']),
      u('t', 'Tonne (metric)', 't', 1000, ['tonne', 'tonnes', 'metric ton']),
      u('oz', 'Ounce', 'oz', 0.028349523125, ['ounce', 'ounces']),
      u('lb', 'Pound', 'lb', 0.45359237, ['lbs', 'pound', 'pounds']),
      u('st', 'Stone', 'st', 6.35029318, ['stone', 'stones']),
      u('ton', 'Short ton (US)', 'ton', 907.18474, ['short ton', 'us ton']),
      u('lton', 'Long ton (UK)', 'long ton', 1016.0469088, ['long ton', 'imperial ton']),
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    base: 'K',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', aliases: ['celsius', 'degc', '°c', 'c'], factor: 1, toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', aliases: ['fahrenheit', 'degf', '°f', 'f'], factor: 1, toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', aliases: ['kelvin', 'k'], factor: 1, toBase: (v) => v, fromBase: (v) => v },
      { id: 'r', name: 'Rankine', symbol: '°R', aliases: ['rankine', '°r'], factor: 1, toBase: (v) => (v * 5) / 9, fromBase: (v) => (v * 9) / 5 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    base: 's',
    units: [
      u('ns', 'Nanosecond', 'ns', 1e-9, ['nanosecond', 'nanoseconds']),
      u('us', 'Microsecond', 'µs', 1e-6, ['µs', 'microsecond', 'microseconds']),
      u('ms', 'Millisecond', 'ms', 1e-3, ['millisecond', 'milliseconds']),
      u('s', 'Second', 's', 1, ['sec', 'secs', 'second', 'seconds']),
      u('min', 'Minute', 'min', 60, ['mins', 'minute', 'minutes']),
      u('h', 'Hour', 'h', 3600, ['hr', 'hrs', 'hour', 'hours']),
      u('d', 'Day', 'd', 86400, ['day', 'days']),
      u('wk', 'Week', 'wk', 604800, ['week', 'weeks']),
      u('mo', 'Month (average)', 'mo', 2629746, ['month', 'months']),
      u('yr', 'Year (365.25 days)', 'yr', 31557600, ['y', 'year', 'years']),
    ],
  },
  {
    id: 'data',
    name: 'Digital storage',
    base: 'B',
    units: [
      u('bit', 'Bit', 'bit', 1 / 8, ['bits', 'b']),
      u('B', 'Byte', 'B', 1, ['byte', 'bytes']),
      u('kB', 'Kilobyte (1000 B)', 'kB', 1e3, ['kb', 'kilobyte', 'kilobytes']),
      u('MB', 'Megabyte (1000² B)', 'MB', 1e6, ['megabyte', 'megabytes']),
      u('GB', 'Gigabyte (1000³ B)', 'GB', 1e9, ['gigabyte', 'gigabytes']),
      u('TB', 'Terabyte (1000⁴ B)', 'TB', 1e12, ['terabyte', 'terabytes']),
      u('PB', 'Petabyte (1000⁵ B)', 'PB', 1e15, ['petabyte', 'petabytes']),
      u('KiB', 'Kibibyte (1024 B)', 'KiB', KiB, ['kibibyte', 'kibibytes']),
      u('MiB', 'Mebibyte (1024² B)', 'MiB', KiB ** 2, ['mebibyte', 'mebibytes']),
      u('GiB', 'Gibibyte (1024³ B)', 'GiB', KiB ** 3, ['gibibyte', 'gibibytes']),
      u('TiB', 'Tebibyte (1024⁴ B)', 'TiB', KiB ** 4, ['tebibyte', 'tebibytes']),
      u('PiB', 'Pebibyte (1024⁵ B)', 'PiB', KiB ** 5, ['pebibyte', 'pebibytes']),
      u('kbit', 'Kilobit', 'kbit', 125, ['kilobit', 'kilobits', 'kbps']),
      u('Mbit', 'Megabit', 'Mbit', 125000, ['megabit', 'megabits', 'mbps']),
      u('Gbit', 'Gigabit', 'Gbit', 125000000, ['gigabit', 'gigabits', 'gbps']),
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    base: 'm/s',
    units: [
      u('mps', 'Metres per second', 'm/s', 1, ['m/s', 'mps']),
      u('kph', 'Kilometres per hour', 'km/h', 1 / 3.6, ['km/h', 'kph', 'kmh', 'kmph']),
      u('mph', 'Miles per hour', 'mph', 0.44704, ['mi/h']),
      u('kn', 'Knot', 'kn', 1852 / 3600, ['knot', 'knots', 'kt', 'kts']),
      u('fps', 'Feet per second', 'ft/s', 0.3048, ['ft/s', 'fps']),
      u('mach', 'Mach (at sea level, 15 °C)', 'Mach', 340.29, ['mach']),
      u('c', 'Speed of light', 'c', 299792458, ['lightspeed']),
    ],
  },
  {
    id: 'area',
    name: 'Area',
    base: 'm²',
    units: [
      u('mm2', 'Square millimetre', 'mm²', 1e-6, ['mm2', 'sq mm']),
      u('cm2', 'Square centimetre', 'cm²', 1e-4, ['cm2', 'sq cm']),
      u('m2', 'Square metre', 'm²', 1, ['m2', 'sq m']),
      u('ha', 'Hectare', 'ha', 1e4, ['hectare', 'hectares']),
      u('km2', 'Square kilometre', 'km²', 1e6, ['km2', 'sq km']),
      u('in2', 'Square inch', 'in²', 0.00064516, ['in2', 'sq in']),
      u('ft2', 'Square foot', 'ft²', 0.09290304, ['ft2', 'sq ft']),
      u('yd2', 'Square yard', 'yd²', 0.83612736, ['yd2', 'sq yd']),
      u('ac', 'Acre', 'ac', 4046.8564224, ['acre', 'acres']),
      u('mi2', 'Square mile', 'mi²', 2589988.110336, ['mi2', 'sq mi']),
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    base: 'L',
    units: [
      u('ml', 'Millilitre', 'mL', 1e-3, ['milliliter', 'milliliters', 'millilitre', 'millilitres', 'cc']),
      u('l', 'Litre', 'L', 1, ['liter', 'liters', 'litre', 'litres']),
      u('m3', 'Cubic metre', 'm³', 1000, ['m3', 'cubic meter', 'cubic metre']),
      u('tsp', 'Teaspoon (US)', 'tsp', 0.00492892159375, ['teaspoon', 'teaspoons']),
      u('tbsp', 'Tablespoon (US)', 'tbsp', 0.01478676478125, ['tablespoon', 'tablespoons']),
      u('floz', 'Fluid ounce (US)', 'fl oz', 0.0295735295625, ['fl oz', 'fluid ounce', 'fluid ounces']),
      u('cup', 'Cup (US)', 'cup', 0.2365882365, ['cups']),
      u('pt', 'Pint (US)', 'pt', 0.473176473, ['pint', 'pints']),
      u('qt', 'Quart (US)', 'qt', 0.946352946, ['quart', 'quarts']),
      u('gal', 'Gallon (US)', 'gal', 3.785411784, ['gallon', 'gallons']),
      u('ukgal', 'Gallon (UK)', 'UK gal', 4.54609, ['imperial gallon', 'uk gallon']),
      u('in3', 'Cubic inch', 'in³', 0.016387064, ['in3', 'cubic inch']),
      u('ft3', 'Cubic foot', 'ft³', 28.316846592, ['ft3', 'cubic foot', 'cubic feet']),
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    base: 'Pa',
    units: [
      u('pa', 'Pascal', 'Pa', 1, ['pascal', 'pascals']),
      u('kpa', 'Kilopascal', 'kPa', 1e3, ['kilopascal']),
      u('mpa', 'Megapascal', 'MPa', 1e6, ['megapascal']),
      u('bar', 'Bar', 'bar', 1e5, ['bars']),
      u('mbar', 'Millibar', 'mbar', 100, ['millibar', 'hpa']),
      u('atm', 'Atmosphere', 'atm', 101325, ['atmosphere', 'atmospheres']),
      u('psi', 'Pound per square inch', 'psi', 6894.757293168, []),
      u('mmhg', 'Millimetre of mercury', 'mmHg', 133.322387415, ['torr']),
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    base: 'J',
    units: [
      u('j', 'Joule', 'J', 1, ['joule', 'joules']),
      u('kj', 'Kilojoule', 'kJ', 1e3, ['kilojoule', 'kilojoules']),
      u('cal', 'Calorie (thermochemical)', 'cal', 4.184, ['calorie', 'calories']),
      u('kcal', 'Kilocalorie', 'kcal', 4184, ['kilocalorie', 'kilocalories', 'food calorie', 'Cal']),
      u('wh', 'Watt-hour', 'Wh', 3600, ['watt hour']),
      u('kwh', 'Kilowatt-hour', 'kWh', 3.6e6, ['kilowatt hour', 'kilowatt-hour']),
      u('btu', 'British thermal unit', 'BTU', 1055.05585262, ['btus']),
      u('ev', 'Electronvolt', 'eV', 1.602176634e-19, ['electronvolt']),
      u('ftlb', 'Foot-pound', 'ft·lbf', 1.3558179483314, ['ft-lb', 'ft lbf']),
    ],
  },
  {
    id: 'power',
    name: 'Power',
    base: 'W',
    units: [
      u('w', 'Watt', 'W', 1, ['watt', 'watts']),
      u('kw', 'Kilowatt', 'kW', 1e3, ['kilowatt', 'kilowatts']),
      u('mw', 'Megawatt', 'MW', 1e6, ['megawatt', 'megawatts']),
      u('hp', 'Horsepower (mechanical)', 'hp', 745.69987158227, ['horsepower']),
      u('ps', 'Metric horsepower', 'PS', 735.49875, ['cv', 'metric hp']),
      u('btuh', 'BTU per hour', 'BTU/h', 0.29307107017, ['btu/hr']),
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    base: 'deg',
    units: [
      u('deg', 'Degree', '°', 1, ['degree', 'degrees', '°']),
      u('rad', 'Radian', 'rad', 180 / Math.PI, ['radian', 'radians']),
      u('grad', 'Gradian', 'grad', 0.9, ['gon', 'gradian', 'gradians']),
      u('turn', 'Turn', 'turn', 360, ['rev', 'revolution', 'turns']),
      u('arcmin', 'Arcminute', '′', 1 / 60, ['arcminute', 'arcminutes', "′"]),
      u('arcsec', 'Arcsecond', '″', 1 / 3600, ['arcsecond', 'arcseconds', '″']),
    ],
  },
  {
    id: 'frequency',
    name: 'Frequency',
    base: 'Hz',
    units: [
      u('hz', 'Hertz', 'Hz', 1, ['hertz']),
      u('khz', 'Kilohertz', 'kHz', 1e3, ['kilohertz']),
      u('mhz', 'Megahertz', 'MHz', 1e6, ['megahertz']),
      u('ghz', 'Gigahertz', 'GHz', 1e9, ['gigahertz']),
      u('rpm', 'Revolutions per minute', 'rpm', 1 / 60, []),
    ],
  },
];

export function findCategory(id: string): Category {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) throw new ToolError(`Unknown category "${id}".`);
  return c;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Finds a unit by id, symbol, name or alias. Case-sensitive symbols win so "MB" and "mb" (megabit alias) stay distinct. */
export function findUnit(text: string, within?: Category): { category: Category; unit: Unit } | null {
  const cats = within ? [within] : CATEGORIES;
  const t = text.trim();
  for (const pass of [0, 1]) {
    for (const category of cats) {
      for (const unit of category.units) {
        const exact = [unit.id, unit.symbol, ...(unit.aliases ?? [])];
        if (pass === 0 ? exact.includes(t) : [unit.id, unit.symbol, unit.name, ...(unit.aliases ?? [])].some((a) => norm(a) === norm(t))) return { category, unit };
      }
    }
  }
  return null;
}

export function convertValue(value: number, from: Unit, to: Unit): number {
  const base = from.toBase ? from.toBase(value) : value * from.factor;
  return to.fromBase ? to.fromBase(base) : base / to.factor;
}

/** Formats with up to 12 significant digits, avoiding floating-point noise like 0.30000000000000004. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return Number(n.toPrecision(12)).toExponential().replace('e+', 'e');
  const s = Number(n.toPrecision(12)).toString();
  const [i, f] = s.split('.');
  return f ? `${i!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${f}` : i!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parseQuantity(input: string): { value: number; unitText: string } {
  const t = input.trim();
  if (!t) throw new ToolError('Enter a number, optionally with a unit, such as 5 km or 72 °F.');
  const m = /^([-+]?(?:\d[\d_,]*\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*(.*)$/.exec(t);
  if (!m) throw new ToolError(`"${t}" does not start with a number.`);
  const value = Number(m[1]!.replace(/[_,]/g, ''));
  if (!Number.isFinite(value)) throw new ToolError(`"${m[1]}" is not a valid number.`);
  return { value, unitText: m[2]!.trim() };
}

export interface ConversionRow {
  unit: Unit;
  result: string;
}

export function convertAll(input: string, defaultCategory: string, defaultUnit: string): { category: Category; from: Unit; value: number; rows: ConversionRow[] } {
  const { value, unitText } = parseQuantity(input);
  let category = findCategory(defaultCategory);
  let from: Unit | undefined = category.units.find((x) => x.id === defaultUnit) ?? category.units[0];
  if (unitText) {
    const hit = findUnit(unitText);
    if (!hit) throw new ToolError(`The unit "${unitText}" is not recognised. Try a symbol such as km, kg, °C, MiB or mph.`);
    category = hit.category;
    from = hit.unit;
  }
  if (!from) throw new ToolError('Pick a unit.');
  const src = from;
  const rows = category.units.filter((x) => x.id !== src.id).map((unit) => ({ unit, result: formatNumber(convertValue(value, src, unit)) }));
  return { category, from: src, value, rows };
}

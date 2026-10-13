export type NutritionRow = { label: string; amount: string; reference?: string };
export type NutritionFacts = {
  energy: string;
  referenceYear: 2009 | 2020;
  rows: NutritionRow[];
};

// Transcribed from the official, unmodified PDFs in public/nutrition.
// Blank reference values in those PDFs deliberately remain blank here.
function facts(sodium: string, sodiumReference: string, referenceYear: 2009 | 2020, vitaminC = false): NutritionFacts {
  return {
    energy: referenceYear === 2020 ? '75 kJ / 20 kcal' : '85 kJ / 20 kcal',
    referenceYear,
    rows: [
      { label: 'Grasa total', amount: '0 g', reference: '0 %' },
      { label: 'Grasa saturada', amount: '0 g' },
      ...(referenceYear === 2009 ? [
        { label: 'Grasa trans', amount: '0 g' },
        { label: 'Colesterol', amount: '0 mg', reference: '0 %' },
      ] : []),
      { label: 'Carbohidratos totales', amount: '5 g', reference: '2 %' },
      { label: 'Azúcar', amount: '5 g' },
      { label: 'Fibra', amount: '0 g', reference: '0 %' },
      { label: 'Proteína', amount: '0 g', reference: '0 %' },
      { label: 'Sodio**', amount: sodium, reference: sodiumReference },
      ...(vitaminC ? [{ label: referenceYear === 2009 ? 'Vitamina C**' : 'Vitamina C', amount: '9 mg', reference: '15 %' }] : []),
    ],
  };
}

export const nutritionFacts: Record<string, NutritionFacts> = {
  'te-verde-maracuya': facts('30 mg', '1 %', 2020),
  'te-blanco-fresa': facts('30 mg', '1 %', 2020),
  'te-frio-manzana': facts('30 mg', '1 %', 2020),
  arandanos: facts('30 mg', '1 %', 2020),
  'frutos-rojos': facts('60 mg', '3 %', 2020),
  hierbabuena: facts('75 mg', '3 %', 2020, true),
  pitahaya: facts('30 mg', '1 %', 2020, true),
  melocoton: facts('15 mg', '0,6 %', 2009),
  'manzana-canela': facts('15 mg', '0,6 %', 2009),
  limon: facts('60 mg', '2,5 %', 2009),
  'naranja-mandarina': facts('5 mg', '0,2 %', 2009, true),
  kiwi: facts('10 mg', '0,4 %', 2009),
  'frutas-mixtas': facts('30 mg', '1,3 %', 2009, true),
};

export type QuizAnswers = {
  hunger: 'snack' | 'hungry' | 'starving'
  vibe: 'comfort' | 'light' | 'treat' | 'adventurous'
  price: '$' | '$$' | '$$$'
  speed: 'asap' | 'no-rush'
  cuisine: 'pizza' | 'burgers' | 'asian' | 'mexican' | 'surprise'
}

const vibeToCategories: Record<string, string> = {
  'Comfort food':        'burgers,pizza,sandwiches,soup',
  'Something light':     'salad,wraps,mediterranean,sushi',
  'Treat yourself':      'steak,seafood,italian,gastropubs',
  'Feeling adventurous': 'thai,indian,ethiopian,korean,peruvian',
}

const cuisineOverride: Record<string, string | null> = {
  'Pizza':       'pizza',
  'Burgers':     'burgers',
  'Asian':       'chinese,thai,japanese,korean',
  'Mexican':     'mexican',
  'Surprise me': null,
}

const priceMap: Record<string, string> = {
  '$':   '1',
  '$$':  '1,2',
  '$$$': '2,3',
}

export function mapToYelpParams(answers: Record<string, string>) {
  const override = cuisineOverride[answers.cuisine]
  const categories = override ?? vibeToCategories[answers.vibe] ?? 'restaurants'
  const sort_by = answers.speed === 'ASAP' ? 'distance' : 'rating'

  return {
    categories,
    price: priceMap[answers.price] ?? '1,2',
    sort_by,
  }
}

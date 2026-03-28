export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const COUNTRIES = {
    'DE': 'DE-LU',
    'FR': 'FR',
    'AT': 'AT',
    'HU': 'HU',
    'CZ': 'CZ',
    'SK': 'SK',
    'RO': 'RO',
    'PL': 'PL',
    'IT': 'IT_NORD',
    'ES': 'ES',
    'NL': 'NL',
    'BE': 'BE',
    'CH': 'CH',
    'SI': 'SI',
    'HR': 'HR'
  };
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const results = await Promise.allSettled(
      Object.entries(COUNTRIES).map(([code, bzn]) =>
        fetch(`https://api.energy-charts.info/price?bzn=${bzn}&start=${today}&end=${today}`)
          .then(r => r.json())
          .then(data => {
            if (data.price && Array.isArray(data.price)) {
              const valid = data.price.filter(p => p !== null && !isNaN(p));
              if (valid.length) {
                return {
                  country: code,
                  max: Math.max(...valid),
                  min: Math.min(...valid),
                  avg: valid.reduce((a,b) => a+b, 0) / valid.length,
                  dataPoints: valid.length
                };
              }
            }
            return { country: code, error: 'No valid data' };
          })
          .catch(() => ({ country: code, error: true }))
      )
    );
    
    const priceData = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(d => !d.error);
    
    res.status(200).json({
      success: true,
      date: today,
      countries: priceData,
      total: priceData.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

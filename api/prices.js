export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const COUNTRIES = ['DE','FR','AT','HU','CZ','SK','RO','PL','IT','ES','NL','BE','CH','SI','HR'];
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const results = await Promise.allSettled(
      COUNTRIES.map(country =>
        fetch(`https://api.energy-charts.info/price?bzn=${country}&start=${today}&end=${today}`)
          .then(r => r.json())
          .then(data => {
            if (data.price && Array.isArray(data.price)) {
              const valid = data.price.filter(p => p !== null && !isNaN(p));
              if (valid.length) {
                return {
                  country,
                  max: Math.max(...valid),
                  min: Math.min(...valid),
                  avg: valid.reduce((a,b) => a+b, 0) / valid.length,
                  dataPoints: valid.length
                };
              }
            }
            return { country, error: 'No valid data' };
          })
          .catch(() => ({ country, error: true }))
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

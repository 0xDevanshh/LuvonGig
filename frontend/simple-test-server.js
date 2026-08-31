const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVICES_FILE = '/tmp/marketplace-storage/services.json';

function getServices() {
  try {
    if (fs.existsSync(SERVICES_FILE)) {
      const data = fs.readFileSync(SERVICES_FILE, 'utf8');
      const services = JSON.parse(data);
      return services.map((service) => ({
        ...service,
        description_format: service.description_format || 'markdown'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error reading services:', error);
    return [];
  }
}

function transformServices(services) {
  return services.map((service) => {
    return {
      service_id: service.service_id,
      freelancer_id: service.freelancer_email,
      freelancer_email: service.freelancer_email,
      title: service.title,
      main_category: service.main_category,
      sub_category: service.sub_category,
      description: service.description,
      description_format: service.description_format || 'markdown',
      whats_included: service.whats_included,
      cover_image_url: service.cover_image_url || '',
      portfolio_images: service.portfolio_images || [],
      status: service.status || 'Active',
      rating_avg: service.rating_avg || 0,
      total_orders: service.total_orders || 0,
      created_at: parseInt(service.created_at) / 1000000,
      updated_at: parseInt(service.updated_at) / 1000000,
      delivery_time_days: 7,
      starting_from_e8s: service.packages && service.packages.length > 0
        ? Math.min(...service.packages.map((p) => p.price_e8s))
        : 100000000,
      total_rating: service.rating_avg || 0,
      review_count: service.total_orders || 0,
      tags: [],
      min_delivery_days: 7,
      max_delivery_days: 7,
      delivery_timeline: '7 days',
      tier_mode: service.tier_mode || '3tier',
      packages: service.packages || [],
      client_questions: service.client_questions || [],
      faqs: service.faqs || []
    };
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/marketplace/services' && req.method === 'GET') {
    try {
      const services = getServices();
      console.log(`Found ${services.length} services in local storage`);

      const transformedServices = transformServices(services);
      console.log(`Transformed ${transformedServices.length} services`);

      const response = {
        success: true,
        data: transformedServices,
        count: transformedServices.length,
        total: transformedServices.length
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error in services API:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/api/marketplace/services`);
});
// Console logging script for my-services page data
// Copy and paste this into the browser console on http://localhost:3000/freelancer/my-services

console.log('🔍 MY-SERVICES PAGE DATA ANALYSIS');
console.log('==================================');

// Console log all the React component state
console.log('📊 Component State:');
console.log('userId:', typeof userId !== 'undefined' ? userId : 'undefined (check in component)');
console.log('userEmail:', typeof userEmail !== 'undefined' ? userEmail : 'undefined (check in component)');
console.log('services:', typeof services !== 'undefined' ? services : 'undefined (check in component)');
console.log('loading:', typeof loading !== 'undefined' ? loading : 'undefined (check in component)');
console.log('error:', typeof error !== 'undefined' ? error : 'undefined (check in component)');
console.log('isCheckingAuth:', typeof isCheckingAuth !== 'undefined' ? isCheckingAuth : 'undefined (check in component)');
console.log('fetchedServices:', typeof fetchedServices !== 'undefined' ? fetchedServices : 'undefined (check in component)');

// Test the same API calls the page makes
async function debugServiceLoading() {
    console.log('\n🔐 Testing Authentication...');
    try {
        const authResponse = await fetch('/api/auth/me');
        const authData = await authResponse.json();
        console.log('Auth Response:', authData);
    } catch (error) {
        console.error('Auth Error:', error);
    }

    console.log('\n📋 Testing Services API...');
    try {
        // Test the exact same call the page makes
        const servicesResponse = await fetch('/api/marketplace/services?freelancer_email=t3chnobromo@gmail.com&limit=50');
        const servicesData = await servicesResponse.json();
        console.log('Services API Response:', servicesData);

        if (servicesData.success && servicesData.data && servicesData.data.length > 0) {
            console.log('\n🎯 SERVICE DETAILS:');
            servicesData.data.forEach((service, index) => {
                console.log(`\nService ${index + 1}:`);
                console.log('  service_id:', service.service_id);
                console.log('  freelancer_id:', service.freelancer_id);
                console.log('  title:', service.title);
                console.log('  main_category:', service.main_category);
                console.log('  sub_category:', service.sub_category);
                console.log('  description:', service.description);
                console.log('  whats_included:', service.whats_included);
                console.log('  cover_image_url:', service.cover_image_url);
                console.log('  portfolio_images:', service.portfolio_images);
                console.log('  status:', service.status);
                console.log('  rating_avg:', service.rating_avg);
                console.log('  total_orders:', service.total_orders);
                console.log('  created_at:', service.created_at);
                console.log('  updated_at:', service.updated_at);

                // Test packages for this service
                console.log(`\n  📦 Testing packages for service ${service.service_id}...`);
                testPackagesForService(service.service_id);
            });
        } else {
            console.log('No services found or API failed');
        }
    } catch (error) {
        console.error('Services API Error:', error);
    }
}

async function testPackagesForService(serviceId) {
    try {
        // Test packages API
        const packagesResponse = await fetch(`/api/marketplace/packages?service_id=${serviceId}`);
        const packagesData = await packagesResponse.json();

        console.log('    Packages Response:', packagesData);

        if (packagesData.success && packagesData.data && packagesData.data.length > 0) {
            console.log('    💰 Package Details:');
            packagesData.data.forEach((pkg, index) => {
                const priceICP = (parseFloat(pkg.price_e8s) / 100000000).toFixed(2);
                console.log(`      ${index + 1}. ${pkg.tier}:`);
                console.log('         package_id:', pkg.package_id);
                console.log('         title:', pkg.title);
                console.log('         description:', pkg.description);
                console.log('         price_e8s:', pkg.price_e8s);
                console.log('         price (ICP):', priceICP);
                console.log('         delivery_days:', pkg.delivery_days);
                console.log('         features:', pkg.features);
                console.log('         revisions_included:', pkg.revisions_included);
                console.log('         status:', pkg.status);
            });
        }

        // Test individual service packages endpoint
        console.log(`    🔍 Testing individual packages endpoint...`);
        const individualResponse = await fetch(`/api/marketplace/services/${serviceId}/packages`);
        const individualData = await individualResponse.json();
        console.log('    Individual Packages Response:', individualData);

    } catch (error) {
        console.error('    Packages Error:', error);
    }
}

// Test data transformation
console.log('\n🔄 Testing Data Transformation...');
if (typeof fetchedServices !== 'undefined' && fetchedServices.length > 0) {
    const sampleService = fetchedServices[0];

    // Simulate the transformServiceData function
    let createdDate;
    if (!sampleService.created_at) {
        createdDate = new Date().toISOString().split('T')[0];
    } else if (typeof sampleService.created_at === 'number') {
        createdDate = new Date(sampleService.created_at / 1000000).toISOString().split('T')[0];
    } else {
        createdDate = new Date(sampleService.created_at).toISOString().split('T')[0];
    }

    const transformedService = {
        id: sampleService.service_id,
        title: sampleService.title,
        category: sampleService.main_category,
        subCategory: sampleService.sub_category,
        price: '0.00', // Will be updated when packages are fetched
        coverImage: sampleService.cover_image_url || '/placeholder-service.jpg',
        status: sampleService.status?.toLowerCase() || 'active',
        views: 0,
        orders: sampleService.total_orders || 0,
        rating: sampleService.rating_avg || 0,
        createdAt: createdDate,
        description: sampleService.description
    };

    console.log('Original Service:', sampleService);
    console.log('Transformed Service:', transformedService);
}

// Run the debug function
debugServiceLoading();

console.log('\n💡 To access React component data directly:');
console.log('1. Open Chrome DevTools');
console.log('2. Go to Components tab');
console.log('3. Find the MyServices component');
console.log('4. Click on it to see its props and state');
console.log('5. Look for: userId, userEmail, services, loading, error, fetchedServices');

console.log('\n🎯 Console Logger Active - Check the results above!');
import * as tf from '@tensorflow/tfjs';

/**
 * Prepares historical order data for time-series prediction
 * @param {Array} orderData - Raw order data from Supabase
 * @returns {Array} Processed data ready for modeling
 */
export function prepareHistoricalData(orderData) {
  if (!orderData || orderData.length === 0) return [];
  
  // Group orders by date
  const ordersByDate = {};
  orderData.forEach(order => {
    const date = order.created_at.split('T')[0];
    if (!ordersByDate[date]) {
      ordersByDate[date] = { 
        count: 0, 
        revenue: 0, 
        uniformTypes: {}, 
        courseDistribution: {},
        genderDistribution: { male: 0, female: 0 }
      };
    }
    
    // Count orders and revenue
    ordersByDate[date].count++;
    ordersByDate[date].revenue += order.amount_paid || 0;
    
    // Track uniform types
    const uniformType = order.uniform_type?.toLowerCase() || 'unknown';
    if (!ordersByDate[date].uniformTypes[uniformType]) {
      ordersByDate[date].uniformTypes[uniformType] = 0;
    }
    ordersByDate[date].uniformTypes[uniformType]++;
    
    // Track course distribution
    if (order.students?.courses?.course_code) {
      const courseCode = order.students.courses.course_code;
      if (!ordersByDate[date].courseDistribution[courseCode]) {
        ordersByDate[date].courseDistribution[courseCode] = 0;
      }
      ordersByDate[date].courseDistribution[courseCode]++;
    }
    
    // Track gender distribution
    if (order.students?.gender) {
      const gender = order.students.gender.toLowerCase();
      if (gender === 'male' || gender === 'female') {
        ordersByDate[date].genderDistribution[gender]++;
      }
    }
  });
  
  // Convert to array and sort by date
  return Object.entries(ordersByDate).map(([date, data]) => {
    const jsDate = new Date(date);
    return {
      date,
      revenue: data.revenue,
      count: data.count,
      day: jsDate.getDay(),
      dayOfMonth: jsDate.getDate(),
      month: jsDate.getMonth(),
      uniformTypes: data.uniformTypes,
      courseDistribution: data.courseDistribution,
      genderDistribution: data.genderDistribution
    };
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Creates and trains a sales prediction model using TensorFlow.js
 * @param {Array} historicalData - Processed historical order data
 * @returns {tf.Sequential} Trained TensorFlow model
 */
export async function createSalesPredictionModel(historicalData) {
  // Even with limited data, we'll try to create a simple model
  // Minimum data points reduced from 10 to 5
  if (!historicalData || historicalData.length < 3) {
    console.warn('Almost no historical data available for model training');
    return createFallbackModel();
  }
  
  // Extract features and labels
  const features = historicalData.map(d => [
    d.day,                 // Day of week (0-6)
    d.dayOfMonth,          // Day of month (1-31)
    d.month,               // Month (0-11)
    d.revenue > 0 ? 1 : 0  // Binary indicator if there was revenue that day
  ]);
  const labels = historicalData.map(d => d.revenue);
  
  // Normalize data
  const featureTensor = tf.tensor2d(features);
  const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
  
  const featureMean = featureTensor.mean(0);
  const featureStd = featureTensor.sub(featureMean).square().mean(0).sqrt().add(1e-8); // Add small epsilon to avoid division by zero
  const normalizedFeatures = featureTensor.sub(featureMean).div(featureStd);
  
  const labelMean = labelTensor.mean();
  const labelStd = labelTensor.sub(labelMean).square().mean().sqrt().add(1e-8);
  const normalizedLabels = labelTensor.sub(labelMean).div(labelStd);
  
  // Build model - simpler model for limited data
  const model = tf.sequential();
  model.add(tf.layers.dense({
    inputShape: [features[0].length],
    units: Math.max(5, Math.min(10, historicalData.length)), // Adaptive units based on data size
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));
  
  // Only add second layer if we have enough data
  if (historicalData.length >= 10) {
    model.add(tf.layers.dense({
      units: 5,
      activation: 'relu'
    }));
  }
  
  model.add(tf.layers.dense({ units: 1 }));
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError'
  });
  
  // Train model - fewer epochs for small datasets
  const epochs = Math.min(100, Math.max(20, historicalData.length * 5));
  
  try {
    await model.fit(normalizedFeatures, normalizedLabels, {
      epochs: epochs,
      validationSplit: historicalData.length >= 10 ? 0.2 : 0, // Only use validation for larger datasets
      verbose: 0
    });
    
    // Save normalization parameters in the model for prediction
    model.featureMean = featureMean;
    model.featureStd = featureStd;
    model.labelMean = labelMean;
    model.labelStd = labelStd;
    
    return model;
  } catch (error) {
    console.error('Error training model:', error);
    return createFallbackModel();
  }
}

/**
 * Creates a basic fallback model when there isn't enough data
 * @returns {Object} A simple model that can make basic predictions
 */
function createFallbackModel() {
  console.log('Creating fallback model for predictions');
  // This is not a real TF model but a simple object with a predict method
  // that returns small random values around a baseline
  return {
    predict: (inputs) => {
      const numPredictions = inputs.shape ? inputs.shape[0] : 1;
      // Return small random values (between 0 and 100)
      return tf.tidy(() => {
        // Generate small non-negative random values
        return tf.randomUniform([numPredictions, 1], 0, 100);
      });
    },
    // Dummy normalization values
    featureMean: tf.tensor1d([0, 0, 0, 0]),
    featureStd: tf.tensor1d([1, 1, 1, 1]),
    labelMean: tf.scalar(0),
    labelStd: tf.scalar(1)
  };
}

/**
 * Makes predictions using the trained model
 * @param {tf.Sequential} model - Trained TensorFlow model
 * @param {Array} inputData - Input data for prediction
 * @returns {Array} Predicted values
 */
export function makePredictions(model, inputData) {
  if (!model) return Array(inputData.length).fill(0); // Return zeros if no model
  if (!inputData || inputData.length === 0) return [];
  
  try {
    // Apply the same normalization as during training
    const inputTensor = tf.tensor2d(inputData);
    const normalizedInput = inputTensor.sub(model.featureMean).div(model.featureStd);
    
    // Make predictions
    const normalizedPredictions = model.predict(normalizedInput);
    
    // Denormalize predictions
    const predictions = normalizedPredictions
      .mul(model.labelStd)
      .add(model.labelMean);
    
    // Convert to array and ensure non-negative values
    return Array.from(predictions.dataSync()).map(val => Math.max(0, val));
  } catch (error) {
    console.error('Prediction error:', error);
    // Return small non-negative random values as fallback
    return Array(inputData.length).fill(0).map(() => Math.random() * 50);
  }
}

/**
 * Analyzes seasonal patterns in the order data
 * @param {Array} orderData - Raw order data from Supabase
 * @returns {Object} Seasonal analysis results
 */
export function analyzeSeasonalPatterns(orderData) {
  if (!orderData || orderData.length === 0) {
    return { 
      dailyTrends: [], 
      monthlyTrends: [], 
      quarterlyTrends: [],
      insights: {
        bestDay: { name: 'N/A', value: 0 },
        bestMonth: { name: 'N/A', value: 0 },
        bestQuarter: { name: 'N/A', value: 0 }
      }
    };
  }
  
  // Initialize counters
  const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
  const dayRevenue = [0, 0, 0, 0, 0, 0, 0];
  const monthCount = Array(12).fill(0); // Jan to Dec
  const monthRevenue = Array(12).fill(0);
  const quarterCount = [0, 0, 0, 0]; // Q1 to Q4
  const quarterRevenue = [0, 0, 0, 0];
  
  // Analyze each order
  orderData.forEach(order => {
    const date = new Date(order.created_at);
    const day = date.getDay();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);
    const revenue = order.amount_paid || 0;
    
    dayCount[day]++;
    dayRevenue[day] += revenue;
    
    monthCount[month]++;
    monthRevenue[month] += revenue;
    
    quarterCount[quarter]++;
    quarterRevenue[quarter] += revenue;
  });
  
  // Calculate averages
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dailyTrends = dayNames.map((name, i) => ({
    name,
    count: dayCount[i],
    revenue: dayRevenue[i],
    average: dayCount[i] > 0 ? dayRevenue[i] / dayCount[i] : 0
  }));
  
  const monthlyTrends = monthNames.map((name, i) => ({
    name,
    count: monthCount[i],
    revenue: monthRevenue[i],
    average: monthCount[i] > 0 ? monthRevenue[i] / monthCount[i] : 0
  }));
  
  const quarterlyTrends = [1, 2, 3, 4].map((num, i) => ({
    name: `Q${num}`,
    count: quarterCount[i],
    revenue: quarterRevenue[i],
    average: quarterCount[i] > 0 ? quarterRevenue[i] / quarterCount[i] : 0
  }));
  
  // Find best performers
  const bestDay = dailyTrends.reduce((best, day) => 
    day.revenue > best.value ? { name: day.name, value: day.revenue } : best, 
    { name: 'N/A', value: 0 }
  );
  
  const bestMonth = monthlyTrends.reduce((best, month) => 
    month.revenue > best.value ? { name: month.name, value: month.revenue } : best, 
    { name: 'N/A', value: 0 }
  );
  
  const bestQuarter = quarterlyTrends.reduce((best, quarter) => 
    quarter.revenue > best.value ? { name: quarter.name, value: quarter.revenue } : best, 
    { name: 'N/A', value: 0 }
  );
  
  return {
    dailyTrends,
    monthlyTrends,
    quarterlyTrends,
    insights: {
      bestDay,
      bestMonth,
      bestQuarter
    }
  };
}

/**
 * Analyzes customer demand patterns in the order data
 * @param {Array} orderData - Raw order data from Supabase
 * @returns {Object} Customer demand analysis
 */
export function analyzeCustomerDemand(orderData) {
  if (!orderData || orderData.length === 0) {
    return { 
      uniformTypeCount: {},
      uniformTypeRevenue: {},
      uniformTypePercentage: {},
      courseDistribution: {},
      genderDistribution: {},
      insights: {
        mostPopularUniform: 'N/A',
        mostPopularCourse: 'N/A',
        dominantGender: 'N/A'
      }
    };
  }
  
  // Initialize counters
  const uniformTypeCount = {};
  const uniformTypeRevenue = {};
  const courseDistribution = {};
  const genderCount = { male: 0, female: 0 };
  let totalOrders = 0;
  
  // Analyze each order
  orderData.forEach(order => {
    totalOrders++;
    const uniformType = order.uniform_type?.toLowerCase() || 'unknown';
    const revenue = order.amount_paid || 0;
    
    // Track uniform types
    if (!uniformTypeCount[uniformType]) {
      uniformTypeCount[uniformType] = 0;
      uniformTypeRevenue[uniformType] = 0;
    }
    uniformTypeCount[uniformType]++;
    uniformTypeRevenue[uniformType] += revenue;
    
    // Track course distribution
    if (order.students?.courses?.course_code) {
      const courseCode = order.students.courses.course_code;
      if (!courseDistribution[courseCode]) {
        courseDistribution[courseCode] = 0;
      }
      courseDistribution[courseCode]++;
    }
    
    // Track gender distribution
    if (order.students?.gender) {
      const gender = order.students.gender.toLowerCase();
      if (gender === 'male' || gender === 'female') {
        genderCount[gender]++;
      }
    }
  });
  
  // Calculate percentages
  const uniformTypePercentage = {};
  Object.keys(uniformTypeCount).forEach(type => {
    uniformTypePercentage[type] = (uniformTypeCount[type] / totalOrders) * 100;
  });
  
  // Find insights
  const mostPopularUniform = Object.entries(uniformTypeCount)
    .reduce((max, [type, count]) => 
      count > max.count ? { type, count } : max, 
      { type: 'N/A', count: 0 }
    ).type;
    
  const mostPopularCourse = Object.entries(courseDistribution)
    .reduce((max, [course, count]) => 
      count > max.count ? { course, count } : max, 
      { course: 'N/A', count: 0 }
    ).course;
    
  const dominantGender = genderCount.male > genderCount.female ? 
    'male' : genderCount.female > genderCount.male ? 
    'female' : 'equal';
  
  return {
    uniformTypeCount,
    uniformTypeRevenue,
    uniformTypePercentage,
    courseDistribution,
    genderDistribution: {
      male: genderCount.male,
      female: genderCount.female,
      malePercentage: totalOrders > 0 ? (genderCount.male / totalOrders) * 100 : 0,
      femalePercentage: totalOrders > 0 ? (genderCount.female / totalOrders) * 100 : 0
    },
    insights: {
      mostPopularUniform,
      mostPopularCourse,
      dominantGender
    }
  };
}

/**
 * Creates a configuration prediction model based on historical data
 * @param {Array} orderData - Raw order data from Supabase
 * @returns {Object} Popular configurations prediction
 */
export function predictPopularConfigurations(orderData) {
  if (!orderData || orderData.length === 0) {
    return {
      popularConfigs: [],
      trendingConfigs: []
    };
  }
  
  // Extract configurations
  const configs = orderData
    .filter(order => order.uniform_type && order.students?.gender && order.students?.courses?.course_code)
    .map(order => ({
      uniformType: order.uniform_type?.toLowerCase(),
      gender: order.students?.gender?.toLowerCase(),
      course: order.students?.courses?.course_code,
      date: new Date(order.created_at),
      revenue: order.amount_paid || 0
    }));
  
  if (configs.length === 0) return { popularConfigs: [], trendingConfigs: [] };
  
  // Count configuration occurrences
  const configCounts = {};
  configs.forEach(config => {
    const key = `${config.uniformType}|${config.gender}|${config.course}`;
    if (!configCounts[key]) {
      configCounts[key] = {
        uniformType: config.uniformType,
        gender: config.gender,
        course: config.course,
        count: 0,
        revenue: 0,
        monthlyTrend: Array(12).fill(0)
      };
    }
    configCounts[key].count++;
    configCounts[key].revenue += config.revenue;
    configCounts[key].monthlyTrend[config.date.getMonth()]++;
  });
  
  // Sort by popularity
  const popularConfigs = Object.values(configCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  // Calculate trending configs (those with highest recent growth)
  const now = new Date();
  const currentMonth = now.getMonth();
  const prevMonth = (currentMonth + 11) % 12; // Previous month accounting for year boundary
  
  const trendingConfigs = Object.values(configCounts)
    .map(config => ({
      ...config,
      growth: config.monthlyTrend[currentMonth] - config.monthlyTrend[prevMonth]
    }))
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 5);
  
  return {
    popularConfigs,
    trendingConfigs
  };
}

/**
 * Predicts future order trends using recent data patterns
 * @param {Array} orderData - Raw order data from Supabase
 * @returns {Object} Future trend predictions
 */
export function predictFutureTrends(orderData) {
  if (!orderData || orderData.length === 0) {
    return {
      nextQuarter: { change: 0, trend: 'stable' },
      nextSeason: { peak: 'unknown', estimate: 0 },
      growthOpportunities: []
    };
  }
  
  // Group orders by month to see trends
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentOrders = orderData.filter(o => new Date(o.created_at) >= sixMonthsAgo);
  if (recentOrders.length < 3) {
    // Not enough recent data for meaningful trends
    return {
      nextQuarter: { change: 0, trend: 'stable' },
      nextSeason: { peak: 'unknown', estimate: 0 },
      growthOpportunities: []
    };
  }
  
  // Group by month
  const monthlyRevenue = {};
  recentOrders.forEach(order => {
    const yearMonth = new Date(order.created_at).toISOString().substr(0, 7); // YYYY-MM format
    if (!monthlyRevenue[yearMonth]) monthlyRevenue[yearMonth] = 0;
    monthlyRevenue[yearMonth] += order.amount_paid || 0;
  });
  
  // Calculate month-to-month growth rates
  const sortedMonths = Object.keys(monthlyRevenue).sort();
  const growthRates = [];
  
  for (let i = 1; i < sortedMonths.length; i++) {
    const prevRevenue = monthlyRevenue[sortedMonths[i-1]];
    const currRevenue = monthlyRevenue[sortedMonths[i]];
    if (prevRevenue > 0) {
      growthRates.push((currRevenue - prevRevenue) / prevRevenue);
    }
  }
  
  // Calculate average growth rate
  const avgGrowthRate = growthRates.length > 0 
    ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
    : 0;
  
  // Project next quarter growth
  const lastMonthRevenue = sortedMonths.length > 0 ? monthlyRevenue[sortedMonths[sortedMonths.length - 1]] : 0;
  const nextQuarterRevenue = lastMonthRevenue * Math.pow(1 + avgGrowthRate, 3); // Compound 3 months
  const change = nextQuarterRevenue - lastMonthRevenue;
  
  // Determine trend direction
  let trend = 'stable';
  if (avgGrowthRate > 0.05) trend = 'growing';
  else if (avgGrowthRate < -0.05) trend = 'declining';
  
  // Find course and uniform type with highest growth
  const courseGrowth = analyzeCourseGrowth(recentOrders);
  const uniformGrowth = analyzeUniformGrowth(recentOrders);
  
  // Find seasonal patterns
  const { seasonalAnalysis } = analyzeSeasonalPatterns(orderData);
  const currentMonth = new Date().getMonth();
  
  // Determine next peak season
  // Simple approach: check which of the next 3 months historically had highest revenue
  const nextMonths = [currentMonth + 1, currentMonth + 2, currentMonth + 3].map(m => m % 12);
  let peakMonth = 0;
  let peakValue = -1;
  
  nextMonths.forEach(month => {
    const monthData = seasonalAnalysis?.monthlyTrends[month];
    if (monthData && monthData.revenue > peakValue) {
      peakValue = monthData.revenue;
      peakMonth = month;
    }
  });
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    nextQuarter: {
      change,
      trend,
      estimated: nextQuarterRevenue
    },
    nextSeason: {
      peak: monthNames[peakMonth],
      estimate: peakValue
    },
    growthOpportunities: [
      ...courseGrowth.map(c => `${c.course} course enrollment (${(c.growth * 100).toFixed(1)}% growth)`),
      ...uniformGrowth.map(u => `${u.type} uniform orders (${(u.growth * 100).toFixed(1)}% growth)`)
    ].slice(0, 3) // Top 3 opportunities
  };
}

/**
 * Analyzes course enrollment growth
 */
function analyzeCourseGrowth(orders) {
  const recent = new Date();
  recent.setMonth(recent.getMonth() - 3);
  const older = new Date();
  older.setMonth(older.getMonth() - 6);
  
  const recentOrders = orders.filter(o => new Date(o.created_at) >= recent);
  const olderOrders = orders.filter(o => 
    new Date(o.created_at) >= older && 
    new Date(o.created_at) < recent
  );
  
  // Count courses in each time period
  const recentCourses = {};
  const olderCourses = {};
  
  recentOrders.forEach(order => {
    if (order.students?.courses?.course_code) {
      const course = order.students.courses.course_code;
      recentCourses[course] = (recentCourses[course] || 0) + 1;
    }
  });
  
  olderOrders.forEach(order => {
    if (order.students?.courses?.course_code) {
      const course = order.students.courses.course_code;
      olderCourses[course] = (olderCourses[course] || 0) + 1;
    }
  });
  
  // Calculate growth rates
  const growthRates = [];
  Object.keys(recentCourses).forEach(course => {
    const recentCount = recentCourses[course];
    const olderCount = olderCourses[course] || 0;
    
    if (olderCount > 0) {
      growthRates.push({
        course,
        growth: (recentCount - olderCount) / olderCount
      });
    } else if (recentCount > 0) {
      growthRates.push({
        course,
        growth: 1.0 // 100% growth (new course)
      });
    }
  });
  
  return growthRates.sort((a, b) => b.growth - a.growth);
}

/**
 * Analyzes uniform type growth
 */
function analyzeUniformGrowth(orders) {
  const recent = new Date();
  recent.setMonth(recent.getMonth() - 3);
  const older = new Date();
  older.setMonth(older.getMonth() - 6);
  
  const recentOrders = orders.filter(o => new Date(o.created_at) >= recent);
  const olderOrders = orders.filter(o => 
    new Date(o.created_at) >= older && 
    new Date(o.created_at) < recent
  );
  
  // Count uniform types in each time period
  const recentTypes = {};
  const olderTypes = {};
  
  recentOrders.forEach(order => {
    const type = order.uniform_type || 'unknown';
    recentTypes[type] = (recentTypes[type] || 0) + 1;
  });
  
  olderOrders.forEach(order => {
    const type = order.uniform_type || 'unknown';
    olderTypes[type] = (olderTypes[type] || 0) + 1;
  });
  
  // Calculate growth rates
  const growthRates = [];
  Object.keys(recentTypes).forEach(type => {
    const recentCount = recentTypes[type];
    const olderCount = olderTypes[type] || 0;
    
    if (olderCount > 0) {
      growthRates.push({
        type,
        growth: (recentCount - olderCount) / olderCount
      });
    } else if (recentCount > 0) {
      growthRates.push({
        type,
        growth: 1.0 // 100% growth (new type)
      });
    }
  });
  
  return growthRates.sort((a, b) => b.growth - a.growth);
}

/**
 * Predicts inventory needs based on historical data and trends
 * @param {Array} orderData - Raw order data from Supabase
 * @returns {Object} Inventory recommendations
 */
export function predictInventoryNeeds(orderData) {
  if (!orderData || orderData.length === 0) {
    return {
      recommendedStock: {},
      potentialShortages: [],
      surplusRisk: []
    };
  }
  
  // Get the recent order distribution by uniform type and course
  const typeDistribution = {};
  const courseTypeDistribution = {};
  
  // Get orders from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentOrders = orderData.filter(o => new Date(o.created_at) >= threeMonthsAgo);
  
  if (recentOrders.length === 0) return { recommendedStock: {}, potentialShortages: [], surplusRisk: [] };
  
  recentOrders.forEach(order => {
    const type = order.uniform_type || 'unknown';
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    
    if (order.students?.courses?.course_code) {
      const course = order.students.courses.course_code;
      const courseType = `${course}-${type}`;
      courseTypeDistribution[courseType] = (courseTypeDistribution[courseType] || 0) + 1;
    }
  });
  
  // Calculate monthly rates
  const monthlyRate = {};
  Object.entries(typeDistribution).forEach(([type, count]) => {
    monthlyRate[type] = count / 3; // Average per month
  });
  
  // Project for next 2 months with 20% buffer
  const recommendedStock = {};
  Object.entries(monthlyRate).forEach(([type, rate]) => {
    recommendedStock[type] = Math.ceil(rate * 2 * 1.2); // 2 months with 20% buffer
  });
  
  // Identify potentially growing types (from growth analysis)
  const uniformGrowth = analyzeUniformGrowth(orderData);
  const growingTypes = uniformGrowth
    .filter(g => g.growth > 0.1) // More than 10% growth
    .map(g => g.type);
  
  // Increase stock for growing types
  growingTypes.forEach(type => {
    if (recommendedStock[type]) {
      recommendedStock[type] = Math.ceil(recommendedStock[type] * 1.3); // 30% more for growing types
    }
  });
  
  // Identify potential shortages and surplus risks
  const potentialShortages = [];
  const surplusRisk = [];
  
  // For this example, we'll base it on growth trends
  uniformGrowth.forEach(g => {
    if (g.growth > 0.2) { // High growth creates potential shortage
      potentialShortages.push({
        type: g.type,
        growth: g.growth,
        recommended: recommendedStock[g.type] || 0
      });
    } else if (g.growth < -0.1) { // Declining creates surplus risk
      surplusRisk.push({
        type: g.type,
        decline: -g.growth,
        caution: recommendedStock[g.type] || 0
      });
    }
  });
  
  return {
    recommendedStock,
    potentialShortages: potentialShortages.slice(0, 3), // Top 3
    surplusRisk: surplusRisk.slice(0, 3) // Top 3
  };
}
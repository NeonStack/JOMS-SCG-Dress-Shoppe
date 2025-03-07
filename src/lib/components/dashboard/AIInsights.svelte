<script>
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto';
  import { fade, fly } from 'svelte/transition';
  
  export let aiData = null;
  export let loading = true;
  
  let revenueChartEl;
  let revenueChart;
  let showDetails = false;
  let selectedTab = 'revenue';
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };
  
  $: if (aiData && revenueChartEl) {
    initRevenueChart();
  }
  
  function initRevenueChart() {
    if (revenueChart) revenueChart.destroy();
    if (!revenueChartEl || !aiData?.predictions) return;
    
    const labels = aiData.predictions.map(p => p.date);
    const data = aiData.predictions.map(p => p.predicted);
    
    revenueChart = new Chart(revenueChartEl, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Predicted Revenue',
          data,
          borderColor: '#B73233',
          backgroundColor: 'rgba(183, 50, 51, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Revenue: ${formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { 
              maxTicksLimit: 7,
              callback: function(val, index) {
                const date = this.getLabelForValue(val);
                return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      }
    });
  }
  
  function toggleDetails() {
    showDetails = !showDetails;
  }
  
  function getTotalPredictedRevenue() {
    if (!aiData?.predictions) return '0.00';
    return aiData.predictions.reduce((sum, p) => sum + p.predicted, 0).toFixed(2);
  }
  
  function getConfidenceClass(score) {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
  
  function getInventoryRecommendations() {
    if (!aiData?.inventoryNeeds?.recommendedStock) return [];
    
    return Object.entries(aiData.inventoryNeeds.recommendedStock)
      .map(([type, qty]) => ({ type, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  }
</script>

<div class="bg-white/90 p-6 rounded-2xl shadow-lg border">
  <div class="flex justify-between items-center mb-4">
    <div class="flex items-center gap-2">
      <div class="p-2 bg-primary/10 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
        </svg>
      </div>
      <h2 class="text-xl font-bold">AI Business Insights</h2>
    </div>
    
    <button 
      on:click={toggleDetails}
      class="text-primary hover:underline flex items-center text-sm"
    >
      {showDetails ? 'Hide Details' : 'View Details'}
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={showDetails ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    </button>
  </div>
  
  {#if loading}
    <div class="flex justify-center items-center h-64" in:fade>
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-3"></div>
        <p class="text-gray-500">Loading AI predictions...</p>
      </div>
    </div>
  {:else if !aiData || !aiData.success}
    <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200" in:fade>
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">AI insights unavailable</h3>
          <p class="mt-2 text-sm text-yellow-700">
            Unable to generate business insights. Please try again later.
          </p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Summary cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" in:fade={{ delay: 200 }}>
      <!-- Predicted revenue card -->
      <div class="bg-gray-50 p-4 rounded-lg border">
        <p class="text-sm text-gray-500">30-Day Predicted Revenue</p>
        <p class="text-2xl font-bold text-primary mt-1">
          {formatCurrency(getTotalPredictedRevenue())}
        </p>
        <p class="text-xs text-gray-500 mt-2">
          Based on {aiData.dataQuality.dataPoints} data points
        </p>
      </div>
      
      <!-- Best performing day/month -->
      <div class="bg-gray-50 p-4 rounded-lg border">
        <p class="text-sm text-gray-500">Best Performance</p>
        <div class="flex gap-2 items-center mt-1">
          <div>
            <span class="block text-lg font-bold">
              {aiData.insights.topPerforming.day}
            </span>
            <span class="text-xs text-gray-500">Top day</span>
          </div>
          <div class="text-gray-300">|</div>
          <div>
            <span class="block text-lg font-bold">
              {aiData.insights.topPerforming.month}
            </span>
            <span class="text-xs text-gray-500">Top month</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          Based on historical performance analysis
        </p>
      </div>
      
      <!-- Data quality / confidence -->
      <div class="bg-gray-50 p-4 rounded-lg border">
        <p class="text-sm text-gray-500">Prediction Confidence</p>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-2xl font-bold">{aiData.dataQuality.confidenceScore}%</p>
          <span class={`text-xs px-2 py-1 rounded-full ${getConfidenceClass(aiData.dataQuality.confidenceScore)}`}>
            {aiData.dataQuality.confidenceScore >= 70 ? 'High' : 
             aiData.dataQuality.confidenceScore >= 40 ? 'Medium' : 'Low'}
          </span>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          {aiData.dataQuality.recommendation}
        </p>
      </div>
    </div>
    
    <!-- Tab navigation for detailed view -->
    {#if showDetails}
      <div in:fade={{ delay: 300 }}>
        <div class="border-b border-gray-200 mb-4">
          <nav class="-mb-px flex space-x-6">
            <button 
              class={`pb-3 px-1 border-b-2 ${selectedTab === 'revenue' ? 'border-primary text-primary' : 'border-transparent text-gray-500'} hover:text-gray-700 whitespace-nowrap text-sm font-medium`}
              on:click={() => selectedTab = 'revenue'}
            >
              Revenue Forecast
            </button>
            <button 
              class={`pb-3 px-1 border-b-2 ${selectedTab === 'trends' ? 'border-primary text-primary' : 'border-transparent text-gray-500'} hover:text-gray-700 whitespace-nowrap text-sm font-medium`}
              on:click={() => selectedTab = 'trends'}
            >
              Market Trends
            </button>
            <button 
              class={`pb-3 px-1 border-b-2 ${selectedTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-gray-500'} hover:text-gray-700 whitespace-nowrap text-sm font-medium`}
              on:click={() => selectedTab = 'inventory'}
            >
              Inventory Planning
            </button>
          </nav>
        </div>
        
        <!-- Tab content -->
        <div class="min-h-[300px]">
          {#if selectedTab === 'revenue'}
            <div class="h-64 mb-4">
              <canvas bind:this={revenueChartEl}></canvas>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Daily Revenue Prediction</h4>
                <div class="space-y-2 max-h-36 overflow-y-auto">
                  {#each aiData.predictions.slice(0, 7) as prediction}
                    <div class="flex justify-between text-sm">
                      <span>{prediction.day}, {new Date(prediction.date).toLocaleDateString()}</span>
                      <span class="font-medium">{formatCurrency(prediction.predicted)}</span>
                    </div>
                  {/each}
                  {#if aiData.predictions.length > 7}
                    <div class="text-xs text-center text-gray-500">+ {aiData.predictions.length - 7} more days</div>
                  {/if}
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Next Quarter Outlook</h4>
                {#if aiData.futureTrends?.nextQuarter}
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-sm">Estimated Revenue</span>
                      <span class="font-medium">{formatCurrency(aiData.futureTrends.nextQuarter.estimated)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm">Projected Change</span>
                      <span class={aiData.futureTrends.nextQuarter.change > 0 ? 'text-green-600' : aiData.futureTrends.nextQuarter.change < 0 ? 'text-red-600' : 'text-gray-600'}>
                        {aiData.futureTrends.nextQuarter.change > 0 ? '+' : ''}
                        {formatCurrency(aiData.futureTrends.nextQuarter.change)}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm">Trend</span>
                      <span class={`px-2 py-0.5 text-xs rounded-full ${
                        aiData.futureTrends.nextQuarter.trend === 'growing' ? 'bg-green-100 text-green-800' : 
                        aiData.futureTrends.nextQuarter.trend === 'declining' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {aiData.futureTrends.nextQuarter.trend.charAt(0).toUpperCase() + aiData.futureTrends.nextQuarter.trend.slice(1)}
                      </span>
                    </div>
                  </div>
                {:else}
                  <p class="text-sm text-gray-500">Insufficient data for quarterly predictions</p>
                {/if}
              </div>
            </div>
          {:else if selectedTab === 'trends'}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Customer Demographics -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Customer Insights</h4>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm">Popular Uniform</span>
                    <span class="font-medium capitalize">{aiData.insights.demand.popularUniform}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm">Popular Course</span>
                    <span class="font-medium">{aiData.insights.demand.popularCourse}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm">Gender Distribution</span>
                    <span class="font-medium capitalize">{aiData.insights.demand.dominantGender}</span>
                  </div>
                </div>
              </div>
              
              <!-- Seasonal Patterns -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Seasonal Insights</h4>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm">Peak Season</span>
                    <span class="font-medium">{aiData.futureTrends?.nextSeason?.peak || 'Unknown'}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm">Estimated Peak Revenue</span>
                    <span class="font-medium">
                      {aiData.futureTrends?.nextSeason?.estimate ? 
                        formatCurrency(aiData.futureTrends.nextSeason.estimate) : 
                        'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Growth Opportunities -->
              <div class="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Growth Opportunities</h4>
                {#if aiData.futureTrends?.growthOpportunities?.length > 0}
                  <ul class="space-y-2">
                    {#each aiData.futureTrends.growthOpportunities as opportunity}
                      <li class="text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
                        </svg>
                        {opportunity}
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <p class="text-sm text-gray-500">No significant growth opportunities identified</p>
                {/if}
              </div>
            </div>
          {:else if selectedTab === 'inventory'}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Recommended Stock Levels -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Recommended Stock</h4>
                {#if getInventoryRecommendations().length > 0}
                  <div class="space-y-2">
                    {#each getInventoryRecommendations() as item}
                      <div class="flex justify-between items-center">
                        <span class="text-sm capitalize">{item.type}</span>
                        <span class="font-medium">{item.qty} units</span>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-sm text-gray-500">No stock recommendations available</p>
                {/if}
              </div>
              
              <!-- Potential Shortages -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Risk Analysis</h4>
                {#if aiData.inventoryNeeds?.potentialShortages?.length > 0}
                  <div class="mb-3">
                    <p class="text-xs text-red-600 font-medium mb-1">Potential Shortages</p>
                    {#each aiData.inventoryNeeds.potentialShortages as shortage}
                      <div class="flex justify-between items-center text-sm">
                        <span class="capitalize">{shortage.type}</span>
                        <span class="text-red-600">+{(shortage.growth * 100).toFixed(1)}% demand</span>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                {#if aiData.inventoryNeeds?.surplusRisk?.length > 0}
                  <div>
                    <p class="text-xs text-yellow-600 font-medium mb-1">Surplus Risk</p>
                    {#each aiData.inventoryNeeds.surplusRisk as surplus}
                      <div class="flex justify-between items-center text-sm">
                        <span class="capitalize">{surplus.type}</span>
                        <span class="text-yellow-600">-{(surplus.decline * 100).toFixed(1)}% demand</span>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                {#if aiData.inventoryNeeds?.potentialShortages?.length === 0 && aiData.inventoryNeeds?.surplusRisk?.length === 0}
                  <p class="text-sm text-gray-500">No significant inventory risks detected</p>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Simple chart view when details are hidden -->
      <div class="h-64" in:fade>
        <canvas bind:this={revenueChartEl}></canvas>
      </div>
    {/if}
  {/if}
</div>

<style>

</style>
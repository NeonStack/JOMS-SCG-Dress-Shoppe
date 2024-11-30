import { error, fail } from '@sveltejs/kit';

const getDateRanges = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const last12Months = new Date(now.setMonth(now.getMonth() - 12)).toISOString();
    
    return { today, thisWeekStart, thisMonthStart, thisYearStart, last12Months };
};

function calculateCompletionRate(orders) {
    if (!orders?.length) return 0;
    const completed = orders.filter(o => o.status === 'completed').length;
    return ((completed / orders.length) * 100).toFixed(2);
}

function calculateOrderTurnover(orders) {
    if (!orders?.length) return 0;
    const completedOrders = orders.filter(o => o.status === 'completed');
    return {
        daily: completedOrders.length / 30, // Average daily completion
        weekly: completedOrders.length / 4, // Average weekly completion
        monthly: completedOrders.length // Monthly completion
    };
}

function calculateAverageOrderValue(orders) {
    if (!orders?.length) return 0;
    const totalValue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    return (totalValue / orders.length).toFixed(2);
}

function calculateRevenueByStatus(orders) {
    return orders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + (order.amount_paid || 0);
        return acc;
    }, {}) || {};
}

function calculateCoursePerformance(orders) {
    return orders?.reduce((acc, order) => {
        const courseCode = order.students?.courses?.course_code;
        if (!courseCode) return acc;
        
        if (!acc[courseCode]) {
            acc[courseCode] = {
                totalOrders: 0,
                completedOrders: 0,
                totalRevenue: 0,
                averageCompletion: 0
            };
        }
        
        acc[courseCode].totalOrders++;
        if (order.status === 'completed') acc[courseCode].completedOrders++;
        acc[courseCode].totalRevenue += order.amount_paid || 0;
        
        return acc;
    }, {}) || {};
}

function calculateEnrollmentTrends(students) {
    return students?.reduce((acc, student) => {
        const month = new Date(student.created_at).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {}) || {};
}

function calculateGenderDistributionByCourse(students) {
    return students?.reduce((acc, student) => {
        const courseCode = student.courses?.course_code;
        if (!courseCode) return acc;
        
        if (!acc[courseCode]) {
            acc[courseCode] = { male: 0, female: 0 };
        }
        
        acc[courseCode][student.gender]++;
        return acc;
    }, {}) || {};
}

function calculateEmployeeEfficiency(orders) {
    const employeeStats = orders?.reduce((acc, order) => {
        if (!order.profiles) return acc;
        const name = `${order.profiles.first_name} ${order.profiles.last_name}`;
        
        if (!acc[name]) {
            acc[name] = {
                totalOrders: 0,
                completedOnTime: 0,
                averageCompletionTime: 0
            };
        }
        
        acc[name].totalOrders++;
        if (order.status === 'completed') {
            if (new Date(order.updated_at) <= new Date(order.due_date)) {
                acc[name].completedOnTime++;
            }
            acc[name].averageCompletionTime += getDateDiff(order.created_at, order.updated_at);
        }
        
        return acc;
    }, {}) || {};

    // Calculate averages
    Object.values(employeeStats).forEach(stats => {
        stats.averageCompletionTime = (stats.averageCompletionTime / stats.totalOrders).toFixed(1);
        stats.efficiencyRate = ((stats.completedOnTime / stats.totalOrders) * 100).toFixed(2);
    });

    return employeeStats;
}

function calculateQualityMetrics(orders) {
    const completed = orders?.filter(o => o.status === 'completed') || [];
    return {
        onTimeDelivery: ((completed.filter(o => 
            new Date(o.updated_at) <= new Date(o.due_date)
        ).length / completed.length) * 100).toFixed(2),
        averageProcessingTime: calculateAverageCompletionTime(completed),
        orderAccuracy: 100 // Placeholder - would need actual data about order accuracy
    };
}

function calculateSeasonalTrends(orders) {
    return orders?.reduce((acc, order) => {
        const month = new Date(order.created_at).getMonth();
        const season = getSeason(month);
        acc[season] = (acc[season] || 0) + 1;
        return acc;
    }, {}) || {};
}

function getSeason(month) {
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
}

function identifyPeakOrderTimes(orders) {
    return orders?.reduce((acc, order) => {
        const hour = new Date(order.created_at).getHours();
        const timeSlot = getTimeSlot(hour);
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
    }, {}) || {};
}

function getTimeSlot(hour) {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
}

export const load = async ({ locals }) => {
    try {
        const { today, thisWeekStart, thisMonthStart, thisYearStart, last12Months } = getDateRanges();
        const next7Days = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const promises = [
            // Basic Statistics
            locals.supabase.from('students').select('*', { count: 'exact', head: true }),
            locals.supabase.from('orders').select('*', { count: 'exact', head: true }),
            
            // Enhanced Order Analytics
            locals.supabase.from('orders').select(`
                id,
                status,
                uniform_type,
                total_amount,
                amount_paid,
                balance,
                payment_status,
                created_at,
                completed_at,
                payment_date,
                due_date,
                updated_at,
                students!inner(
                    id,
                    gender,
                    first_name,
                    last_name,
                    courses(
                        course_code,
                        description
                    )
                ),
                profiles(
                    first_name,
                    last_name
                )
            `).gte('created_at', last12Months),

            // Additional Analytics
            locals.supabase.from('orders').select(`
                id,
                status,
                payment_status,
                amount_paid,
                balance,
                due_date,
                created_at,
                completed_at,
                students(
                    courses(course_code)
                )
            `).lte('due_date', next7Days).neq('status', 'completed'),

            // Student Demographics with Course Info
            locals.supabase.from('students').select(`
                id,
                gender,
                created_at,
                courses(
                    course_code,
                    description
                )
            `),

            // Employee Performance
            locals.supabase.from('orders').select(`
                employee_id,
                status,
                created_at,
                total_amount,
                profiles!inner(
                    first_name,
                    last_name
                )
            `).not('employee_id', 'is', null),

            // Payment Analytics
            locals.supabase.from('orders').select(`
                payment_status,
                total_amount,
                amount_paid,
                balance,
                created_at
            `).gte('created_at', thisYearStart)
        ];

        const [
            { count: totalStudents },
            { count: totalOrders },
            { data: orderData },
            { data: upcomingDueOrders },
            { data: studentData },
            { data: employeeData },
            { data: paymentData }
        ] = await Promise.all(promises);

        // Process order data for financial metrics
        const actualRevenue = orderData?.reduce((sum, o) => sum + (o.amount_paid || 0), 0) || 0;
        const pendingRevenue = orderData?.reduce((sum, o) => sum + (o.balance || 0), 0) || 0;

        // Calculate various statistics
        const processedData = {
            basicStats: {
                totalStudents,
                totalOrders,
                completionRate: calculateCompletionRate(orderData),
                totalRevenue: orderData?.reduce((sum, order) => sum + (Number(order.amount_paid) || 0), 0) || 0
            },

            orderMetrics: {
                byStatus: processOrderMetrics(orderData),
                byType: orderData?.reduce((acc, curr) => {
                    acc[curr.uniform_type] = (acc[curr.uniform_type] || 0) + 1;
                    return acc;
                }, {}),
                byPaymentStatus: orderData?.reduce((acc, curr) => {
                    acc[curr.payment_status] = (acc[curr.payment_status] || 0) + 1;
                    return acc;
                }, {}),
                urgentOrders: {
                    dueNext7Days: upcomingDueOrders?.length || 0,
                    overdueCount: orderData?.filter(o => 
                        new Date(o.due_date) < new Date() && 
                        o.status !== 'completed'
                    ).length || 0,
                    criticalOrders: upcomingDueOrders?.filter(o => 
                        new Date(o.due_date) <= new Date(today)
                    ).length || 0
                },
                orderTurnover: calculateOrderTurnover(orderData),
                recentOrders: getRecentOrders(orderData)
            },

            financialMetrics: {
                totalCollected: paymentData?.reduce((sum, o) => sum + o.amount_paid, 0) || 0,
                totalPending: paymentData?.reduce((sum, o) => sum + o.balance, 0) || 0,
                averageBalance: (paymentData?.reduce((sum, o) => sum + o.balance, 0) || 0) / (paymentData?.length || 1),
                paymentCompletion: ((paymentData?.filter(o => o.payment_status === 'fully paid').length || 0) / (paymentData?.length || 1) * 100).toFixed(2),
                monthlyRevenue: paymentData?.reduce((acc, curr) => {
                    const month = new Date(curr.created_at).toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + curr.amount_paid;
                    return acc;
                }, {}),
                revenueByMonth: calculateMonthlyRevenue(orderData),
                revenueByQuarter: calculateQuarterlyRevenue(orderData),
                paymentStats: {
                    fullyPaid: orderData?.filter(o => o.payment_status === 'fully paid').length || 0,
                    partial: orderData?.filter(o => o.payment_status === 'partial').length || 0,
                    notPaid: orderData?.filter(o => o.payment_status === 'not paid').length || 0
                },
                averageOrderValue: calculateAverageOrderValue(orderData),
                revenueByStatus: calculateRevenueByStatus(orderData),
                revenueOverTime: calculateRevenueOverTime(orderData),
            },

            studentAnalytics: {
                genderDistribution: studentData?.reduce((acc, curr) => {
                    acc[curr.gender] = (acc[curr.gender] || 0) + 1;
                    return acc;
                }, {}),
                courseEnrollment: studentData?.reduce((acc, curr) => {
                    const course = curr.courses?.course_code;
                    if (course) acc[course] = (acc[course] || 0) + 1;
                    return acc;
                }, {}),
                monthlyEnrollment: studentData?.reduce((acc, curr) => {
                    const month = new Date(curr.created_at).toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {}),
                coursePerformance: calculateCoursePerformance(orderData),
                enrollmentTrends: calculateEnrollmentTrends(studentData),
                genderByProgram: calculateGenderDistributionByCourse(studentData)
            },

            performanceMetrics: {
                employeeStats: calculateEmployeeStats(employeeData),
                topPerformers: Object.entries(employeeData?.reduce((acc, curr) => {
                    const name = `${curr.profiles.first_name} ${curr.profiles.last_name}`;
                    acc[name] = (acc[name] || 0) + (curr.status === 'completed' ? 1 : 0);
                    return acc;
                }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
                employeeEfficiency: calculateEmployeeEfficiency(orderData),
                qualityMetrics: calculateQualityMetrics(orderData)
            },

            timeBasedMetrics: {
                overdueOrders: orderData?.filter(o => new Date(o.due_date) < new Date() && o.status !== 'completed').length || 0,
                upcomingDue: orderData?.filter(o => {
                    const dueDate = new Date(o.due_date);
                    const now = new Date();
                    const diff = (dueDate - now) / (1000 * 60 * 60 * 24);
                    return diff > 0 && diff <= 7;
                }).length || 0,
                averageCompletionTime: calculateAverageCompletionTime(orderData),
                busyDays: orderData?.reduce((acc, curr) => {
                    const day = new Date(curr.created_at).toLocaleString('default', { weekday: 'short' });
                    acc[day] = (acc[day] || 0) + 1;
                    return acc;
                }, {}),
                rushOrders: orderData?.filter(o => {
                    const created = new Date(o.created_at);
                    const due = new Date(o.due_date);
                    return (due - created) / (1000 * 60 * 60 * 24) <= 3;
                }).length || 0,
                processingTimes: calculateProcessingTimes(orderData),
                seasonalTrends: calculateSeasonalTrends(orderData),
                peakOrderTimes: identifyPeakOrderTimes(orderData),
                deliveryPerformance: calculateDeliveryPerformance(orderData)
            },

            additionalMetrics: {
                averageOrderValueOverTime: calculateAverageOrderValueOverTime(orderData),
            }
        };

        return processedData;
    } catch (err) {
        console.error('Dashboard data fetch error:', err);
        return {
            basicStats: {},
            orderMetrics: {},
            financialMetrics: {},
            studentAnalytics: {},
            performanceMetrics: {},
            timeBasedMetrics: {}
        };
    }
};

function calculateAverageCompletionTime(orders) {
    if (!orders?.length) return 0;
    const completedOrders = orders.filter(o => o.status === 'completed' && o.completed_at);
    if (!completedOrders.length) return 0;
    
    const totalDays = completedOrders.reduce((sum, order) => {
        const created = new Date(order.created_at);
        const completed = new Date(order.completed_at);
        return sum + (completed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    
    return (totalDays / completedOrders.length).toFixed(1);
}

function calculateMonthlyRevenue(orders) {
    return orders?.reduce((acc, order) => {
        const month = new Date(order.created_at).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + (order.amount_paid || 0);
        return acc;
    }, {}) || {};
}

function calculateQuarterlyRevenue(orders) {
    return orders?.reduce((acc, order) => {
        const quarter = `Q${Math.floor(new Date(order.created_at).getMonth() / 3) + 1}`;
        acc[quarter] = (acc[quarter] || 0) + (order.amount_paid || 0);
        return acc;
    }, {}) || {};
}

function calculateProcessingTimes(orders) {
    const completed = orders?.filter(o => o.status === 'completed' && o.completed_at) || [];
    if (!completed.length) return { average: 0, fastest: 0, slowest: 0 };
    
    const processingTimes = completed.map(o => getDateDiff(o.created_at, o.completed_at));
    
    return {
        average: calculateAverageCompletionTime(completed),
        fastest: Math.min(...processingTimes),
        slowest: Math.max(...processingTimes)
    };
}

function getRecentOrders(orders) {
    return orders
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(order => ({
            student: `${order.students.first_name} ${order.students.last_name}`,
            orderedAt: order.created_at,
            dueDate: order.due_date,
            amount: order.total_amount,
            status: order.status
        })) || [];
}

function calculateDeliveryPerformance(orders) {
    const completed = orders?.filter(o => o.status === 'completed' && o.completed_at) || [];
    if (!completed.length) return { onTime: 0, late: 0, percentOnTime: "0.00" };
    
    const onTime = completed.filter(o => new Date(o.completed_at) <= new Date(o.due_date)).length;
    const late = completed.length - onTime;
    
    return {
        onTime,
        late,
        percentOnTime: ((onTime / completed.length) * 100).toFixed(2)
    };
}

function getDateDiff(date1, date2) {
    return Math.ceil((new Date(date2) - new Date(date1)) / (1000 * 60 * 60 * 24));
}

function calculateAverageOrderValueOverTime(orders) {
    const timeFrames = {
        day: {},
        week: {},
        month: {},
        year: {}
    };

    const now = new Date();
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize data structures with counts
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayKey = date.toISOString().split('T')[0];
        timeFrames.day[dayKey] = { total: 0, count: 0 };
    }

    for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekKey = `${weekDate.getFullYear()}-W${getWeekNumber(weekDate)}`;
        timeFrames.week[weekKey] = { total: 0, count: 0 };
    }

    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        timeFrames.month[monthKey] = { total: 0, count: 0 };
    }

    const currentYear = now.getFullYear();
    for (let year = currentYear - 4; year <= currentYear; year++) {
        timeFrames.year[year.toString()] = { total: 0, count: 0 };
    }

    // Process orders
    orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const amount = Number(order.total_amount) || 0;
        
        const dayKey = orderDate.toISOString().split('T')[0];
        if (timeFrames.day.hasOwnProperty(dayKey)) {
            timeFrames.day[dayKey].total += amount;
            timeFrames.day[dayKey].count += 1;
        }

        const weekKey = `${orderDate.getFullYear()}-W${getWeekNumber(orderDate)}`;
        if (timeFrames.week.hasOwnProperty(weekKey)) {
            timeFrames.week[weekKey].total += amount;
            timeFrames.week[weekKey].count += 1;
        }

        const monthKey = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (timeFrames.month.hasOwnProperty(monthKey)) {
            timeFrames.month[monthKey].total += amount;
            timeFrames.month[monthKey].count += 1;
        }

        const yearKey = orderDate.getFullYear().toString();
        if (timeFrames.year.hasOwnProperty(yearKey)) {
            timeFrames.year[yearKey].total += amount;
            timeFrames.year[yearKey].count += 1;
        }
    });

    // Sort months and calculate averages
    const sortedMonth = {};
    Object.entries(timeFrames.month)
        .sort((a, b) => {
            const [aMonth, aYear] = a[0].split(' ');
            const [bMonth, bYear] = b[0].split(' ');
            if (aYear !== bYear) return Number(aYear) - Number(bYear);
            return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
        })
        .forEach(([key, value]) => {
            sortedMonth[key] = value;
        });
    timeFrames.month = sortedMonth;

    return timeFrames;
}

function calculateRevenueOverTime(orders) {
    const timeFrames = {
        day: {},
        week: {},
        month: {},
        year: {}
    };

    const now = new Date();
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize timeframes
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayKey = date.toISOString().split('T')[0];
        timeFrames.day[dayKey] = { orderRevenue: 0, paymentRevenue: 0 };
    }

    for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekKey = `${weekDate.getFullYear()}-W${getWeekNumber(weekDate)}`;
        timeFrames.week[weekKey] = { orderRevenue: 0, paymentRevenue: 0 };
    }

    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        timeFrames.month[monthKey] = { orderRevenue: 0, paymentRevenue: 0 };
    }

    const currentYear = now.getFullYear();
    for (let year = currentYear - 4; year <= currentYear; year++) {
        timeFrames.year[year.toString()] = { orderRevenue: 0, paymentRevenue: 0 };
    }

    // Process orders
    orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const amount = Number(order.amount_paid) || 0;

        // Add order revenue
        const dayKey = orderDate.toISOString().split('T')[0];
        if (timeFrames.day[dayKey]) {
            timeFrames.day[dayKey].orderRevenue += amount;
        }

        const weekKey = `${orderDate.getFullYear()}-W${getWeekNumber(orderDate)}`;
        if (timeFrames.week[weekKey]) {
            timeFrames.week[weekKey].orderRevenue += amount;
        }

        const monthKey = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (timeFrames.month[monthKey]) {
            timeFrames.month[monthKey].orderRevenue += amount;
        }

        const yearKey = orderDate.getFullYear().toString();
        if (timeFrames.year[yearKey]) {
            timeFrames.year[yearKey].orderRevenue += amount;
        }

        // Add payment revenue if payment exists
        if (amount > 0 && order.payment_date) {
            const paymentDate = new Date(order.payment_date);
            
            const paymentDayKey = paymentDate.toISOString().split('T')[0];
            if (timeFrames.day[paymentDayKey]) {
                timeFrames.day[paymentDayKey].paymentRevenue += amount;
            }

            const paymentWeekKey = `${paymentDate.getFullYear()}-W${getWeekNumber(paymentDate)}`;
            if (timeFrames.week[paymentWeekKey]) {
                timeFrames.week[paymentWeekKey].paymentRevenue += amount;
            }

            const paymentMonthKey = paymentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (timeFrames.month[paymentMonthKey]) {
                timeFrames.month[paymentMonthKey].paymentRevenue += amount;
            }

            const paymentYearKey = paymentDate.getFullYear().toString();
            if (timeFrames.year[paymentYearKey]) {
                timeFrames.year[paymentYearKey].paymentRevenue += amount;
            }
        }
    });

    // Sort months
    const sortedMonth = {};
    Object.entries(timeFrames.month)
        .sort((a, b) => {
            const [aMonth, aYear] = a[0].split(' ');
            const [bMonth, bYear] = b[0].split(' ');
            if (aYear !== bYear) return Number(aYear) - Number(bYear);
            return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
        })
        .forEach(([key, value]) => {
            sortedMonth[key] = value;
        });
    timeFrames.month = sortedMonth;

    return timeFrames;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function processOrderMetrics(orders) {
    const statusCounts = orders.reduce((acc, order) => {
        const status = order.status.toLowerCase();
        // Skip cancelled orders
        if (status !== 'cancelled') {
            acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
    }, {});

    // Ensure all possible statuses are represented (excluding cancelled)
    const defaultStatuses = {
        completed: 0,
        'in progress': 0,
        pending: 0
    };

    return { ...defaultStatuses, ...statusCounts };
}

function calculateEmployeeStats(employeeData) {
    return employeeData?.reduce((acc, curr) => {
        const name = `${curr.profiles.first_name} ${curr.profiles.last_name}`;
        if (!acc[name]) {
            acc[name] = {
                completed: 0,
                pending: 0,
                total: 0,
                revenue: 0,
                averageOrderValue: 0
            };
        }
        
        acc[name].total++;
        acc[name].revenue += (curr.total_amount || 0);
        
        if (curr.status.toLowerCase() === 'completed') {
            acc[name].completed++;
        } else {
            acc[name].pending++;
        }
        
        acc[name].averageOrderValue = acc[name].revenue / acc[name].total;
        return acc;
    }, {}) || {};
}
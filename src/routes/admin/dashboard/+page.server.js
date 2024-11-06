import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const getDateRanges = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    
    return { today, thisWeekStart, thisMonthStart, thisYearStart };
};

export const load = async () => {
    try {
        const { today, thisWeekStart, thisMonthStart, thisYearStart } = getDateRanges();

        // Basic Statistics
        const { count: totalStudentsCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        const { count: totalOrdersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { data: totalRevenue } = await supabase
            .from('payments')
            .select('amount_paid')
            .eq('status', 'fully paid');

        // Gender Distribution
        const { data: studentsGender } = await supabase
            .from('students')
            .select('gender');

        const genderDistribution = studentsGender?.reduce((acc, curr) => {
            acc[curr.gender] = (acc[curr.gender] || 0) + 1;
            return acc;
        }, {});

        // Order Status Distribution
        const { data: ordersStatus } = await supabase
            .from('orders')
            .select('status');

        const orderStatusDistribution = ordersStatus?.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});

        // Top 10 Courses
        const { data: studentCourses } = await supabase
            .from('students')
            .select('courses(course_code, description)');

        const courseCounts = studentCourses?.reduce((acc, curr) => {
            const courseKey = curr.courses?.course_code;
            if (courseKey) {
                acc[courseKey] = (acc[courseKey] || 0) + 1;
            }
            return acc;
        }, {});

        const topCourses = Object.entries(courseCounts || {})
            .map(([course_code, count]) => ({ 
                courses: { course_code },
                count 
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Time-based Order Statistics
        const { count: ordersToday } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        const { count: ordersThisWeek } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thisWeekStart);

        const { count: ordersThisMonth } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thisMonthStart);

        // Revenue Statistics
        const { data: revenueToday } = await supabase
            .from('payments')
            .select('amount_paid')
            .gte('created_at', today);

        const { data: revenueThisMonth } = await supabase
            .from('payments')
            .select('amount_paid')
            .gte('created_at', thisMonthStart);

        const { data: revenueThisYear } = await supabase
            .from('payments')
            .select('amount_paid')
            .gte('created_at', thisYearStart);

        // Due Orders Count
        const { count: dueOrdersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .lte('due_date', new Date().toISOString());

        // Format data for frontend
        return {
            basicStats: {
                totalStudents: [{ count: totalStudentsCount || 0 }],
                totalOrders: [{ count: totalOrdersCount || 0 }],
                totalRevenue: totalRevenue?.reduce((sum, p) => sum + p.amount_paid, 0) || 0
            },
            genderDistribution: Object.entries(genderDistribution || {}).map(([gender, count]) => ({
                gender,
                count
            })),
            orderStats: {
                today: ordersToday || 0,
                thisWeek: ordersThisWeek || 0,
                thisMonth: ordersThisMonth || 0
            },
            revenueStats: {
                today: revenueToday?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
                thisMonth: revenueThisMonth?.reduce((sum, p) => sum + p.amount_paid, 0) || 0,
                thisYear: revenueThisYear?.reduce((sum, p) => sum + p.amount_paid, 0) || 0
            },
            orderStatusDistribution: Object.entries(orderStatusDistribution || {}).map(([status, count]) => ({
                status,
                count
            })),
            topCourses,
            monthlyRevenueTrend: [], // Simplified for now
            uniformTypeDistribution: [], // Simplified for now
            employeePerformance: [], // Simplified for now
            dueOrders: dueOrdersCount || 0,
            avgOrderValue: 0, // Simplified for now
            paymentStatusDistribution: [] // Simplified for now
        };
    } catch (err) {
        console.error('Dashboard data fetch error:', err);
        // Return empty data structure
        return {
            basicStats: {
                totalStudents: [{ count: 0 }],
                totalOrders: [{ count: 0 }],
                totalRevenue: 0
            },
            genderDistribution: [],
            orderStats: { today: 0, thisWeek: 0, thisMonth: 0 },
            revenueStats: { today: 0, thisMonth: 0, thisYear: 0 },
            orderStatusDistribution: [],
            topCourses: [],
            monthlyRevenueTrend: [],
            uniformTypeDistribution: [],
            employeePerformance: [],
            dueOrders: 0,
            avgOrderValue: 0,
            paymentStatusDistribution: []
        };
    }
};
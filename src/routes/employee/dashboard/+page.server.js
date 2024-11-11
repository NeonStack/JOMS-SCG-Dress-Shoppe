import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    console.log(locals.session.user);
    try {
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                students (
                    first_name,
                    last_name,
                    course:courses (
                        course_code
                    )
                )
            `)
            .eq('employee_id', locals.session.user.id);

        if (ordersError) throw ordersError;

        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);

        // Calculate next 7 days
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0];

        // Add daily workload calculation
        const dailyWorkload = orders?.reduce((acc, order) => {
            if (order.status === 'in progress') {
                const dueDate = order.due_date;
                if (!acc[dueDate]) acc[dueDate] = 0;
                acc[dueDate]++;
            }
            return acc;
        }, {});

        // Group orders by course
        const ordersByCourse = orders?.reduce((acc, order) => {
            const courseCode = order.students.course.course_code;
            if (!acc[courseCode]) acc[courseCode] = [];
            acc[courseCode].push(order);
            return acc;
        }, {});

        // Sort orders within each course by due date
        Object.values(ordersByCourse).forEach(courseOrders => {
            courseOrders.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        });

        // Sort courses by earliest due date
        const sortedOrdersByCourse = Object.fromEntries(
            Object.entries(ordersByCourse).sort(([,a], [,b]) => {
                const aDate = Math.min(...a.map(o => new Date(o.due_date)));
                const bDate = Math.min(...b.map(o => new Date(b.due_date)));
                return aDate - bDate;
            })
        );

        return {
            orders: orders || [],
            ordersByCourse: sortedOrdersByCourse,
            dailyWorkload,
            stats: {
                total: orders?.filter(o => o.status === 'in progress').length || 0,
                dueToday: orders?.filter(o => o.due_date === today && o.status === 'in progress').length || 0,
                dueInSevenDays: orders?.filter(o => 
                    o.due_date <= sevenDaysDate && 
                    o.due_date >= today && 
                    o.status === 'in progress'
                ).length || 0,
                completed: orders?.filter(o => o.status === 'completed').length || 0,
                completedThisMonth: orders?.filter(o => 
                    o.status === 'completed' && 
                    o.updated_at.startsWith(thisMonth)
                ).length || 0,
                urgentCount: orders?.filter(o => 
                    o.due_date <= today && 
                    o.status === 'in progress'
                ).length || 0,
                overdue: orders?.filter(o => 
                    o.due_date < today && 
                    o.status === 'in progress'
                ).length || 0
            }
        };
    } catch (err) {
        console.error('Error:', err);
        return { orders: [], stats: { total: 0, pending: 0, inProgress: 0, dueToday: 0, completedThisMonth: 0, completionRate: 0 } };
    }
};
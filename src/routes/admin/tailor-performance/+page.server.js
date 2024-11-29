import { error } from '@sveltejs/kit';

export async function load({ locals: { supabase } }) {
    const getEmployees = async () => {
        const { data: employees, error: empError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('role', 'employee');
        if (empError) throw error(500, empError.message);
        return employees;
    };

    const getPerformanceMetrics = async () => {
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                employee:profiles!orders_employee_id_fkey(
                    id,
                    first_name,
                    last_name,
                    position
                ),
                student:students!orders_student_id_fkey(
                    first_name,
                    last_name,
                    course:courses(
                        course_code
                    )
                ),
                order_measurements,
                uniform_type
            `)
            .order('created_at', { ascending: false });
        
        if (ordersError) throw error(500, ordersError.message);
        return orders;
    };

    // Get historical completion times for prediction
    const getHistoricalMetrics = async () => {
        // Get ALL completed orders, not just last 30 days
        const { data, error } = await supabase
            .from('orders')
            .select(`
                uniform_type,
                created_at,
                updated_at,
                employee_id,
                status
            `)
            .eq('status', 'completed');

        if (error) throw error(500, error.message);
        return data;
    };

    return {
        employees: await getEmployees(),
        performanceData: await getPerformanceMetrics(),
        historicalMetrics: await getHistoricalMetrics()
    };
}

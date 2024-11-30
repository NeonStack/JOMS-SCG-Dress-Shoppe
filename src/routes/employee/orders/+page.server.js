import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    if (!locals.session) throw error(401, 'Unauthorized');

    try {
        // Fetch measurement types
        const { data: measurementTypes } = await supabase
            .from('measurement_types')
            .select('*');

        // Fetch uniform configurations with measurement_specs
        const { data: uniformConfigs } = await supabase
            .from('uniform_configuration')
            .select('*, measurement_specs');

        // Fetch orders with nested students and courses data
        const { data: orders, error: err } = await supabase
            .from('orders')
            .select(`
                *,
                students:students (
                    id,
                    first_name,
                    last_name,
                    gender,
                    measurements,
                    courses:courses (
                        id,
                        course_code,
                        description
                    )
                )
            `)
            .eq('employee_id', locals.session.user.id)
            .order('due_date', { ascending: true });

        if (err) throw err;

        const formatOrders = (orders) => orders.map(order => {
            const student = order.students;
            const course = student.courses;

            const uniformConfigsForStudent = uniformConfigs.filter(config =>
                (config.gender === student.gender || config.gender === 'unisex') &&
                (config.course_id === course.id || config.course_id === null)
            );

            const updatedAtDate = new Date(order.updated_at);
            const dueDate = new Date(order.due_date);

            // Normalize dates to remove time component
            updatedAtDate.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);

            return {
                id: order.id,
                studentName: `${student.first_name} ${student.last_name}`,
                course: course.course_code,
                uniformType: order.uniform_type,
                dueDate: order.due_date,
                status: order.status,
                order_measurements: order.order_measurements || student.measurements || {}, // Use order_measurements or fall back to student measurements
                gender: student.gender,
                totalAmount: order.total_amount,
                paymentStatus: order.payment_status,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                completed_at: order.completed_at, // Add this line
                daysUntilDue: Math.ceil((new Date(order.due_date) - new Date()) / (1000 * 60 * 60 * 24)),
                uniformConfigs: uniformConfigsForStudent,
                completedInTime:
                    order.status === 'completed' &&
                    updatedAtDate <= dueDate
            };
        });

        const formattedOrders = formatOrders(orders);

        return {
            urgentOrders: formattedOrders.filter(o => o.status === 'in progress' && o.daysUntilDue <= 3),
            inProgressOrders: formattedOrders.filter(o => o.status === 'in progress' && o.daysUntilDue > 3),
            completedOrders: formattedOrders.filter(o => o.status === 'completed'),
            measurementTypes
        };
    } catch (err) {
        console.error('Error:', err);
        throw error(500, 'Failed to load orders');
    }
};

export const actions = {
    updateStatus: async ({ request, locals }) => {
        if (!locals.session) throw error(401, 'Unauthorized');

        const formData = await request.formData();
        const orderId = formData.get('orderId');
        const now = new Date().toISOString();

        try {
            const { error: err } = await supabase
                .from('orders')
                .update({ 
                    status: 'completed',
                    updated_at: now,
                    completed_at: now
                })
                .eq('id', orderId)
                .eq('employee_id', locals.session.user.id);

            if (err) throw err;
            return { success: true };
        } catch (err) {
            console.error('Error:', err);
            throw error(500, 'Failed to update order status');
        }
    }
};

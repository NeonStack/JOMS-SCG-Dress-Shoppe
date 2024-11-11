import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    // Fetch students with course information
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
            *,
            course:courses(id, course_code)
        `)
        .order('last_name');

    if (studentsError) throw error(500, 'Error fetching students');

    // Fetch employees
    const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee');

    if (employeesError) throw error(500, 'Error fetching employees');

    // Fetch uniform configurations
    const { data: uniformConfigs, error: configsError } = await supabase
        .from('uniform_configuration')
        .select(`
            id,
            gender,
            wear_type,
            course_id,
            base_price,
            measurement_specs,
            course:courses(*)
        `);

    if (configsError) throw error(500, 'Error fetching uniform configurations');

    // Fetch orders with related data
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
            *,
            student:students(
                *,
                course:courses(*)
            ),
            employee:profiles(first_name, last_name)
        `)
        .order('due_date', { ascending: true });

    if (ordersError) throw error(500, 'Error fetching orders');

    return {
        students,
        employees,
        uniformConfigs,
        orders
    };
};

export const actions = {
    createOrder: async ({ request }) => {
        const formData = await request.formData();
        const studentId = formData.get('studentId');
        const uniformType = formData.get('uniformType');
        const dueDate = formData.get('dueDate');
        const totalAmount = formData.get('totalAmount');

        // First get the student's current measurements
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('measurements')
            .eq('id', studentId)
            .single();

        if (studentError) {
            return fail(500, {
                error: 'Failed to fetch student measurements'
            });
        }

        // Create the order with measurements
        const { error: insertError } = await supabase
            .from('orders')
            .insert({
                student_id: studentId,
                uniform_type: uniformType,
                due_date: dueDate,
                total_amount: totalAmount,
                status: 'pending',
                order_measurements: student.measurements // Store current measurements
            });

        if (insertError) {
            return fail(500, {
                error: 'Failed to create order'
            });
        }

        return { success: true };
    },

    assignOrders: async ({ request }) => {
        const formData = await request.formData();
        const employeeId = formData.get('employeeId');
        const orderIds = formData.get('orderIds').split(',');

        if (!employeeId || !orderIds.length) {
            return fail(400, {
                error: 'Employee and orders must be selected'
            });
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                employee_id: employeeId,
                status: 'in progress',  // Update status when assigned
                updated_at: new Date().toISOString()
            })
            .in('id', orderIds);

        if (updateError) {
            return fail(500, {
                error: 'Failed to assign orders'
            });
        }

        return { success: true };
    },

    filterOrders: async ({ request }) => {
        const formData = await request.formData();
        const startDate = formData.get('startDate');
        const endDate = formData.get('endDate');

        if (!startDate || !endDate) {
            return fail(400, {
                error: 'Date range is required'
            });
        }

        const { data: orders, error: filterError } = await supabase
            .from('orders')
            .select(`
                *,
                student:students(*),
                employee:profiles(first_name, last_name)
            `)
            .gte('due_date', startDate)
            .lte('due_date', endDate)
            .order('due_date', { ascending: true });

        if (filterError) {
            console.error('Filter error:', filterError);
            return fail(500, {
                error: 'Failed to filter orders'
            });
        }

        return {
            success: true,
            filteredOrders: orders || []
        };
    },

    deleteOrder: async ({ request }) => {
        const formData = await request.formData();
        const orderId = formData.get('orderId');

        if (!orderId) {
            return fail(400, {
                error: 'Order ID is required'
            });
        }

        // First check if order is pending
        const { data: order, error: checkError } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (checkError || !order) {
            return fail(500, {
                error: 'Failed to check order status'
            });
        }

        if (order.status !== 'pending') {
            return fail(400, {
                error: 'Only pending orders can be deleted'
            });
        }

        // Delete the order
        const { error: deleteError } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (deleteError) {
            return fail(500, {
                error: 'Failed to delete order'
            });
        }

        return { success: true };
    },

    editOrder: async ({ request }) => {
        const formData = await request.formData();
        const orderId = formData.get('orderId');
        const studentId = formData.get('studentId');
        const uniformType = formData.get('uniformType');
        const dueDate = formData.get('dueDate');
        const totalAmount = formData.get('totalAmount');

        // Validation
        if (!orderId || !studentId || !uniformType || !dueDate || !totalAmount) {
            return fail(400, {
                error: 'All fields are required'
            });
        }

        // Get student's current measurements
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('measurements')
            .eq('id', studentId)
            .single();

        if (studentError) {
            return fail(500, {
                error: 'Failed to fetch student measurements'
            });
        }

        // Check if order exists and is pending
        const { data: existingOrder, error: checkError } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (checkError || !existingOrder) {
            return fail(404, {
                error: 'Order not found'
            });
        }

        if (existingOrder.status !== 'pending') {
            return fail(400, {
                error: 'Only pending orders can be edited'
            });
        }

        // Update the order with new measurements
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                student_id: studentId,
                uniform_type: uniformType,
                due_date: dueDate,
                total_amount: totalAmount,
                order_measurements: student.measurements, // Update measurements
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            return fail(500, {
                error: 'Failed to update order'
            });
        }

        return { success: true };
    },

    updatePayment: async ({ request }) => {
        const formData = await request.formData();
        const orderId = formData.get('orderId');
        const amountPaid = parseFloat(formData.get('amountPaid'));

        if (!orderId || !amountPaid) {
            return fail(400, {
                error: 'Order ID and amount are required'
            });
        }

        // Get current order details
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('total_amount, amount_paid')
            .eq('id', orderId)
            .single();

        if (fetchError) {
            return fail(500, {
                error: 'Failed to fetch order details'
            });
        }

        const newAmountPaid = order.amount_paid + amountPaid;
        const paymentStatus = 
            newAmountPaid === 0 ? 'not paid' :
            newAmountPaid >= order.total_amount ? 'fully paid' : 'partial';

        // Update the order with new payment details
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                amount_paid: newAmountPaid,
                payment_date: new Date().toISOString(),
                payment_status: paymentStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            return fail(500, {
                error: 'Failed to update payment'
            });
        }

        return { success: true };
    }
};

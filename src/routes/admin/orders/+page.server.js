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
            course:courses(*)
        `);

    if (configsError) throw error(500, 'Error fetching uniform configurations');

    // Fetch orders with related data
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
            *,
            student:students(*),
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

        // Validation
        if (!studentId || !uniformType || !dueDate || !totalAmount) {
            return fail(400, {
                error: 'All fields are required'
            });
        }

        const { error: insertError } = await supabase
            .from('orders')
            .insert({
                student_id: studentId,
                uniform_type: uniformType,
                due_date: dueDate,
                total_amount: totalAmount,
                status: 'pending'
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
    }
};

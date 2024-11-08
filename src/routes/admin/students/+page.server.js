import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    try {
        // Get all students with their course information
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select(`
                *,
                course:courses (
                    id,
                    course_code,
                    description
                )
            `);

        if (studentsError) throw studentsError;

        // Get uniform configurations with pricing information
        const { data: uniformConfigs, error: configError } = await supabase
            .from('uniform_configuration')
            .select(`
                id,
                gender,
                course_id,
                measurement_specs,
                wear_type,
                base_price
            `);

        if (configError) throw configError;

        // Process configs with pricing info
        const configsByGenderAndCourse = {};
        uniformConfigs?.forEach(config => {
            const key = `${config.gender}_${config.course_id}`;
            if (!configsByGenderAndCourse[key]) {
                configsByGenderAndCourse[key] = [];
            }
            configsByGenderAndCourse[key].push({
                ...config,
                wear_type: config.wear_type,
                measurement_specs: config.measurement_specs || [], // Changed from measurement_type_ids
                base_price: config.base_price || 0
            });
        });

        // Get all courses
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*');

        if (coursesError) throw coursesError;

        // Get measurement types
        const { data: measurementTypes, error: measurementError } = await supabase
            .from('measurement_types')
            .select('*');

        if (measurementError) throw measurementError;

        return {
            students: students || [],
            courses: courses || [],
            uniformConfigs: configsByGenderAndCourse,
            measurementTypes: Object.fromEntries((measurementTypes || []).map(m => [m.id, m]))
        };
    } catch (err) {
        console.error('Load error:', err);
        throw error(500, {
            message: err?.message || 'Internal server error',
            details: err?.details || 'Unknown error occurred while fetching data'
        });
    }
};

export const actions = {
    create: async ({ request }) => {
        try {
            const formData = await request.formData();
            const first_name = formData.get('first_name');
            const last_name = formData.get('last_name');
            const gender = formData.get('gender')?.toLowerCase();
            const course_id = formData.get('course_id');
            const contact_number = formData.get('contact_number');
            const address = formData.get('address');

            // Validation
            if (!first_name || !last_name || !gender || !course_id) {
                return fail(400, { error: 'Required fields are missing' });
            }

            console.log('Form data:', { first_name, last_name, gender, course_id }); // Debug log

            // Get uniform configuration
            const { data: configs, error: configError } = await supabase
                .from('uniform_configuration')
                .select('*')
                .eq('gender', gender)
                .eq('course_id', parseInt(course_id));

            if (configError) {
                console.error('Config error:', configError);
                throw configError;
            }

            console.log('Found configs:', configs); // Debug log

            // Collect measurements from form
            const measurements = {};
            const entries = Array.from(formData.entries());
            for (const [key, value] of entries) {
                if (key.startsWith('measurement_')) {
                    const measurementId = parseInt(key.replace('measurement_', ''));
                    measurements[measurementId] = parseFloat(value);
                }
            }

            console.log('Collected measurements:', measurements); // Debug log

            // Insert student
            const { data: student, error: insertError } = await supabase
                .from('students')
                .insert({
                    first_name,
                    last_name,
                    gender,
                    course_id: parseInt(course_id),
                    contact_number: contact_number || null,
                    address: address || null,
                    measurements // Supabase will handle JSONB conversion
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }

            return {
                success: true,
                student
            };

        } catch (err) {
            console.error('Create student error:', err);
            return fail(500, {
                error: err.message || 'Failed to create student'
            });
        }
    },

    edit: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const first_name = formData.get('first_name');
        const last_name = formData.get('last_name');
        const gender = formData.get('gender')?.toLowerCase();
        const course_id = parseInt(formData.get('course_id'));
        const contact_number = formData.get('contact_number');
        const address = formData.get('address');

        if (!id || !first_name || !last_name || !gender || !course_id) {
            return fail(400, {
                error: 'Required fields are missing'
            });
        }

        try {
            // Get uniform configuration for the student's course and gender
            const { data: configs, error: configError } = await supabase
                .from('uniform_configuration')
                .select('measurement_specs')
                .match({ gender, course_id });

            if (configError) throw configError;

            // Collect measurements from form data
            const measurements = {};
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('measurement_')) {
                    const measurementId = parseInt(key.replace('measurement_', ''));
                    measurements[measurementId] = parseFloat(value);
                }
            }

            // Update student record
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    first_name,
                    last_name,
                    gender,
                    course_id,
                    contact_number: contact_number || null,
                    address: address || null,
                    measurements // This will be automatically converted to JSONB
                })
                .eq('id', id);

            if (updateError) throw updateError;

            return { success: true };
        } catch (err) {
            console.error('Update error:', err);
            return fail(500, {
                error: 'Failed to update student'
            });
        }
    },

    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, { 
                error: 'Student ID is required'
            });
        }

        try {
            const { error: deleteError } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (deleteError) {
                console.log('Delete error:', deleteError); // Debug log
                
                if (deleteError.code === '23503') {
                    return fail(400, { 
                        error: 'This student cannot be deleted because they have existing orders in the system.'
                    });
                }
                
                return fail(500, { 
                    error: deleteError.message || 'Failed to delete student'
                });
            }

            return {
                success: true
            };
        } catch (err) {
            console.log('Catch error:', err); // Debug log
            return fail(500, { 
                error: err.message || 'Failed to delete student'
            });
        }
    }
};

import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    try {
        // Fetch uniform configurations with course details
        const { data: configs, error: configError } = await supabase
            .from('uniform_configuration')
            .select(`
                id,
                gender,
                wear_type,
                base_price,
                additional_cost_per_cm,
                created_at,
                courses:course_id(id, course_code)
            `)
            .order('created_at', { ascending: false });

        if (configError) throw configError;

        // Fetch all courses for the dropdown
        const { data: courses, error: courseError } = await supabase
            .from('courses')
            .select('id, course_code')
            .order('course_code');

        if (courseError) throw courseError;

        // Fetch all measurement types for the selection
        const { data: measurementTypes, error: measurementError } = await supabase
            .from('measurement_types')
            .select('id, name')
            .order('name');

        if (measurementError) throw measurementError;

        return {
            configs,
            courses,
            measurementTypes
        };
    } catch (err) {
        console.error('Error:', err);
        throw error(500, 'Failed to load uniform configurations');
    }
};

export const actions = {
    create: async ({ request }) => {
        try {
            const formData = await request.formData();
            const gender = formData.get('gender');
            const courseId = formData.get('courseId');
            const wearType = formData.get('wearType');
            const basePrice = parseFloat(formData.get('basePrice'));
            const additionalCostPerCm = parseFloat(formData.get('additionalCostPerCm') || '0');
            const measurementTypeIds = formData.getAll('measurementTypes').map(Number);

            // Validate required fields
            if (!gender || !courseId || !wearType || !basePrice || measurementTypeIds.length === 0) {
                throw error(400, 'Missing required fields');
            }

            // Insert new configuration
            const { data, error: insertError } = await supabase
                .from('uniform_configuration')
                .insert({
                    gender,
                    course_id: courseId,
                    wear_type: wearType,
                    measurement_type_ids: measurementTypeIds,
                    base_price: basePrice,
                    additional_cost_per_cm: additionalCostPerCm
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return {
                success: true,
                message: 'Uniform configuration created successfully',
                config: data
            };
        } catch (err) {
            console.error('Error:', err);
            throw error(500, err.message);
        }
    },

    update: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            const gender = formData.get('gender');
            const courseId = formData.get('courseId');
            const wearType = formData.get('wearType');
            const basePrice = parseFloat(formData.get('basePrice'));
            const additionalCostPerCm = parseFloat(formData.get('additionalCostPerCm') || '0');
            const measurementTypeIds = formData.getAll('measurementTypes').map(Number);

            if (!id || !gender || !courseId || !wearType || !basePrice || measurementTypeIds.length === 0) {
                throw error(400, 'Missing required fields');
            }

            const { data, error: updateError } = await supabase
                .from('uniform_configuration')
                .update({
                    gender,
                    course_id: courseId,
                    wear_type: wearType,
                    measurement_type_ids: measurementTypeIds,
                    base_price: basePrice,
                    additional_cost_per_cm: additionalCostPerCm
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            return {
                success: true,
                message: 'Uniform configuration updated successfully',
                config: data
            };
        } catch (err) {
            console.error('Error:', err);
            throw error(500, err.message);
        }
    },

    delete: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');

            if (!id) {
                throw error(400, 'Configuration ID is required');
            }

            const { error: deleteError } = await supabase
                .from('uniform_configuration')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            return {
                success: true,
                message: 'Uniform configuration deleted successfully'
            };
        } catch (err) {
            console.error('Error:', err);
            throw error(500, err.message);
        }
    }
};

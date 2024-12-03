import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    try {
        // Fetch uniform configurations with course details
        const { data: configs, error: configError } = await supabase
            .from('uniform_configuration')
            .select(`
                id,
                course_id,
                gender,
                wear_type,
                base_price,
                measurement_specs,
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

        // Prepare a mapping of existing configurations
        const configurationMap = {};

        configs.forEach(config => {
            const courseId = config.course_id?.toString(); // Ensure courseId is a string
            const gender = config.gender;
            const wearType = config.wear_type;

            if (!configurationMap[courseId]) {
                configurationMap[courseId] = {};
            }
            if (!configurationMap[courseId][gender]) {
                configurationMap[courseId][gender] = new Set();
            }
            configurationMap[courseId][gender].add(wearType);
        });

        return {
            configs,
            courses,
            measurementTypes,
            configurationMap // Add this to be used in the Svelte component
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
            
            // Get selected measurement types and their specifications
            const selectedMeasurements = formData.getAll('selectedMeasurements');
            const measurement_specs = selectedMeasurements.map(typeId => ({
                measurement_type_id: parseInt(typeId),
                base_cm: parseFloat(formData.get(`baseCm_${typeId}`) || '0'),
                additional_cost_per_cm: parseFloat(formData.get(`costPerCm_${typeId}`) || '0')
            }));

            if (!gender || !courseId || !wearType || !basePrice || measurement_specs.length === 0) {
                throw error(400, 'Missing required fields');
            }

            const { data, error: insertError } = await supabase
                .from('uniform_configuration')
                .insert({
                    gender,
                    course_id: courseId,
                    wear_type: wearType,
                    measurement_specs,
                    base_price: basePrice
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return { success: true, config: data };
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

            // Get selected measurement types and their specifications
            const selectedMeasurements = formData.getAll('selectedMeasurements');
            const measurement_specs = selectedMeasurements.map(typeId => ({
                measurement_type_id: parseInt(typeId),
                base_cm: parseFloat(formData.get(`baseCm_${typeId}`) || '0'),
                additional_cost_per_cm: parseFloat(formData.get(`costPerCm_${typeId}`) || '0')
            }));

            if (!id || !gender || !courseId || !wearType || !basePrice || measurement_specs.length === 0) {
                throw error(400, 'Missing required fields');
            }

            const { data, error: updateError } = await supabase
                .from('uniform_configuration')
                .update({
                    gender,
                    course_id: courseId,
                    wear_type: wearType,
                    measurement_specs,
                    base_price: basePrice
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            return { success: true, config: data };
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

import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    try {
        // First get all measurement types
        const { data: measurements, error: fetchError } = await supabase
            .from('measurement_types')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Get usage counts for each measurement type
        const { data: configurations } = await supabase
            .from('uniform_configuration')
            .select('measurement_specs');

        // Count usages for each measurement type
        const usageCounts = measurements.map(measurement => {
            const count = configurations.filter(config => 
                config.measurement_specs.some(spec => 
                    spec.measurement_type_id === measurement.id
                )
            ).length;
            
            return {
                ...measurement,
                usage_count: count
            };
        });

        return {
            measurements: usageCounts
        };
    } catch (err) {
        console.error('Error:', err);
        throw error(500, 'Error fetching measurement types');
    }
};

export const actions = {
    create: async ({ request }) => {
        const formData = await request.formData();
        const name = formData.get('name')?.toString().trim();

        if (!name) {
            return fail(400, {
                error: 'Measurement name is required'
            });
        }

        try {
            const { error: insertError } = await supabase
                .from('measurement_types')
                .insert({ name });

            if (insertError) throw insertError;

            return { success: true };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                error: 'Failed to create measurement type'
            });
        }
    },

    update: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const name = formData.get('name')?.toString().trim();

        if (!id || !name) {
            return fail(400, {
                error: 'Measurement ID and name are required'
            });
        }

        try {
            const { error: updateError } = await supabase
                .from('measurement_types')
                .update({ name })
                .eq('id', id);

            if (updateError) throw updateError;

            return { success: true };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                error: 'Failed to update measurement type'
            });
        }
    },

    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, {
                error: 'Measurement ID is required'
            });
        }

        try {
            // Improved check for measurement type usage
            const { data: configs, error: checkError } = await supabase
                .from('uniform_configuration')
                .select('measurement_specs');

            if (checkError) throw checkError;

            // Check if any configuration uses this measurement type
            const isUsed = configs.some(config => 
                config.measurement_specs.some(spec => 
                    spec.measurement_type_id === Number(id)
                )
            );

            if (isUsed) {
                return fail(400, {
                    error: 'Cannot delete this measurement type as it is being used in uniform configurations'
                });
            }

            // If not used, proceed with deletion
            const { error: deleteError } = await supabase
                .from('measurement_types')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            return { success: true };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                error: 'Failed to delete measurement type'
            });
        }
    }
};

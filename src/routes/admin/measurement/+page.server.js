import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const toSentenceCase = (str) => {
    return str
        .toLowerCase()
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim()                // Remove leading/trailing spaces
        .replace(/^.|\s\S/g, letter => letter.toUpperCase());
};

const NAME_MAX_LENGTH = 40;
const NAME_PATTERN = /^[A-Za-z0-9\s-]+$/;

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
        const names = formData.getAll('names')
            .map(name => toSentenceCase(name.toString().trim()))
            .filter(name => name.length > 0);

        if (names.length === 0) {
            return fail(400, {
                error: 'At least one measurement name is required'
            });
        }

        // Validate each name
        const validationErrors = names.flatMap((name, index) => {
            const errors = [];
            
            if (!name) {
                errors.push(`Measurement name is required for entry ${index + 1}`);
            } else if (name.length > NAME_MAX_LENGTH) {
                errors.push(`Name must not exceed ${NAME_MAX_LENGTH} characters for entry ${index + 1}`);
            } else if (!NAME_PATTERN.test(name)) {
                errors.push(`Measurement name can only contain letters, numbers, spaces, and dashes for entry ${index + 1}`);
            }

            return errors;
        });

        if (validationErrors.length > 0) {
            return fail(400, {
                error: validationErrors.join('\n')
            });
        }

        try {
            // First check for existing measurements with sentence case names
            const { data: existingMeasurements } = await supabase
                .from('measurement_types')
                .select('name')
                .in('name', names);

            if (existingMeasurements && existingMeasurements.length > 0) {
                const duplicates = existingMeasurements.map(m => m.name).join(', ');
                return fail(400, {
                    error: `Measurement types already exist: ${duplicates}`
                });
            }

            const { error: insertError } = await supabase
                .from('measurement_types')
                .insert(names.map(name => ({ name })));

            if (insertError) throw insertError;

            return { success: true };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                error: 'Failed to create measurement types'
            });
        }
    },

    update: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const name = toSentenceCase(formData.get('name')?.toString().trim() || '');

        if (!id || !name) {
            return fail(400, {
                error: 'Measurement ID and name are required'
            });
        }

        // Validate input
        if (name.length > NAME_MAX_LENGTH) {
            return fail(400, {
                error: `Name must not exceed ${NAME_MAX_LENGTH} characters`
            });
        }

        if (!NAME_PATTERN.test(name)) {
            return fail(400, {
                error: 'Measurement name can only contain letters, numbers, spaces, and dashes'
            });
        }

        try {
            // Check if the new name already exists (excluding current record)
            const { data: existing } = await supabase
                .from('measurement_types')
                .select('id')
                .eq('name', name)
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                return fail(400, {
                    error: `A measurement type with name "${name}" already exists`
                });
            }

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

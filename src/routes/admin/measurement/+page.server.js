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
const NUMBER_PATTERN = /^\d*\.?\d*$/;
const MAX_DECIMAL_PLACES = 2;
const MAX_NUMERIC_VALUE = 999999.99;

// Helper to validate numeric values
const validateNumeric = (value, fieldName) => {
    if (value === undefined || value === null || value === '') return null;
    
    // Convert to string first to handle different input types
    const strValue = String(value).trim();
    if (strValue === '') return null;
    
    // Validate format
    if (!NUMBER_PATTERN.test(strValue)) {
        return `${fieldName} must be a valid number`;
    }
    
    // Check decimal places
    const parts = strValue.split('.');
    if (parts.length > 1 && parts[1].length > MAX_DECIMAL_PLACES) {
        return `${fieldName} cannot have more than ${MAX_DECIMAL_PLACES} decimal places`;
    }
    
    // Check max value
    const numValue = parseFloat(strValue);
    if (isNaN(numValue)) return `${fieldName} must be a valid number`;
    
    if (numValue > MAX_NUMERIC_VALUE) {
        return `${fieldName} cannot exceed ${MAX_NUMERIC_VALUE}`;
    }
    
    // Check if negative
    if (numValue < 0) {
        return `${fieldName} cannot be negative`;
    }
    
    return null;
};

// Format numeric value to have at most 2 decimal places and handle empty values
const formatNumericValue = (value) => {
    if (value === undefined || value === null || value === '') return null;
    
    // Convert to string and trim
    const strValue = String(value).trim();
    if (strValue === '') return null;
    
    // Parse the number
    const numValue = parseFloat(strValue);
    if (isNaN(numValue)) return null;
    
    // Return the value with proper formatting
    return numValue;
};

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
        const names = formData.getAll('names');
        
        if (names.length === 0) {
            return fail(400, {
                error: 'At least one measurement name is required'
            });
        }

        // Extract all base and additional cost values
        const baseCmValues = formData.getAll('default_base_cm');
        const additionalCostValues = formData.getAll('default_additional_cost_per_cm');

        // Create an array of measurement objects
        const measurements = names.map((name, index) => {
            const formattedName = toSentenceCase(name.toString().trim());
            // Convert empty strings to null
            const baseCm = baseCmValues[index] !== undefined && baseCmValues[index] !== '' 
                ? baseCmValues[index] 
                : null;
            const additionalCost = additionalCostValues[index] !== undefined && additionalCostValues[index] !== '' 
                ? additionalCostValues[index] 
                : null;
                
            return {
                name: formattedName,
                default_base_cm: formatNumericValue(baseCm),
                default_additional_cost_per_cm: formatNumericValue(additionalCost)
            };
        }).filter(measurement => measurement.name.length > 0);

        if (measurements.length === 0) {
            return fail(400, {
                error: 'At least one valid measurement name is required'
            });
        }

        // Validate each measurement
        const validationErrors = measurements.flatMap((measurement, index) => {
            const errors = [];
            
            // Validate name
            if (!measurement.name) {
                errors.push(`Measurement name is required for entry ${index + 1}`);
            } else if (measurement.name.length > NAME_MAX_LENGTH) {
                errors.push(`Name must not exceed ${NAME_MAX_LENGTH} characters for entry ${index + 1}`);
            } else if (!NAME_PATTERN.test(measurement.name)) {
                errors.push(`Measurement name can only contain letters, numbers, spaces, and dashes for entry ${index + 1}`);
            }

            // Validate numeric fields
            const baseCmError = validateNumeric(measurement.default_base_cm, 'Base (cm)');
            if (baseCmError) errors.push(`Entry ${index + 1}: ${baseCmError}`);

            const additionalCostError = validateNumeric(measurement.default_additional_cost_per_cm, 'Additional cost per cm');
            if (additionalCostError) errors.push(`Entry ${index + 1}: ${additionalCostError}`);

            return errors;
        });

        if (validationErrors.length > 0) {
            return fail(400, {
                error: validationErrors.join('\n')
            });
        }

        try {
            // First check for existing measurements with the same names
            const { data: existingMeasurements } = await supabase
                .from('measurement_types')
                .select('name')
                .in('name', measurements.map(m => m.name));

            if (existingMeasurements && existingMeasurements.length > 0) {
                const duplicates = existingMeasurements.map(m => m.name).join(', ');
                return fail(400, {
                    error: `Measurement types already exist: ${duplicates}`
                });
            }

            const { error: insertError } = await supabase
                .from('measurement_types')
                .insert(measurements);

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
        
        // Get base_cm and additional_cost values, handling empty strings
        const baseCmRaw = formData.get('default_base_cm');
        const additionalCostRaw = formData.get('default_additional_cost_per_cm');
        
        // Only format if values are not empty
        const default_base_cm = (baseCmRaw !== undefined && baseCmRaw !== '') 
            ? formatNumericValue(baseCmRaw) 
            : null;
            
        const default_additional_cost_per_cm = (additionalCostRaw !== undefined && additionalCostRaw !== '') 
            ? formatNumericValue(additionalCostRaw) 
            : null;

        if (!id || !name) {
            return fail(400, {
                error: 'Measurement ID and name are required'
            });
        }

        // Validate input
        const validationErrors = [];
        
        // Validate name
        if (name.length > NAME_MAX_LENGTH) {
            validationErrors.push(`Name must not exceed ${NAME_MAX_LENGTH} characters`);
        }
        if (!NAME_PATTERN.test(name)) {
            validationErrors.push('Measurement name can only contain letters, numbers, spaces, and dashes');
        }

        // Validate numeric fields
        const baseCmError = validateNumeric(default_base_cm, 'Base (cm)');
        if (baseCmError) validationErrors.push(baseCmError);

        const additionalCostError = validateNumeric(default_additional_cost_per_cm, 'Additional cost per cm');
        if (additionalCostError) validationErrors.push(additionalCostError);

        if (validationErrors.length > 0) {
            return fail(400, {
                error: validationErrors.join('\n')
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
                .update({ 
                    name,
                    default_base_cm,
                    default_additional_cost_per_cm
                })
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

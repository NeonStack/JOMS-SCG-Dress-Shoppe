import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const cleanupName = (str) => {
    return str
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

const toSentenceCase = (str) => {
    return cleanupName(str)  // Add cleanupName here
        .toLowerCase()
        .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
};

const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^09\d{9}$/;  // Format: 09 followed by 9 digits
    return !phone || phoneRegex.test(phone); // Changed to allow empty values
};

const isValidName = (name) => {
    const nameRegex = /^[a-zA-Z\s.]+$/;  // Only letters, spaces, and dots
    return nameRegex.test(name) && name.trim().length >= 2 && name.trim().length <= 50;
};

const isValidAddress = (address) => {
    const addressRegex = /^[a-zA-Z0-9\s,.\-#]+$/;
    return address && address.trim().length >= 5 && address.trim().length <= 200 && addressRegex.test(address);
};

const sanitizeAndValidateInput = (formData) => {
    const first_name = toSentenceCase(formData.get('first_name') || '');
    const last_name = toSentenceCase(formData.get('last_name') || '');
    const gender = (formData.get('gender') || '').toLowerCase();
    const course_id = formData.get('course_id');
    const contact_number = (formData.get('contact_number') || '').trim();
    const address = toSentenceCase(formData.get('address') || ''); // Changed to use toSentenceCase instead of just cleanupName

    const errors = {};

    if (!first_name || !isValidName(first_name)) {
        if (!first_name) {
            errors.first_name = 'Name is required';
        } else if (!/^[a-zA-Z\s.]+$/.test(first_name)) {
            errors.first_name = 'Only letters, spaces, and dots allowed';
        } else {
            errors.first_name = 'Must be between 2-50 characters';
        }
    }

    if (!last_name || !isValidName(last_name)) {
        if (!last_name) {
            errors.last_name = 'Name is required';
        } else if (!/^[a-zA-Z\s.]+$/.test(last_name)) {
            errors.last_name = 'Only letters, spaces, and dots allowed';
        } else {
            errors.last_name = 'Must be between 2-50 characters';
        }
    }

    if (!gender) {
        errors.gender = 'Please select a gender';
    }

    if (!course_id) {
        errors.course_id = 'Please select a course';
    }

    if (!contact_number) {
        errors.contact_number = 'Contact number is required';
    } else if (!isValidPhoneNumber(contact_number)) {
        errors.contact_number = 'Must be 11 digits starting with 09';
    }

    if (!address) {
        errors.address = 'Address is required';
    } else if (!isValidAddress(address)) {
        if (address.length < 5 || address.length > 200) {
            errors.address = 'Must be between 5-200 characters';
        } else {
            errors.address = 'Only letters, numbers, spaces, commas, dots, hyphens, and #';
        }
    }

    return {
        sanitizedData: {
            first_name,
            last_name,
            gender,
            course_id,
            contact_number: contact_number || null,
            address: address || null
        },
        errors: Object.keys(errors).length > 0 ? errors : null
    };
};

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
            const { sanitizedData, errors } = sanitizeAndValidateInput(formData);

            if (errors) {
                return fail(400, { errors });
            }

            // Collect measurements (without validation)
            const measurements = {};
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('measurement_')) {
                    const measurementId = parseInt(key.replace('measurement_', ''));
                    measurements[measurementId] = parseFloat(value);
                }
            }

            // Insert student with sanitized data
            const { data: student, error: insertError } = await supabase
                .from('students')
                .insert({
                    ...sanitizedData,
                    course_id: parseInt(sanitizedData.course_id),
                    measurements
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return { success: true, student };
        } catch (err) {
            return fail(500, { 
                errors: { _form: 'Failed to create student. Please try again.' }
            });
        }
    },

    edit: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');

            if (!id) {
                return fail(400, { 
                    errors: { _form: 'Student ID is required' }
                });
            }

            const { sanitizedData, errors } = sanitizeAndValidateInput(formData);

            if (errors) {
                return fail(400, { errors });
            }

            // Collect measurements
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
                    ...sanitizedData,
                    course_id: parseInt(sanitizedData.course_id),
                    measurements
                })
                .eq('id', id);

            if (updateError) throw updateError;

            return { success: true };
        } catch (err) {
            console.error('Update error:', err);
            return fail(500, { 
                errors: { _form: 'Failed to update student. Please try again.' }
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
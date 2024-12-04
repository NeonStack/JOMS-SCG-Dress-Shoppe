import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const COURSE_CODE_MAX_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 150;
const COURSE_CODE_PATTERN = /^[A-Za-z0-9-]+$/;

export const load = async () => {
    try {
        // Get courses with student count
        const { data: courses, error: fetchError } = await supabase
            .from('courses')
            .select(`
                *,
                students:students(count)
            `)
            .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data to include student_count
        const coursesWithCount = courses.map(course => ({
            ...course,
            student_count: course.students[0].count
        }));

        return {
            courses: coursesWithCount
        };
    } catch (err) {
        console.error('Error:', err);
        throw error(500, 'Error fetching courses');
    }
};

export const actions = {
    create: async ({ request }) => {
        const formData = await request.formData();
        const course_codes = formData.getAll('course_codes');
        const descriptions = formData.getAll('descriptions');

        // Updated helper function for sentence case and whitespace handling
        const formatText = str => 
            str ? str.toLowerCase()
                   .replace(/^.|\s\S/g, letter => letter.toUpperCase())
                   .replace(/\s+/g, ' ')
                   .trim()
                : null;

        // Create array of course objects
        const courses = course_codes.map((code, index) => ({
            course_code: code.toString().trim().toUpperCase(),
            description: formatText(descriptions[index]?.toString())
        })).filter(course => course.course_code !== '');

        if (courses.length === 0) {
            return fail(400, {
                error: 'At least one course code is required'
            });
        }

        // Validate each course
        const validationErrors = courses.flatMap((course, index) => {
            const errors = [];
            
            if (!course.course_code) {
                errors.push(`Course code is required for entry ${index + 1}`);
            } else if (course.course_code.length > COURSE_CODE_MAX_LENGTH) {
                errors.push(`Course code must not exceed ${COURSE_CODE_MAX_LENGTH} characters for entry ${index + 1}`);
            } else if (!COURSE_CODE_PATTERN.test(course.course_code)) {
                errors.push(`Course code can only contain letters, numbers, and dashes for entry ${index + 1}`);
            }

            if (course.description && course.description.length > DESCRIPTION_MAX_LENGTH) {
                errors.push(`Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters for entry ${index + 1}`);
            }

            return errors;
        });

        if (validationErrors.length > 0) {
            return fail(400, {
                error: validationErrors.join('\n')
            });
        }

        try {
            // Check for existing courses and descriptions
            const { data: existingData } = await supabase
                .from('courses')
                .select('course_code, description')
                .or(`course_code.in.(${courses.map(c => `'${c.course_code}'`).join(',')}),description.in.(${courses.filter(c => c.description).map(c => `'${c.description}'`).join(',')})`);

            if (existingData && existingData.length > 0) {
                const duplicateCodes = existingData
                    .filter(e => courses.some(c => c.course_code === e.course_code))
                    .map(e => e.course_code);
                const duplicateDescs = existingData
                    .filter(e => courses.some(c => c.description === e.description))
                    .map(e => e.description);

                let errorMessage = '';
                if (duplicateCodes.length > 0) {
                    errorMessage += `Course code already exists:\r\n${duplicateCodes.join('\r\n')}`;
                }
                if (duplicateDescs.length > 0) {
                    if (duplicateCodes.length > 0) errorMessage += '\r\n\r\n';
                    errorMessage += `Course description already exists:\r\n${duplicateDescs.join('\r\n')}`;
                }

                return fail(400, { error: errorMessage });
            }

            const { error: insertError } = await supabase
                .from('courses')
                .insert(courses);

            if (insertError) throw insertError;

            return {
                type: 'success',
                message: 'Courses created successfully'
            };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                type: 'failure',
                error: err.message || 'Failed to create courses'
            });
        }
    },

    update: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const course_code = formData.get('course_code')?.toString().trim();
        const description = formData.get('description')?.toString().trim();

        if (!id || !course_code) {
            return fail(400, {
                type: 'failure',
                error: 'Course ID and code are required'
            });
        }

        const formatText = str => 
            str ? str.toLowerCase()
                   .replace(/^.|\s\S/g, letter => letter.toUpperCase())
                   .replace(/\s+/g, ' ')
                   .trim()
                : null;

        const formattedDesc = formatText(description);

        // Validate input
        const validationErrors = [];
        
        if (!course_code) {
            validationErrors.push('Course code is required');
        } else if (course_code.length > COURSE_CODE_MAX_LENGTH) {
            validationErrors.push(`Course code must not exceed ${COURSE_CODE_MAX_LENGTH} characters`);
        } else if (!COURSE_CODE_PATTERN.test(course_code)) {
            validationErrors.push('Course code can only contain letters, numbers, and dashes');
        }

        if (description && description.length > DESCRIPTION_MAX_LENGTH) {
            validationErrors.push(`Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`);
        }

        if (validationErrors.length > 0) {
            return fail(400, {
                type: 'failure',
                error: validationErrors.join('\n')
            });
        }

        try {
            // Check for existing courses with the same code or description
            const { data: existingData } = await supabase
                .from('courses')
                .select('course_code, description')
                .or(`course_code.eq.${course_code.toUpperCase()},description.eq.${formattedDesc}`)
                .neq('id', id);

            if (existingData && existingData.length > 0) {
                const duplicateCodes = existingData
                    .filter(e => e.course_code === course_code.toUpperCase())
                    .map(e => e.course_code);
                const duplicateDescs = existingData
                    .filter(e => e.description === formattedDesc)
                    .map(e => e.description);

                let errorMessage = '';
                if (duplicateCodes.length > 0) {
                    errorMessage += `Course code already exists:\r\n${duplicateCodes[0]}`;
                }
                if (duplicateDescs.length > 0) {
                    if (duplicateCodes.length > 0) errorMessage += '\r\n\r\n';
                    errorMessage += `Course description already exists:\r\n${duplicateDescs[0]}`;
                }

                return fail(400, { 
                    type: 'failure',
                    error: errorMessage
                });
            }

            const { error: updateError } = await supabase
                .from('courses')
                .update({ 
                    course_code: course_code.toUpperCase(),
                    description: formattedDesc
                })
                .eq('id', id);

            if (updateError) throw updateError;

            return {
                type: 'success',
                message: 'Course updated successfully'
            };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                type: 'failure',
                error: err.message || 'An unexpected error occurred while updating the course'
            });
        }
    },

    delete: async ({ request }) => {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return fail(400, {
                type: 'failure',
                error: 'Course ID is required'
            });
        }

        try {
            // First check if the course is referenced in other tables
            const { data: uniformConfigs } = await supabase
                .from('uniform_configuration')
                .select('id')
                .eq('course_id', id)
                .limit(1);

            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('course_id', id)
                .limit(1);

            if (uniformConfigs?.length || students?.length) {
                return fail(400, {
                    type: 'failure',
                    error: 'Cannot delete course as it is being used by uniforms or students'
                });
            }

            const { error: deleteError } = await supabase
                .from('courses')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            return {
                type: 'success',
                message: 'Course deleted successfully'
            };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                type: 'failure',
                error: err.message || 'Failed to delete course'
            });
        }
    }
};

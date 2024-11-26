import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async () => {
    try {
        const { data: courses, error: fetchError } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        return {
            courses
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

        // Helper function for sentence case
        const toSentenceCase = str => 
            str ? str.toLowerCase().replace(/^.|\s\S/g, letter => letter.toUpperCase()) : null;

        // Create array of course objects
        const courses = course_codes.map((code, index) => ({
            course_code: code.toString().trim().toUpperCase(),
            description: toSentenceCase(descriptions[index]?.toString().trim()) || null
        })).filter(course => course.course_code !== '');

        if (courses.length === 0) {
            return fail(400, {
                error: 'At least one course code is required'
            });
        }

        try {
            // Check for existing courses
            const { data: existingCourses } = await supabase
                .from('courses')
                .select('course_code')
                .in('course_code', courses.map(c => c.course_code));

            if (existingCourses && existingCourses.length > 0) {
                const duplicates = existingCourses.map(c => c.course_code).join(', ');
                return fail(400, {
                    error: `Course codes already exist: ${duplicates}`
                });
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

        try {
            const { error: updateError } = await supabase
                .from('courses')
                .update({ 
                    course_code: course_code.toUpperCase(),
                    description: description ? 
                        description.toLowerCase().replace(/^.|\s\S/g, letter => letter.toUpperCase()) 
                        : null
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
                error: err.message || 'Failed to update course'
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

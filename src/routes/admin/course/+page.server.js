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
        const course_code = formData.get('course_code')?.toString().trim();
        const description = formData.get('description')?.toString().trim();

        if (!course_code) {
            return fail(400, {
                error: 'Course code is required'
            });
        }

        try {
            const { error: insertError } = await supabase
                .from('courses')
                .insert({ 
                    course_code, 
                    description: description || null 
                });

            if (insertError) throw insertError;

            return {
                type: 'success',
                message: 'Course created successfully'
            };
        } catch (err) {
            console.error('Error:', err);
            return fail(500, {
                type: 'failure',
                error: err.message || 'Failed to create course'
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
                    course_code,
                    description: description || null
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

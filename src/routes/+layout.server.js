export const load = async ({ locals }) => {
    return {
        session: locals.session,
        userRole: locals.userRole
    }
}
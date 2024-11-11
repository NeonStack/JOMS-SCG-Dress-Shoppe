{#if showModal}
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-4 z-50">
        <div class="bg-white rounded-xl w-full max-w-4xl mx-4 my-8 shadow-2xl animate-scale">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-primary to-primary-dark px-8 py-5 rounded-t-xl">
                <h2 class="text-2xl font-bold text-white">
                    {modalMode === 'create' ? 'Add New Student' : 'Edit Student Information'}
                </h2>
            </div>
            
            <!-- Modal Body -->
            <div class="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                <form
                    id="studentForm"
                    method="POST"
                    action="?/{modalMode}"
                    use:enhance={({ form, data, action, cancel }) => {
                        return async ({ result, update }) => {
                            if (result.type === 'success') {
                                showModal = false;
                                window.location.reload();
                            } else if (result.type === 'error') {
                                console.error('Form submission error:', result);
                            }
                        };
                    }}
                    class="space-y-8"
                >
                    {#if modalMode === 'edit'}
                        <input type="hidden" name="id" value={editingStudent.id} />
                    {/if}
                    
                    <!-- Personal Information Section -->
                    <div class="space-y-6">
                        <h3 class="text-xl font-semibold text-primary border-b pb-2">Personal Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editingStudent.first_name || ''}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    required
                                />
                            </div>
                            
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={editingStudent.last_name || ''}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    required
                                />
                            </div>
                            
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    name="gender"
                                    bind:value={selectedGender}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Course</label>
                                <select
                                    name="course_id"
                                    bind:value={selectedCourseId}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    required
                                >
                                    <option value="">Select Course</option>
                                    {#each courses as course}
                                        <option value={course.id.toString()}>
                                            {course.course_code} - {course.description}
                                        </option>
                                    {/each}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Contact Number</label>
                                <input
                                    type="text"
                                    name="contact_number"
                                    value={editingStudent.contact_number || ''}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                />
                            </div>
                            
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Address</label>
                                <textarea
                                    name="address"
                                    value={editingStudent.address || ''}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    rows="2"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Measurements Section -->
                    {#if requiredMeasurements.length > 0}
                        <div class="space-y-6">
                            <h3 class="text-xl font-semibold text-primary border-b pb-2">Required Measurements</h3>
                            
                            <!-- Upper Wear Measurements -->
                            {#if requiredMeasurements.some(m => m.wear_type === 'upper')}
                                <div class="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                    <h4 class="font-semibold text-lg mb-6 text-primary flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7 5V2a1 1 0 011-1h4a1 1 0 011 1v3h4l-1 12H4L3 5h4z"/>
                                        </svg>
                                        Upper Wear Measurements
                                    </h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {#each requiredMeasurements.filter(m => m.wear_type === 'upper') as measurement}
                                            <div class="measurement-input-group space-y-2">
                                                <label class="block text-sm font-medium text-gray-700">
                                                    {measurement.name}
                                                </label>
                                                <div class="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        name="measurement_{measurement.id}"
                                                        value={editingStudent?.measurements?.[measurement.id] || ''}
                                                        class="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder="Base: {measurement.base_cm}cm"
                                                        required
                                                    />
                                                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">cm</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- Lower Wear Measurements -->
                            {#if requiredMeasurements.some(m => m.wear_type === 'lower')}
                                <div class="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                    <h4 class="font-semibold text-lg mb-6 text-primary flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 6a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V6zM9 14a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                                        </svg>
                                        Lower Wear Measurements
                                    </h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {#each requiredMeasurements.filter(m => m.wear_type === 'lower') as measurement}
                                            <div class="measurement-input-group space-y-2">
                                                <label class="block text-sm font-medium text-gray-700">
                                                    {measurement.name}
                                                </label>
                                                <div class="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        name="measurement_{measurement.id}"
                                                        value={editingStudent?.measurements?.[measurement.id] || ''}
                                                        class="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        placeholder="Base: {measurement.base_cm}cm"
                                                        required
                                                    />
                                                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">cm</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </form>
            </div>
            
            <!-- Modal Footer -->
            <div class="border-t px-8 py-5 bg-gray-50/50 rounded-b-xl">
                <div class="flex justify-end gap-3">
                    <button
                        type="button"
                        class="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
                        on:click={resetForm}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="studentForm"
                        class="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium"
                    >
                        {modalMode === 'create' ? 'Create Student' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
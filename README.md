Structure and flow:
# Complete Detailed System Flow of JOMS (Job Order Management System)

## Initial System Access
1. System starts with a login page
   - Username field
   - Password field
   - "Login" button
   - System validates credentials against profiles table
   - Redirects to appropriate dashboard based on role (admin/employee)

## Admin Portal Detailed Flow

### Account Management
1. Creating Admin Accounts
   - From dashboard, click "Manage Accounts" in sidebar
   - Click "Create New Admin" button
   - Fill out form:
     - First Name (required)
     - Last Name (required)
     - Username (required, unique)
     - Password (required, with strength requirements)
     - Confirm Password
   - "Create Account" button saves to profiles table with role='admin'
   - Success message shows "Admin account created successfully"

2. Creating Employee (Tailor) Accounts
   - Similar form to admin creation
   - "Create New Employee" button in accounts page
   - Same fields as admin creation
   - Role automatically set to 'employee'
   - Success message shows "Employee account created successfully"

### Configuration Management

1. Measurement Types Setup
   - Navigate to "Measurement Types" in sidebar
   - "Add New Measurement" button opens form:
     - Name field (required, unique)
     - "Save Measurement" button
   - Listed in table with columns:
     - Measurement Name
     - Created Date
     - "Edit" button
     - "Delete" button (only if unused)
   - Search bar filters measurement types by name
   - Sort by any column (clickable headers)

2. Course Management
   - "Courses" section in sidebar
   - "Add New Course" button opens form:
     - Course Name field (required, unique)
     - "Save Course" button
   - Courses listed in table:
     - Course Name
     - Created Date
     - Student Count
     - "Edit" button
     - "Delete" button (only if no students/configs)

3. Uniform Configuration Setup
   - "Uniform Configurations" in sidebar
   - "Create New Configuration" button opens multi-step form:
     
     Step 1: Basic Details
     - Course dropdown (required)
     - Gender radio buttons (MALE/FEMALE)
     - Wear Type radio buttons (UPPER/LOWER)
     - Base Price field (required, numeric)
     
     Step 2: Measurement Selection
     - Checklist of all measurement types
     - "Select All" and "Clear All" buttons
     - "Previous" and "Next" buttons
     
     Step 3: Review & Confirm
     - Shows all selected options
     - "Confirm" button saves configuration
   
   - Configurations listed in table with filters:
     - Course filter dropdown
     - Gender filter
     - Wear Type filter
     - Date range picker

### Student Management

1. Student Registration
   - "Students" section in sidebar
   - "Register New Student" button opens multi-step form:

     Step 1: Personal Information
     - First Name (required)
     - Last Name (required)
     - Course dropdown (required)
     - Year Level dropdown (1-4)
     - Gender radio buttons
     - Contact Number (required)
     - "Next" button

     Step 2: Measurements
     - System automatically shows required measurement fields based on:
       - Selected course
       - Selected gender
     - Each measurement has:
       - Label (from measurement_types)
       - Value input field (numeric, required)
     - "Previous" and "Submit" buttons

2. Student Search & Management
   - Search bar for quick student lookup
   - Filter options:
     - Course dropdown
     - Year Level dropdown
     - Gender dropdown
   - Sort options for each column
   - "Edit" button for each student:
     - Opens form with current values
     - Can update any field
   - "View Measurements" button:
     - Shows all recorded measurements
     - Option to update measurements

### Order Processing

1. Creating New Orders
   - "Orders" in sidebar
   - "Create New Order" button opens multi-step form:

     Step 1: Student Selection
     - Student search field (typeahead)
     - Shows matching students with:
       - Name
       - Course
       - Year Level
     - "Next" button

     Step 2: Order Details
     - Wear Type selection (UPPER/LOWER)
     - Quantity input
     - System displays:
       - Base price (from config)
       - Total amount (calculated)
     - "Next" button

     Step 3: Assignment
     - Employee dropdown (role='employee')
     - Due date picker
     - Special instructions text area
     - "Create Order" button

2. Order Management
   - Orders listed in table with:
     - Status indicators (color-coded)
     - Filter options:
       - Status multi-select
       - Date range
       - Course
       - Employee assigned
     - Sort by any column
   - Actions for each order:
     - "View Details" button:
       - Shows all order information
       - Student details
       - Measurements
       - Current status
     - "Edit" button (if PENDING):
       - Can change employee assignment
       - Can update quantity
     - "Cancel Order" button (if PENDING)

### Dashboard Analytics
- Top section:
  - Total Orders card
  - Pending Orders card
  - Completed Orders card
  - Total Revenue card
- Charts section:
  - Orders by Status pie chart
  - Daily Orders line chart
  - Revenue by Course bar chart
- Recent Orders table:
  - Last 10 orders
  - Quick status update buttons
- Filter controls:
  - Date range picker
  - Course filter
  - Status filter

## Employee (Tailor) Portal Detailed Flow

### Dashboard
- Active Orders card:
  - Shows count of PENDING/IN_PROGRESS
- Today's Tasks card:
  - Lists orders due today
- Quick Actions:
  - "Start Next Order" button
  - "Mark Complete" button

### Order Management
1. Viewing Assigned Orders
   - Default view shows PENDING orders
   - Filter options:
     - Status dropdown
     - Date range picker
   - Each order shows:
     - Student details
     - Required measurements
     - "Start Work" button (for PENDING)
     - "Mark Complete" button (for IN_PROGRESS)

2. Order Processing
   - Click "Start Work":
     - Status changes to IN_PROGRESS
     - Timestamp recorded
   - Click "Mark Complete":
     - Status changes to COMPLETED
     - Completion timestamp recorded

### Profile & Settings
1. Profile View
   - Personal information display
   - Statistics:
     - Total orders completed
     - Average completion time
     - Current active orders

2. Password Management
   - "Change Password" button opens form:
     - Current Password
     - New Password
     - Confirm New Password
   - "Update Password" button

## System Rules & Validations

1. Order Creation Rules
   - Student must exist
   - Student must have all required measurements
   - Selected uniform config must exist
   - Employee must be active

2. Status Update Rules
   - Only assigned employee can update status
   - Status must follow sequence:
     PENDING → IN_PROGRESS → COMPLETED

3. Measurement Rules
   - All measurements must be positive numbers
   - All required measurements must be recorded

4. Configuration Rules
   - Cannot delete measurement type if used in config
   - Cannot delete course if has students/configs
   - Base price must be positive

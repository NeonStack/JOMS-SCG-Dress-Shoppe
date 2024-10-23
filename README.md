NAVIGATIONS:
# Admin Portal Navigation
## 1. Dashboard /
### Orders Overview
- Total Orders Card
  - Count of all orders
  - Percentage change from previous period
  - Quick filters:
    - Today
    - Last 7 days
    - Last 30 days
    - Custom date range
- Orders by Status Cards
  - PENDING count
  - IN_PROGRESS count
  - COMPLETED count
  - Each with percentage change
- Orders Timeline Chart
  - X-axis: Time periods
  - Y-axis: Number of orders
  - Filter by:
    - Last 7 days (daily)
    - Last 30 days (weekly)
    - Last 12 months (monthly)
    - Custom range
- Revenue Overview
  - Total revenue card
  - Revenue by course pie chart
  - Revenue timeline chart
    - Same time period filters as Orders Timeline

## 2. Order Management/ fix the course (showing undefined when orders)
### View Orders
- Table Columns:
  - Order ID
  - Student Name (first_name + last_name)
  - Course (from courses table)
  - Wear Type (UPPER/LOWER)
  - Quantity
  - Total Amount
  - Assigned To (employee first_name + last_name)
  - Status
  - Created Date
  - Completed Date
- Sorting Options (for each column):
  - Order ID (asc/desc)
  - Student Name (asc/desc)
  - Course (asc/desc)
  - Total Amount (asc/desc)
  - Created Date (asc/desc)
  - Completed Date (asc/desc)
- Filtering Options:
  - Status (multi-select: PENDING/IN_PROGRESS/COMPLETED)
  - Course (multi-select from courses table)
  - Wear Type (multi-select: UPPER/LOWER)
  - Date Range (created_at)
  - Assigned Employee (multi-select from profiles where role='employee')
- Search:
  - By Order ID
  - By Student Name
  - By Employee Name

### Create Order
- Student Selection
  - Searchable dropdown
  - Shows: ID, Full Name, Course, Year Level
- Auto-populated fields after student selection:
  - Course
  - Gender
  - Year Level
- Wear Type Selection
  - Radio buttons: UPPER/LOWER
  - Auto-populates based price from uniform_configs
- Quantity
  - Number input (min: 1)
- Total Amount
  - Auto-calculated (base_price * quantity)
  - Read-only field
- Assign to Employee
  - Dropdown of employees (profiles where role='employee')
  - Shows: Full Name
- Initial Status
  - Defaulted to 'PENDING'
  - Non-editable on creation

## 3. Student Management/ maybe adjust design
### View Students
- Table Columns:
  - Student ID
  - First Name
  - Last Name
  - Course
  - Year Level
  - Gender
  - Contact Number
  - Registration Date
- Sorting Options (for each column):
  - Student ID (asc/desc)
  - First Name (asc/desc)
  - Last Name (asc/desc)
  - Course (asc/desc)
  - Year Level (asc/desc)
  - Registration Date (asc/desc)
- Filtering Options:
  - Course (multi-select from courses table)
  - Year Level (multi-select: 1,2,3,4)
  - Gender (multi-select: MALE/FEMALE)
  - Registration Date Range
- Search:
  - By Student ID
  - By First Name
  - By Last Name
  - By Contact Number

### Register Student
- Personal Information Form
  - First Name (required)
    - Text input
    - Max length: 50
  - Last Name (required)
    - Text input
    - Max length: 50
  - Course (required)
    - Dropdown from courses table
  - Year Level (required)
    - Dropdown (1-4)
  - Gender (required)
    - Radio buttons: MALE/FEMALE
  - Contact Number (required)
    - Text input
    - Max length: 20
    - With format validation
- Measurements Section
  - Dynamically loaded based on course and gender
  - Shows all required measurements from uniform_configs
  - For each measurement:
    - Label (from measurement_types table)
    - Decimal input field
    - Value validation (positive numbers only)
[Previous sections remain the same - continuing with remaining sections]

## 4. Measurement Types Management / fix date start - end (oct 22- oct 22 wont show)
### View Measurement Types
- Table Columns:
  - Measurement Type ID
  - Name
  - Created Date
  - Usage Count (count of config_required_measurements references)
- Sorting Options:
  - Measurement Type ID (asc/desc)
  - Name (asc/desc)
  - Created Date (asc/desc)
  - Usage Count (asc/desc)
- Filtering Options:
  - Created Date Range
  - Used/Unused (based on config_required_measurements)
- Search:
  - By Measurement Type ID
  - By Name

### Add Measurement Type
- Form Fields:
  - Name (required)
    - Text input
    - Max length: 50
    - Unique validation
  - Created Date
    - Auto-populated with current timestamp
    - Non-editable

### Edit Measurement Type
- Same fields as Add
- Shows current usage in uniform configurations
- Validation to prevent editing if in use

## 5. Uniform Configuration Management/ fix front end
### View Configurations
- Table Columns:
  - Config ID
  - Course Name (from courses table)
  - Gender
  - Wear Type
  - Base Price
  - Required Measurements Count
  - Created Date
- Sorting Options:
  - Config ID (asc/desc)
  - Course Name (asc/desc)
  - Base Price (asc/desc)
  - Created Date (asc/desc)
  - Required Measurements Count (asc/desc)
- Filtering Options:
  - Course (multi-select from courses)
  - Gender (multi-select: MALE/FEMALE)
  - Wear Type (multi-select: UPPER/LOWER)
  - Created Date Range
  - Price Range
- Search:
  - By Config ID
  - By Course Name

### Create/Edit Configuration
- Basic Info Form
  - Course Selection (required)
    - Dropdown from courses table
  - Gender (required)
    - Radio buttons: MALE/FEMALE
  - Wear Type (required)
    - Radio buttons: UPPER/LOWER
  - Base Price (required)
    - Decimal input
    - Minimum: 0.01
- Required Measurements Section
  - Multi-select from measurement_types table
  - Shows:
    - Measurement Name
    - Created Date
  - Ability to select/deselect measurements

## 6. Account Management
### View Employee Accounts
- Table Columns:
  - Employee ID (from profiles table)
  - First Name
  - Last Name
  - Role (always 'employee')
  - Created Date
  - Active Orders Count
  - Completed Orders Count
- Sorting Options:
  - Employee ID (asc/desc)
  - First Name (asc/desc)
  - Last Name (asc/desc)
  - Created Date (asc/desc)
  - Active Orders Count (asc/desc)
  - Completed Orders Count (asc/desc)
- Filtering Options:
  - Created Date Range
  - Has Active Orders (yes/no)
- Search:
  - By Employee ID
  - By First Name
  - By Last Name

### Create Employee Account
- Personal Information Form
  - First Name (required)
    - Text input
    - Max length: 50
  - Last Name (required)
    - Text input
    - Max length: 50
  - Role
    - Defaulted to 'employee'
    - Non-editable
- Account Credentials
  - Username (required)
    - Text input
    - Unique validation
  - Password (required)
    - Password input
    - Minimum 8 characters
    - Requires mixture of letters, numbers, special characters
  - Confirm Password (required)
    - Must match Password

### View Admin Accounts
- Similar columns to Employee Accounts
- Additional columns:
  - Last Login Date
  - Account Status (Active/Inactive)

### Create Admin Account
- Similar to Employee Account creation
- Role defaulted to 'admin'

## 7. Course Management /
### View Courses
- Table Columns:
  - Course ID
  - Course Name
  - Created Date
  - Student Count
  - Active Uniform Configs Count
- Sorting Options:
  - Course ID (asc/desc)
  - Course Name (asc/desc)
  - Created Date (asc/desc)
  - Student Count (asc/desc)
- Filtering Options:
  - Created Date Range
  - Has Active Configs (yes/no)
- Search:
  - By Course ID
  - By Course Name

### Add/Edit Course
- Form Fields:
  - Course Name (required)
    - Text input
    - Max length: 100
    - Unique validation
  - Created Date
    - Auto-populated with current timestamp
    - Non-editable

# Employee (Tailor) Portal Navigation

## 1. Dashboard
### Orders Overview
- Active Orders Card
  - Count of assigned PENDING orders
  - Count of assigned IN_PROGRESS orders
- Today's Orders
  - List view of orders due today
  - Shows:
    - Student Name
    - Wear Type
    - Quantity
    - Measurements
- Orders by Status Chart
  - Pie chart showing:
    - PENDING count
    - IN_PROGRESS count
    - COMPLETED count
  - Filter by:
    - Today
    - This Week
    - This Month
    - Custom Range

## 2. Order Management
### View My Orders
- Table Columns:
  - Order ID
  - Student Name
  - Course
  - Wear Type
  - Quantity
  - Total Amount
  - Status
  - Created Date
  - Required Measurements (expandable row)
- Sorting Options:
  - Order ID (asc/desc)
  - Student Name (asc/desc)
  - Created Date (asc/desc)
  - Status (asc/desc)
- Filtering Options:
  - Status (multi-select: PENDING/IN_PROGRESS/COMPLETED)
  - Created Date Range
  - Wear Type (UPPER/LOWER)
- Search:
  - By Order ID
  - By Student Name

### Update Order Status
- Status Options:
  - PENDING to IN_PROGRESS
  - IN_PROGRESS to COMPLETED
- Auto-updates completed_at when status changes to COMPLETED

## 3. Profile Settings
### View Profile
- Display Fields (non-editable):
  - Employee ID
  - First Name
  - Last Name
  - Role
  - Created Date
  - Total Orders Completed
  - Current Active Orders

### Change Password
- Form Fields:
  - Current Password (required)
  - New Password (required)
    - Minimum 8 characters
    - Requires mixture of letters, numbers, special characters
  - Confirm New Password (required)
    - Must match New Password




Structure and flow:
# Complete Detailed System Flow of JOMS (Uniform Order Management System)

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

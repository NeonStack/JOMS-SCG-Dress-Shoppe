navigation... 
it will have superadmin, admin, and employee.

i am planning these navigations, but each should have like displaying the data like date created as well as sorting when i click the label or custom dropdown filter well maybe except for no table like dashboard but only if there are not?... and add, edit, delete

1. dashboard which has analytics

2. measurement types management... so here, we will just add the measurement types like hip, shoulder, arm, legs... and thats probably it... it will be just a pool of measurement types the admin can use later for uniform configuration

3. course management, so here, admin will just add courses like BSIT, BSN which will also be used on student management and uniform configuration

4. uniform configuration... so here we will add a customized uniform config... so for example for MALE (gender), BSIT (course) students we will input the measurement types required for UPPER AND LOWER wear, so like for upper, i could add shoulder and arm... and for lower, i could just only check the legs... which are all found in the measurement types management... we will put base price here but i couldnt undertand how can we have like additional payment if the cm is longer like 10cm longer... and so on...

5. after that, we can now go to student management where students info will be inputted... like name, gender, course (get from course management).. as long as the gender and course were selected, the measurement types should pop up... so for MALE, BSIT... the upper and lower measurement input should pop up which are for upper, the shoulder and arm, and for lower, the legs... i think that will be it... 

6. account management, so in account management, we have superadmin, admin, and employee.... superadmin can create admin and employee... admin can only create employee accounts... now, everything shoould have infos like first name, last name, what else? position/role... age, address? and something like that the important stuff

7. now in order management... if student want to buy, we can just select students who are registered to the student management.. then the admin can just select what students want, is it upper, lower, or both wear... which has calculations as well as due dates... then confirm or submit... now on the same navigation/page... the orders can be sorted be right? the main sorting are the due dates which has a range... like due dates from nov 1, 2024 to nov 21, 2024.. i can select all that and assign in to the and existing employee.....


---
# JOMS - Tailoring Management System Documentation

## System Overview
A comprehensive web-based tailoring management system designed for handling school uniform orders and measurements. The system streamlines the process of uniform creation, from student measurements to order fulfillment and employee task management.

## Access Levels
- **SuperAdmin**: Complete system control, can create both admin and employee accounts. Has access to all features and analytics.
- **Admin**: Similar to SuperAdmin but cannot create admin accounts. Can manage all operational aspects and create employee accounts.
- **Employee**: Limited access focused on order management. Can only view and update assigned orders.

## Core Features Superadmin/Admin

### Dashboard
The central analytics hub displaying:
- Total orders statistics with daily/weekly/monthly breakdowns
- Revenue tracking and forecasts
- Pending orders count and alerts
- Due orders notifications
- Course-wise uniform distribution charts
- Employee performance metrics
- Quick access to critical functions

### Measurement Types Management
A centralized repository for all measurement definitions:
- ID (auto-generated unique identifier)
- Name (e.g., shoulder width, hip circumference)
- Description (how to take the measurement)
- Category (Upper/Lower wear classification)
- Status (Active/Inactive)
- Created/Modified timestamps
- Standard CRUD operations
Purpose: Serves as a master list for uniform configurations

### Course Management
Academic program database management:
- ID (auto-generated unique identifier)
- Course code (e.g., BSIT, BSN)
- Course name (full program title)
- Department affiliation
- Status (Active/Inactive)
- Created/Modified timestamps
- Standard CRUD operations
Purpose: Links students to specific uniform requirements

### Uniform Configuration
Defines uniform specifications per course and gender:
- ID (auto-generated unique identifier)
- Gender selection (Male/Female)
- Course (pulled from Course Management)
- Category (Upper/Lower wear)
- Required measurements (from Measurement Types)
- Base price setting
- Additional charges rules:
  * Measurement type
  * Range in centimeters
  * Additional cost calculation
- Status (Active/Inactive)
- Created/Modified timestamps
- Standard CRUD operations
Purpose: Creates standardized uniform specifications

### Student Management
Comprehensive student information system:
- ID (auto-generated unique identifier)
- Student number
- Complete name (First, Middle, Last)
- Gender
- Course (from Course Management)
- Measurements (auto-populated based on uniform configuration)
- Status (Active/Inactive)
- Created/Modified timestamps
- Standard CRUD operations
Purpose: Maintains student profiles and measurements

### Account Management
User account control system:
- ID (auto-generated unique identifier)
- Role designation (SuperAdmin/Admin/Employee)
- Complete name (First, Middle, Last)
- Email address
- Contact information
- Physical address
- Position/Title
- Status (Active/Inactive)
- Created/Modified timestamps
- Standard CRUD operations
Purpose: Manages system access and user roles

### Order Management
Complete order processing system:
- ID (auto-generated unique identifier)
- Student selection (from Student Management)
- Order type (Upper/Lower/Both)
- Measurements verification
- Base price calculation
- Additional charges computation
- Total amount
- Due date assignment
- Order status tracking
- Employee assignment
- Created/Modified timestamps
- Actions (Create/View/Edit/Delete/Assign)
Purpose: Handles the entire order lifecycle

## Employee Portal Features
Specialized interface for employees:

### 1. Employee Dashboard
- Assigned orders counter
- Due today alerts
- Pending orders list
- Quick status updates

### 2. Order Management
- Assigned orders view
- Filtering capabilities:
  * Due date ranges
  * Order status
  * Student information
  * Course selection
- Status update functionality
- Notes and comments system

### 3. Profile Management
- Personal information view
- Password management
- Activity history

## Global Features
System-wide functionalities:
- Sortable data tables (click column headers)
- Advanced filtering options
- Global search functionality
- Date range selections
- Export capabilities (Excel/PDF)
- Pagination controls
- Audit logging
- Data backup systems
- User activity monitoring

## Technical Requirements
System specifications:
- Responsive web design
- Role-based access control
- Data validation systems
- Error logging mechanisms
- Automated backup procedures
- API documentation
- Security implementations
- Performance optimization

## Reporting System
### 1. Sales Reports
- Time-based analysis (Daily/Weekly/Monthly/Annual)
- Course-wise breakdown
- Uniform type distribution
- Employee performance metrics

### 2. Order Status Reports
- Pending orders tracking
- Completed orders summary
- Delayed orders analysis

### 3. Employee Performance Reports
- Order completion rates
- Delivery timeliness
- Customer satisfaction metrics

### 4. Inventory Reports
- Material utilization
- Cost analysis
- Wastage tracking

Each feature includes sorting, filtering, and export capabilities unless specifically noted otherwise. All data operations maintain audit trails and backup procedures.

----------------------------------------------------------------------------------

-- Create a profile table to link to Supabase auth.users
create table profile (
    id uuid references auth.users (id) on delete cascade primary key,
    first_name text not null,
    last_name text not null,
    role text check (role in ('superadmin', 'admin', 'employee')),
    contact_number text, -- Stores contact number
    address text, -- Stores address information
    position text, -- Additional role-based details if necessary
    created_at timestamp default now()
);

-- Measurement Types Management
create table measurement_types (
    id serial primary key,
    name text unique not null, -- Example: 'hip', 'shoulder', etc.
    created_at timestamp default now()
);

-- Course Management
create table courses (
    id serial primary key,
    course_code text unique not null, -- Example: 'BSIT', 'BSN'
    description text, -- Optional description for course
    created_at timestamp default now()
);

-- Uniform Configuration
create table uniform_configuration (
    id serial primary key,
    gender text check (gender in ('male', 'female', 'unisex')) not null,
    course_id int references courses(id) on delete set null,
    measurement_type_ids int[] references measurement_types(id), -- List of measurement types required
    base_price numeric(10, 2) not null, -- Base price for configuration
    additional_cost_per_cm numeric(10, 2) default 0, -- Extra cost per cm beyond standard
    created_at timestamp default now()
);

-- Student Management
create table students (
    id serial primary key,
    first_name text not null,
    last_name text not null,
    gender text check (gender in ('male', 'female')) not null,
    course_id int references courses(id) on delete set null,
    contact_number text, -- Stores contact number
    address text, -- Stores address information
    created_at timestamp default now()
);

-- Order Management
create table orders (
    id serial primary key,
    student_id int references students(id) on delete set null,
    uniform_type text check (uniform_type in ('upper', 'lower', 'both')) not null,
    measurements jsonb not null, -- Stores measurement data in JSON
    due_date date not null,
    status text check (status in ('pending', 'in progress', 'completed')) default 'pending',
    employee_id uuid references profile(id) on delete set null, -- Assigned employee for the order
    total_amount numeric(10, 2) not null,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Payment Management
create table payments (
    id serial primary key,
    order_id int references orders(id) on delete cascade,
    amount_paid numeric(10, 2) not null,
    payment_date date default current_date,
    status text check (status in ('partial', 'fully paid')) default 'partial',
    created_at timestamp default now()
);

-- Insert role data for testing purposes
insert into profile (id, first_name, last_name, role, contact_number, address, position)
values 
    ('e1b3c4d5-e6f7-8901-2345-6789abcdef01', 'Super', 'Admin', 'superadmin', '123456789', '123 Super St', 'Super Administrator'),
    ('f2a3b4c5-d6e7-8901-2345-6789abcdef02', 'Jane', 'Admin', 'admin', '987654321', '456 Admin Blvd', 'Administrator'),
    ('a3b2c1d5-e6f7-8901-2345-6789abcdef03', 'John', 'Employee', 'employee', '112233445', '789 Employee Rd', 'Staff');

------------------------------------------------------

---

### **Complete Navigation Structure for JOMS Tailoring Business**

---

1. **Dashboard**  
   - **Description**: Displays key analytics like order counts, revenue, and user activity.  
   - **Features**:  
     - **View Analytics**: Summary of metrics like total orders, completed orders, and revenue.
     - **Date Sorting**: Sort data by specific dates or date ranges.

2. **Measurement Types Management**  
   - **Description**: Maintains a pool of measurement types (e.g., hip, shoulder, arm, legs) for future use in uniform configurations.  
   - **Features**:  
     - **Add/Edit/Delete**: Create new measurement types, modify existing ones, or remove obsolete types.
     - **Measurement Descriptions**: Optional descriptions (e.g., "Arm: Measured from shoulder to wrist") to clarify the usage of each measurement type.
     - **Display Created Date**: Shows the date when each measurement type was added.
     - **Sorting/Filtering**: Sort by name, date created, or a custom dropdown filter (e.g., alphabetical order).

3. **Course Management**  
   - **Description**: Manages courses (e.g., BSIT, BSN) that are linked to student management and uniform configurations.  
   - **Features**:  
     - **Add/Edit/Delete**: Add new courses, modify names, or remove unused courses.
     - **Active/Inactive Status**: Mark courses as inactive if they are no longer needed, which hides them from selection without deleting historical data.
     - **Display Created Date**: Shows the date each course was added.
     - **Sorting**: Sort by name, date created, or filter courses as needed.

4. **Uniform Configuration**  
   - **Description**: Customizes uniforms per gender and course, selecting required measurement types for upper and lower body garments.  
   - **Features**:  
     - **Add/Edit/Delete Configurations**: Set required measurements (e.g., "shoulder" and "arm" for upper, "legs" for lower) based on gender and course.
     - **Base Price and Additional Pricing**: Define a base price with optional rules for extra charges if measurements exceed a standard threshold (e.g., +5% for each additional 10 cm over a specified length).
     - **Measurement Guidelines**: Add optional fields for specific instructions (e.g., "Measure shoulder from left to right edge") to guide the measurement process.
     - **Display Date**: Shows the date each configuration was created.
     - **Sorting**: Filter configurations by gender, course, and price.

5. **Student Management**  
   - **Description**: Maintains student profiles, linked to measurement configurations based on selected course and gender.  
   - **Features**:  
     - **Add/Edit/Delete Student Info**: Input details such as name, gender, course, and relevant measurements.
     - **Contact Information**: Include phone number and email for each student for communication purposes.
     - **Guardian Contact (Optional)**: For younger students, add an alternate contact field (e.g., parent or guardian) if needed.
     - **Automatic Measurement Type Display**: Populates required measurements (e.g., "shoulder" and "arm" for male BSIT students) based on course and gender selection.
     - **Display Created Date**: Shows the date each student profile was created.
     - **Sorting**: Filter by course, gender, date created, or other criteria as needed.

6. **Account Management**  
   - **Description**: Manages user accounts for superadmin, admin, and employee roles, including profile details.  
   - **Features**:  
     - **Add/Edit/Delete Accounts**: Manage user accounts with fields like name, position/role, phone number, email, age, and address.
     - **Role Restrictions**: Superadmins can create both admin and employee accounts, while admins can only create employee accounts.
     - **Display Created Date**: Shows when each account was created.
     - **Sorting**: Sort by name, role, date created, and other relevant fields.

7. **Order Management**  
   - **Description**: Handles orders, linking students with specific uniform items (upper, lower, or both) and tracking due dates and assignment to employees.  
   - **Features**:  
     - **Create Orders**: Select registered students and specify ordered items (e.g., upper, lower, or both).
     - **Contact Details Linked to Orders**: Show student contact info on each order for easy communication.
     - **Due Date and Payment Status Filters**: Filter orders by due date range and payment status to manage workload effectively.
     - **Assign Orders to Employees**: Bulk assign selected orders to an employee.
     - **Order Progress Tracking**: Optional order status (e.g., "In Process," "Ready for Pickup") to monitor each order’s stage.
     - **Display Created Date**: Shows order creation and due dates.
     - **Sorting**: Sort orders by due date, payment status, or student.

8. **Payment Management**  
   - **Description**: Tracks payments for each order, marking status as partially or fully paid.  
   - **Features**:  
     - **Record Payments**: Record partial or full payments for each order.
     - **Transaction History**: Log each partial payment’s date and amount to maintain a clear payment record.
     - **Payment Status**: Update status based on payments (e.g., "Partially Paid," "Fully Paid").
     - **Automated Notifications**: Option to notify students when payments are due or if there’s an outstanding balance.
     - **Sorting**: Filter by payment status, date, and amount.

---

### **Role-Based Navigation Access**

1. **Superadmin**  
   - **Access to All Sections and Features**: Full access to **Dashboard**, **Measurement Types Management**, **Course Management**, **Uniform Configuration**, **Student Management**, **Account Management**, **Order Management**, and **Payment Management**.
   - **Account Management**: Can create both admin and employee accounts.

2. **Admin**  
   - **Access to All Sections Except Restricted Account Management**: Same access as superadmin except for restricted ability to create only employee accounts.
   - **Account Management**: Can only create and manage employee accounts.

3. **Employee**  
   - **Limited Access**:  
     - **Dashboard**: View tasks and order summaries relevant to their assignments.
     - **Order Management**: Access only to their assigned orders, with options to update order status and completion.
     - **Payment Management**: View (read-only or limited edit access) payment status for their assigned orders.


----------last

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


database?
-- Step 1: Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create users in auth.users first (this is a simplified version for demonstration)
-- In reality, users are typically created through Supabase Auth UI or API
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES 
    ('123e4567-e89b-12d3-a456-426614174000', 'john@example.com', now(), now(), now()),
    ('123e4567-e89b-12d3-a456-426614174001', 'jane@example.com', now(), now(), now());

-- Step 3: Create all tables in the correct order
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'employee',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE measurement_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uniform_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id),
    gender VARCHAR(10),
    wear_type VARCHAR(10),
    base_price DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, gender, wear_type)
);

CREATE TABLE config_required_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uniform_config_id UUID REFERENCES uniform_configs(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(uniform_config_id, measurement_type_id)
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    course_id UUID REFERENCES courses(id),
    year_level INTEGER,
    gender VARCHAR(10),
    contact_number VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id),
    value DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, measurement_type_id)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    uniform_config_id UUID REFERENCES uniform_configs(id),
    quantity INTEGER NOT NULL,
    total_amount DECIMAL(10, 2),
    assigned_to UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Step 4: Insert data in the correct order (respecting foreign key constraints)
-- 4.1: Insert profiles (now that we have users)
INSERT INTO profiles (id, first_name, last_name, role) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'John', 'Doe', 'admin'),
    ('123e4567-e89b-12d3-a456-426614174001', 'Jane', 'Smith', 'employee');

-- 4.2: Insert courses
INSERT INTO courses (id, name) VALUES
    ('123e4567-e89b-12d3-a456-426614174002', 'BSIT'),
    ('123e4567-e89b-12d3-a456-426614174003', 'BSCS');

-- 4.3: Insert measurement types
INSERT INTO measurement_types (id, name) VALUES
    ('123e4567-e89b-12d3-a456-426614174004', 'Shoulder Width'),
    ('123e4567-e89b-12d3-a456-426614174005', 'Chest'),
    ('123e4567-e89b-12d3-a456-426614174006', 'Waist'),
    ('123e4567-e89b-12d3-a456-426614174007', 'Hip'),
    ('123e4567-e89b-12d3-a456-426614174008', 'Sleeve Length'),
    ('123e4567-e89b-12d3-a456-426614174009', 'Inseam Length');

-- 4.4: Insert uniform configs
INSERT INTO uniform_configs (id, course_id, gender, wear_type, base_price) VALUES
    ('123e4567-e89b-12d3-a456-426614174010', '123e4567-e89b-12d3-a456-426614174002', 'MALE', 'UPPER', 500.00),
    ('123e4567-e89b-12d3-a456-426614174011', '123e4567-e89b-12d3-a456-426614174002', 'MALE', 'LOWER', 400.00);

-- 4.5: Insert config required measurements
INSERT INTO config_required_measurements (uniform_config_id, measurement_type_id) VALUES
    ('123e4567-e89b-12d3-a456-426614174010', '123e4567-e89b-12d3-a456-426614174004'),
    ('123e4567-e89b-12d3-a456-426614174010', '123e4567-e89b-12d3-a456-426614174005'),
    ('123e4567-e89b-12d3-a456-426614174010', '123e4567-e89b-12d3-a456-426614174008'),
    ('123e4567-e89b-12d3-a456-426614174011', '123e4567-e89b-12d3-a456-426614174006'),
    ('123e4567-e89b-12d3-a456-426614174011', '123e4567-e89b-12d3-a456-426614174009');

-- 4.6: Insert students
INSERT INTO students (id, first_name, last_name, course_id, year_level, gender, contact_number) VALUES
    ('123e4567-e89b-12d3-a456-426614174012', 'Mark', 'Johnson', '123e4567-e89b-12d3-a456-426614174002', 2, 'MALE', '123-456-7890');

-- 4.7: Insert student measurements
INSERT INTO student_measurements (student_id, measurement_type_id, value) VALUES
    ('123e4567-e89b-12d3-a456-426614174012', '123e4567-e89b-12d3-a456-426614174004', 45.5),
    ('123e4567-e89b-12d3-a456-426614174012', '123e4567-e89b-12d3-a456-426614174005', 95.0),
    ('123e4567-e89b-12d3-a456-426614174012', '123e4567-e89b-12d3-a456-426614174008', 65.0);

-- 4.8: Insert orders
INSERT INTO orders (id, student_id, uniform_config_id, quantity, total_amount, assigned_to, status) VALUES
    ('123e4567-e89b-12d3-a456-426614174013', '123e4567-e89b-12d3-a456-426614174012', '123e4567-e89b-12d3-a456-426614174010', 2, 1000.00, '123e4567-e89b-12d3-a456-426614174001', 'PENDING');

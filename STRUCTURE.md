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

Filtering capabilities:
- Search by measurement name
- Sort by:
  * Name (A-Z, Z-A)
  * Creation date (Newest/Oldest)
- Status filter (Active/Inactive)
- Category filter (Upper/Lower wear)

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
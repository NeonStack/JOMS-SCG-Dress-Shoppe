-- Changed timezone to Asia Singapore (Philippines time)
alter database postgres
set timezone to 'Asia/Singapore';

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create a profile table
create table profiles (
id uuid references auth.users not null primary key,
first_name text not null,
last_name text not null,
role text not null check (role in ('superadmin', 'admin', 'employee')),
contact_number text,
address text,
position text,
created_at timestamptz default now() not null
);

create table measurement_types (
id serial primary key,
name text not null,
created_at timestamptz default now() not null,
unique(name)
);

create table courses (
id serial primary key,
course_code text not null,
description text,
created_at timestamptz default now() not null,
unique(course_code)
);

CREATE TABLE uniform_configuration (
id serial primary key,
gender text not null check (gender in ('male', 'female', 'unisex')),
course_id int references courses(id),
wear_type text not null check (wear_type in ('upper', 'lower')),
measurement_specs jsonb not null default '[]',
--eg. [{"measurement_type_id": 1, "base_cm": 40, "additional_cost_per_cm": 2.50}, {"measurement_type_id": 2, "base_cm": 90, "additional_cost_per_cm": 3.00}]
base_price numeric(10, 2) not null,
created_at timestamptz default now() not null,
unique(course_id, gender, wear_type)
);

CREATE INDEX idx_uniform_config_wear_type ON uniform_configuration(wear_type);
CREATE INDEX idx_uniform_config_course ON uniform_configuration(course_id);

create table students (
id serial primary key,
first_name text not null,
last_name text not null,
gender text not null check (gender in ('male', 'female')),
course_id int references courses(id),
contact_number text,
address text,
measurements jsonb, -- New column for measurements
created_at timestamptz default now() not null
);

create table orders (
id serial primary key,
student_id int references students(id),
uniform_type text not null check (uniform_type in ('upper', 'lower', 'both')),
due_date date not null,
status text not null check (status in ('pending', 'in progress', 'completed')) default 'pending',
employee_id uuid references profiles(id),
total_amount numeric(10, 2) not null,
amount_paid numeric(10, 2) not null default 0,
balance numeric(10, 2) generated always as (total_amount - amount_paid) stored,
payment_date date,
completed_at timestamptz,
payment_status text not null check (payment_status in ('not paid', 'partial', 'fully paid')) default 'not paid',
order_measurements jsonb,
payment_updated_by text,
assigned_by text,
created_at timestamptz default now() not null,
updated_at timestamptz default now() not null
);

create table admin_permissions (
id serial primary key,
admin_id uuid references profiles(id),
route_path text not null,
is_permitted boolean default true,
created_at timestamptz default now() not null,
unique(admin_id, route_path)
);

-- Create indexes for foreign keys
create index idx_uniform_config_course on uniform_configuration(course_id);
create index idx_students_course on students(course_id);
create index idx_orders_student on orders(student_id);
create index idx_orders_employee on orders(employee_id);

-- Insert role data for testing purposes
insert into profiles (id, first_name, last_name, role, contact_number, address, position)
values
('2eb9f794-5018-4831-af04-3d41ca657d35', 'Super', 'Admin', 'superadmin', '09787819382', 'Quezon City', 'Super Administrator'),
('ca139524-6c87-45e4-b117-918d36e6a9f7', 'Jane', 'Admin', 'admin', '09890192838', 'Manila Philippines', 'Administrator'),
('bb027377-0506-49ba-a026-7a16d74cf46d', 'John', 'Employee', 'employee', '09109090930', 'Caloocan Ph5', 'Staff');

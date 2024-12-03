@startuml JOMS Use Case Diagram
left to right direction
skinparam actorStyle awesome

' Actors
actor "Employee" as em
actor "Admin" as ad
actor "SuperAdmin" as sa

em -[hidden]right- ad
ad -[hidden]right- sa

rectangle "Job Order Management System (JOMS)" {
    ' Common Use Cases
    usecase "Login to System" as UC1
    usecase "View Profile" as UC2
    usecase "View Students" as UC3

    ' Employee Functions
    usecase "View Assigned Orders" as UC4
    usecase "Update Order Status" as UC5
    usecase "View Daily Tasks" as UC6
    usecase "View Student Measurements" as UC7
    usecase "Mark Orders Complete" as UC8
    usecase "View Order Details" as UC9
    usecase "Record Work Progress" as UC10
    usecase "View Performance Stats" as UC11
    usecase "View Due Dates" as UC12
    usecase "Filter Assigned Orders" as UC13

    ' Admin Functions
    usecase "Manage Students" as UC14
    usecase "Process Orders" as UC15
    usecase "Configure Uniforms" as UC16
    usecase "Manage Courses" as UC17
    usecase "Manage Measurements" as UC18
    usecase "Track All Orders" as UC19
    usecase "Assign Orders" as UC20
    usecase "View Analytics" as UC21
    usecase "Monitor Performance" as UC22
    usecase "Generate Reports" as UC23
    usecase "Set Base Prices" as UC24
    usecase "Process Payments" as UC25
    usecase "View Revenue" as UC26
    usecase "Reset Employee Passwords" as UC27
    usecase "Manage Employees" as UC28
    usecase "Delete Orders" as UC29
    usecase "Edit Student Records" as UC30

    ' SuperAdmin Functions
    usecase "Manage Admin Accounts" as UC31
    usecase "Reset Admin Passwords" as UC32
    usecase "View Audit Logs" as UC33

    ' Employee Access
    em --> UC1
    em --> UC2
    em --> UC3
    em --> UC4
    em --> UC5
    em --> UC6
    em --> UC7
    em --> UC8
    em --> UC9
    em --> UC10
    em --> UC11
    em --> UC12
    em --> UC13

    ' Admin Access
    ad --> UC1
    ad --> UC2
    ad --> UC3
    ad --> UC14
    ad --> UC15
    ad --> UC16
    ad --> UC17
    ad --> UC18
    ad --> UC19
    ad --> UC20
    ad --> UC21
    ad --> UC22
    ad --> UC23
    ad --> UC24
    ad --> UC25
    ad --> UC26
    ad --> UC27
    ad --> UC28
    ad --> UC29
    ad --> UC30

    ' SuperAdmin Access
    UC1 <-- sa
    UC2 <-- sa
    UC3 <-- sa
    UC14 <-- sa
    UC15 <-- sa
    UC16 <-- sa
    UC17 <-- sa
    UC18 <-- sa
    UC19 <-- sa
    UC20 <-- sa
    UC21 <-- sa
    UC22 <-- sa
    UC23 <-- sa
    UC24 <-- sa
    UC25 <-- sa
    UC26 <-- sa
    UC27 <-- sa
    UC28 <-- sa
    UC29 <-- sa
    UC30 <-- sa
    UC31 <-- sa
    UC32 <-- sa
    UC33 <-- sa

    ' Include/Extend Relationships Based on Actual Code
    UC15 ..> UC20 : <<include>>
    UC15 ..> UC24 : <<include>>
    UC8 ..> UC5 : <<include>>
    UC16 ..> UC18 : <<include>>
    UC28 ..> UC27 : <<include>>
    UC31 ..> UC32 : <<include>>
    UC21 ..> UC23 : <<extend>>
    UC22 ..> UC23 : <<extend>>
    UC14 ..> UC7 : <<include>>
}

@enduml
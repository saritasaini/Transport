Transport Fleet &amp; Driver Management System
Database Schema — ERD Field Reference
Version: 1.0   |   Tables: 13   |   Stack: PostgreSQL + NestJS
Key Legend
PK  = Primary Key     FK  = Foreign Key     PK, FK  = Composite key that is also a foreign key
Nullable YES = column allows NULL values.   All timestamps are timezone-aware (TIMESTAMPTZ).
BR-01 to BR-10 references map to the business rules defined in the PRD.
organizations
Top-level multi-tenant entity. Each transport company is one org.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
name
VARCHAR(150)
NO
Company / organization name
plan
VARCHAR(50)
NO
'starter'
Subscription plan (starter, pro, enterprise)
gstin
VARCHAR(20)
YES
NULL
GST identification number
phone
VARCHAR(20)
YES
NULL
Primary contact number
email
VARCHAR(150)
YES
NULL
Primary contact email
address
TEXT
YES
NULL
Registered address
is_active
BOOLEAN
NO
true
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
branches
Operational branches within an organization. Fleet and users are scoped to branches.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
name
VARCHAR(100)
NO
Branch name (e.g. Mumbai HQ)
city
VARCHAR(80)
YES
NULL
City
state
VARCHAR(80)
YES
NULL
State
address
TEXT
YES
NULL
Full branch address
is_active
BOOLEAN
NO
true
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
users
All platform users. Role determines access scope. Users are scoped to org and optionally a branch.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
branch_id
UUID
FK
YES
NULL
FK → branches.id (NULL = all branches)
name
VARCHAR(150)
NO
Full name
email
VARCHAR(150)
NO
Login email (unique per org)
phone
VARCHAR(20)
YES
NULL
Mobile number
role
VARCHAR(50)
NO
super_admin | admin | sub_admin | accountant 
password_hash
TEXT
NO
Bcrypt hashed password
otp_secret
TEXT
YES
NULL
OTP secret for 2FA
last_login
TIMESTAMPTZ
YES
NULL
Last successful login time
is_active
BOOLEAN
NO
true
Soft-delete / deactivation flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
customers
Customer / party master. Linked to trips and bills. Tracks outstanding balance.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
name
VARCHAR(150)
NO
Customer / party name
type
VARCHAR(30)
NO
'customer'
customer | vendor | transporter
contact_person
VARCHAR(100)
YES
NULL
Primary contact person name
phone
VARCHAR(20)
YES
NULL
Contact number
email
VARCHAR(150)
YES
NULL
Email address
gstin
VARCHAR(20)
YES
NULL
GST number for invoicing
address
TEXT
YES
NULL
Full address
credit_limit
NUMERIC(12,2)
NO
0
Approved credit limit
outstanding_balance
NUMERIC(12,2)
NO
0
Running outstanding (bills minus payments)
payment_terms_days
INTEGER
NO
30
Default payment due days
is_active
BOOLEAN
NO
true
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
drivers
Driver master. Tracks availability, license compliance, and assignment history.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
branch_id
UUID
FK
NO
FK → branches.id (home branch)
name
VARCHAR(150)
NO
Full name
phone
VARCHAR(20)
NO
Mobile number
alt_phone
VARCHAR(20)
YES
NULL
Alternate contact
license_no
VARCHAR(50)
NO
Driving license number
license_expiry
DATE
NO
DL expiry date (triggers alert)
license_type
VARCHAR(30)
YES
NULL
LMV | HMV | HGMV etc.
availability_status
VARCHAR(30)
NO
'available'
available | on_trip | on_leave | assigned
date_of_joining
DATE
YES
NULL
Joining date
address
TEXT
YES
NULL
Residential address
photo_url
TEXT
YES
NULL
Driver photo storage URL
is_active
BOOLEAN
NO
true
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
vehicles
Fleet master. Tracks compliance documents, odometer, and current status.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
branch_id
UUID
FK
NO
FK → branches.id (stationed at)
reg_no
VARCHAR(20)
NO
Vehicle registration number (unique per org)
make
VARCHAR(80)
YES
NULL
Manufacturer (e.g. Tata, Ashok Leyland)
model
VARCHAR(80)
YES
NULL
Vehicle model
type
VARCHAR(50)
NO
truck | trailer | tanker | LCV | HCV etc.
ownership_type
VARCHAR(30)
NO
'owned'
owned | rent_in | leased
capacity_tons
NUMERIC(6,2)
YES
NULL
Load capacity in tons
year_of_mfg
INTEGER
YES
NULL
Year of manufacture
insurance_no
VARCHAR(80)
YES
NULL
Insurance policy number
insurance_expiry
DATE
YES
NULL
Insurance expiry (triggers alert)
permit_no
VARCHAR(80)
YES
NULL
Permit number
permit_expiry
DATE
YES
NULL
Permit expiry (triggers alert)
fitness_expiry
DATE
YES
NULL
Fitness certificate expiry
puc_expiry
DATE
YES
NULL
PUC certificate expiry
odometer_current
INTEGER
NO
0
Current odometer reading (km)
status
VARCHAR(30)
NO
'available'
available | on_trip | in_maintenance | assigned
is_active
BOOLEAN
NO
true
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
trips
Core operational entity. One row per trip. Enforces BR-01 to BR-10 at application + DB level.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
branch_id
UUID
FK
NO
FK → branches.id
trip_no
VARCHAR(30)
NO
Human-readable trip number (ORG-YYYYMM-NNNN)
customer_id
UUID
FK
NO
FK → customers.id (mandatory, BR-08)
driver_id
UUID
FK
YES
NULL
FK → drivers.id (set on assignment)
vehicle_id
UUID
FK
YES
NULL
FK → vehicles.id (set on assignment)
created_by
UUID
FK
NO
FK → users.id
approved_by
UUID
FK
YES
NULL
FK → users.id (required for post-completion edits, BR-05)
status
VARCHAR(30)
NO
'pending'
pending | assigned | in_transit | hold | cancelled | completed
origin
TEXT
NO
Trip start location (mandatory, BR-10)
destination
TEXT
NO
Trip destination
goods_type
VARCHAR(100)
YES
NULL
Type of goods being transported
weight_tons
NUMERIC(8,2)
YES
NULL
Load weight in tons
odometer_start
INTEGER
NO
Odometer at trip start (mandatory)
odometer_end
INTEGER
YES
NULL
Odometer at trip end (mandatory before completion, BR-06)
freight_amount
NUMERIC(12,2)
NO
0
Agreed freight charge
advance_paid
NUMERIC(12,2)
NO
0
Advance amount paid to driver
notes
TEXT
YES
NULL
Free-form notes
hold_reason
TEXT
YES
NULL
Reason if trip is on hold
cancel_reason
TEXT
YES
NULL
Reason if trip is cancelled
scheduled_at
TIMESTAMPTZ
YES
NULL
Planned departure time
started_at
TIMESTAMPTZ
YES
NULL
Actual departure time
completed_at
TIMESTAMPTZ
YES
NULL
Actual completion time
is_deleted
BOOLEAN
NO
false
Soft-delete flag (BR-09)
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
trip_expenses
Line-item expenses linked to a trip. Must reference a valid trip (BR-04).
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
trip_id
UUID
FK
NO
FK → trips.id (mandatory, BR-04)
created_by
UUID
FK
NO
FK → users.id
expense_type
VARCHAR(50)
NO
fuel | toll | driver_allowance | food | parking | maintenance | misc
amount
NUMERIC(10,2)
NO
Expense amount (INR)
description
TEXT
YES
NULL
Optional notes / narration
receipt_url
TEXT
YES
NULL
Uploaded receipt file URL
expense_date
DATE
NO
CURRENT_DATE
Date of expense
is_deleted
BOOLEAN
NO
false
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
bills
Invoice raised against a customer for a trip. One bill per trip.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
trip_id
UUID
FK
NO
FK → trips.id (1:1)
customer_id
UUID
FK
NO
FK → customers.id
created_by
UUID
FK
NO
FK → users.id
bill_no
VARCHAR(30)
NO
Human-readable bill number
bill_date
DATE
NO
CURRENT_DATE
Bill issue date
due_date
DATE
NO
Payment due date
base_amount
NUMERIC(12,2)
NO
0
Pre-tax freight amount
tax_percent
NUMERIC(5,2)
NO
0
GST / tax percentage applied
tax_amount
NUMERIC(12,2)
NO
0
Calculated tax amount
total_amount
NUMERIC(12,2)
NO
0
Total billable amount (base + tax)
paid_amount
NUMERIC(12,2)
NO
0
Running total of payments received
status
VARCHAR(30)
NO
'unpaid'
unpaid | partial | paid | overdue | disputed
notes
TEXT
YES
NULL
Billing notes
is_deleted
BOOLEAN
NO
false
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
payments
Payment receipts applied against a bill. Multiple payments can settle one bill.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
bill_id
UUID
FK
NO
FK → bills.id
customer_id
UUID
FK
NO
FK → customers.id
received_by
UUID
FK
NO
FK → users.id (accountant recording payment)
amount
NUMERIC(12,2)
NO
Amount received
payment_mode
VARCHAR(30)
NO
cash | bank_transfer | cheque | upi | neft | rtgs
reference_no
VARCHAR(100)
YES
NULL
UTR / cheque number / transaction ID
payment_date
DATE
NO
CURRENT_DATE
Date payment was received
notes
TEXT
YES
NULL
Remarks
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
rent_contracts
Rent-in and rent-out contracts for vendor vehicles or customer-hired vehicles.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
vehicle_id
UUID
FK
NO
FK → vehicles.id
party_id
UUID
FK
NO
FK → customers.id (vendor or customer)
created_by
UUID
FK
NO
FK → users.id
contract_type
VARCHAR(20)
NO
rent_in | rent_out
rate
NUMERIC(10,2)
NO
Agreed rate amount
rate_unit
VARCHAR(20)
NO
per_day | per_km | per_trip | per_month
start_date
DATE
NO
Contract start date
end_date
DATE
YES
NULL
Contract end date (NULL = open-ended)
status
VARCHAR(20)
NO
'active'
active | closed | cancelled
return_date
DATE
YES
NULL
Actual vehicle return date (BR-03)
return_odometer
INTEGER
YES
NULL
Odometer at return
notes
TEXT
YES
NULL
Contract notes
is_deleted
BOOLEAN
NO
false
Soft-delete flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
updated_at
TIMESTAMPTZ
NO
now()
Last update timestamp
notifications
System-generated alerts for compliance expiries, trip events, and payment reminders.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
user_id
UUID
FK
YES
NULL
FK → users.id (NULL = broadcast to role)
type
VARCHAR(50)
NO
dl_expiry | insurance_expiry | permit_expiry | fitness_expiry | trip_event | payment_due | maintenance
title
VARCHAR(200)
NO
Short notification title
message
TEXT
NO
Full notification body
entity_type
VARCHAR(50)
YES
NULL
Related entity type (vehicle, driver, trip, bill)
entity_id
UUID
YES
NULL
Related entity ID
is_read
BOOLEAN
NO
false
Read / unread flag
created_at
TIMESTAMPTZ
NO
now()
Record creation timestamp
audit_logs
Immutable audit trail for all create, update, delete, and restore actions. Supports BR-05 and BR-09.
Field
Data Type
Key
Nullable
Default
Description
id
UUID
PK
NO
gen_random_uuid()
Primary key
org_id
UUID
FK
NO
FK → organizations.id
user_id
UUID
FK
NO
FK → users.id (actor)
entity_type
VARCHAR(80)
NO
Table name (e.g. trips, vehicles, drivers)
entity_id
UUID
NO
PK of the affected record
action
VARCHAR(30)
NO
create | update | delete | restore | approve
changes
JSONB
YES
NULL
JSON diff — { field: [old_value, new_value] }
ip_address
INET
YES
NULL
Client IP address
user_agent
TEXT
YES
NULL
Browser / client user agent
created_at
TIMESTAMPTZ
NO
now()
Timestamp of action (immutable)

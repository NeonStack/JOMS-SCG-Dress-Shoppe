### Name (First Name & Last Name)
- Required field
- Must be 2-50 characters long
- Only allows letters, spaces, and dots
- Pattern: /^[a-zA-Z\s.]+$/
```

### Phone Number
- Required field
- Must start with '09'
- Must be exactly 11 digits long 
- Pattern: /^09\d{9}$/
- Example: 09123456789
```

### Address
- Required field
- Must be 5-200 characters long
- Allows letters, numbers, spaces, commas, dots, hyphens, and #
- Pattern: /^[a-zA-Z0-9\s,.\-#]+$/
```

# ERROR MESSAGE TO SHOW FOR FRONTEND AND BACKEND
Name (First & Last Name)
Empty: "Name is required"
Pattern: "Only letters, spaces, and dots allowed" 
Length: "Must be between 2-50 characters" 

Phone Number
Empty: "Contact number is required" 
Pattern: "Must be 11 digits starting with 09" 

Address
Empty: "Address is required" 
Length: "Must be between 5-200 characters" 
Pattern: "Only letters, numbers, spaces, commas, dots, hyphens, and #"
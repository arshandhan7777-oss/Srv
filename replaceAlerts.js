const fs = require('fs');
const path = require('path');

const adminDashPath = path.join(__dirname, 'admin/src/portal/AdminDashboard.js');
let adminContent = fs.readFileSync(adminDashPath, 'utf8');

// Fix double import
adminContent = adminContent.replace("import Swal from 'sweetalert2';\nimport Swal from 'sweetalert2';", "import Swal from 'sweetalert2';");

// Replace handleDeleteFaculty confirm
adminContent = adminContent.replace(
    /if \(!window\.confirm\('Are you sure you want to delete this faculty member\?'\)\) return;/g,
    `const result = await Swal.fire({
      title: 'Delete Faculty?',
      text: 'Are you sure you want to permanently delete this faculty member?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#0f172a',
      confirmButtonText: 'Yes, delete!'
    });
    if (!result.isConfirmed) return;`
);

// Replace handleDeleteStudent confirm
adminContent = adminContent.replace(
    /if \(!window\.confirm\('Are you sure you want to delete this student\? Their parent login account will also be permanently deleted\.'\)\) return;/g,
    `const result = await Swal.fire({
      title: 'Delete Student?',
      text: 'Are you sure? Their parent account will also be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#0f172a',
      confirmButtonText: 'Yes, delete!'
    });
    if (!result.isConfirmed) return;`
);

// Replace resetting password error alert
adminContent = adminContent.replace(
    /alert\(err\.response\?\.data\?\.message \|\| 'Error resetting password'\);/g,
    "Swal.fire('Error', err.response?.data?.message || 'Error resetting password', 'error');"
);

// Replace saving profile alerts
adminContent = adminContent.replace(
    /alert\("Profile and student tracking assignments updated successfully!"\);/g,
    "Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Profile assignments updated!', showConfirmButton: false, timer: 3000});"
);

adminContent = adminContent.replace(
    /alert\("Failed to save profile\. Please check connection\."\);/g,
    "Swal.fire('Error', 'Failed to save profile. Please check connection.', 'error');"
);

// Replace save fee details alert
adminContent = adminContent.replace(
    /alert\('Failed to save fee details\.'\);/g,
    "Swal.fire('Error', 'Failed to save fee details.', 'error');"
);

fs.writeFileSync(adminDashPath, adminContent);

// ParentDashboard.js
const parentDashPath = path.join(__dirname, 'admin/src/portal/ParentDashboard.js');
if (fs.existsSync(parentDashPath)) {
    let parentContent = fs.readFileSync(parentDashPath, 'utf8');
    
    // Add import if missing
    if (!parentContent.includes("import Swal from 'sweetalert2';")) {
        parentContent = parentContent.replace("import axios from 'axios';", "import axios from 'axios';\nimport Swal from 'sweetalert2';");
    }

    parentContent = parentContent.replace(
        /alert\(err\.response\?\.data\?\.message \|\| 'Payment failed\.'\);/g,
        "Swal.fire('Error', err.response?.data?.message || 'Payment failed.', 'error');"
    );

    fs.writeFileSync(parentDashPath, parentContent);
}

console.log("Successfully replaced raw alerts with Swal");

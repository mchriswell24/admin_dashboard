// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArdOInTXbTnUKPrXU3GtKq3-6Hz-8yinc",
  authDomain: "admin-crud-98ba1.firebaseapp.com",
  projectId: "admin-crud-98ba1",
  storageBucket: "admin-crud-98ba1.appspot.com",
  messagingSenderId: "214834543731",
  appId: "1:214834543731:web:8a732ee1f756be7956fe06",
  measurementId: "G-T5QY6C1FKQ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

//Initialization
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", function () {
    const filter = this.value.toLowerCase();

    //Employees
    document.querySelectorAll("#employeeTable tbody tr").forEach(row => {
      const rowText = Array.from(row.cells).map(cell => cell.textContent.toLowerCase()).join(" ");
      row.style.display = rowText.includes(filter) ? "" : "none";
    });

    //Loans
    document.querySelectorAll("#loanTable tbody tr").forEach(row => {
      const rowText = Array.from(row.cells).map(cell => cell.textContent.toLowerCase()).join(" ");
      row.style.display = rowText.includes(filter) ? "" : "none";
    });

    //Departments
    document.querySelectorAll("#departmentTable tbody tr").forEach(row => {
      const rowText = Array.from(row.cells).map(cell => cell.textContent.toLowerCase()).join(" ");
      row.style.display = rowText.includes(filter) ? "" : "none";
    });
  });

  // Initial data loading
  loadEmployees();
  loadLoans();
  loadDepartment();
});

//Employee
async function loadEmployees() {
  const tableBody = document.querySelector("#employeeTable tbody");
  tableBody.innerHTML = "";

  const departments = {};
  const deptSnapshot = await db.collection("Departments").get();
  deptSnapshot.forEach(doc => {
    departments[doc.id] = doc.data().DeptDescription;
  });

  const empSnapshot = await db.collection("Employees").get();
  empSnapshot.forEach(doc => {
    const emp = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.Eid}</td>
      <td>${emp.Name}</td>
      <td>${emp.Position}</td>
      <td>${departments[emp.DeptCode] || emp.DeptCode}</td>
      <td>${emp.Salary ? `₱${emp.Salary.toLocaleString()}` : "N/A"}</td>
      <td>
        <button onclick="editEmployee('${doc.id}')">Edit</button>
        <button onclick="deleteEmployee('${doc.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

//Add Employee
document.getElementById("addForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  Object.assign(data, {
    Eid: Number(data.Eid),
    Salary: Number(data.Salary),
    Age: Number(data.Age)
  });

  try {
    await db.collection("Employees").add(data);
    closeAddModal();
    loadEmployees();
  } catch (err) {
    alert("Error adding employee: " + err.message);
  }
});

//Edit/Delete Employee
function editEmployee(docId) {
  db.collection("Employees").doc(docId).get().then(doc => {
    if (doc.exists) {
      const emp = doc.data();
      const form = document.getElementById("editForm");

      form.querySelector("[name='docId']").value = doc.id;
      form.querySelector("[name='Eid']").value = emp.Eid;
      form.querySelector("[name='Name']").value = emp.Name;
      form.querySelector("[name='Position']").value = emp.Position;
      form.querySelector("[name='Salary']").value = emp.Salary;
      form.querySelector("[name='Age']").value = emp.Age;
      form.querySelector("[name='Address']").value = emp.Address;
      form.querySelector("[name='DeptCode']").value = emp.DeptCode;

      document.getElementById("editModal").style.display = "block";
    }
  });
}

document.getElementById("editForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const docId = data.docId;
  delete data.docId;

  Object.assign(data, {
    Eid: Number(data.Eid),
    Salary: Number(data.Salary),
    Age: Number(data.Age)
  });

  try {
    await db.collection("Employees").doc(docId).update(data);
    closeEditModal();
    loadEmployees();
  } catch (err) {
    alert("Error updating employee: " + err.message);
  }
});

async function deleteEmployee(docId) {
  if (confirm("Are you sure you want to delete this employee?")) {
    await db.collection("Employees").doc(docId).delete();
    loadEmployees();
  }
}

//Loan
async function loadLoans() {
  const tableBody = document.querySelector("#loanTable tbody");
  tableBody.innerHTML = "";

  const empMap = {};
  const empSnapshot = await db.collection("Employees").get();
  empSnapshot.forEach(doc => empMap[doc.data().Eid] = doc.data().Name);

  const snapshot = await db.collection("Loans").get();
  snapshot.forEach(doc => {
    const loan = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${loan.Eid} (${empMap[loan.Eid] || "Unknown"})</td>
      <td>₱${Number(loan.LoanAmount).toLocaleString()}</td>
      <td>${loan.Date}</td>
      <td>
        <button onclick="editLoan('${doc.id}')">Edit</button>
        <button onclick="deleteLoan('${doc.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

//Add Loan
document.getElementById("loanForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const Eid = Number(formData.get("Eid"));
  const LoanAmount = Number(formData.get("LoanAmount"));
  const Date = formData.get("Date");

  const snapshot = await db.collection("Employees").where("Eid", "==", Eid).get();
  if (snapshot.empty) return alert(`No employee found with EID ${Eid}`);

  await db.collection("Loans").add({ Eid, LoanAmount, Date });
  closeLoanModal();
  loadLoans();
});

//Edit/Delete Loan
function editLoan(docId) {
  db.collection("Loans").doc(docId).get().then(doc => {
    const loan = doc.data();
    const form = document.getElementById("editLoanForm");
    form.docId.value = docId;
    form.Eid.value = loan.Eid;
    form.LoanAmount.value = loan.LoanAmount;
    form.Date.value = loan.Date;
    document.getElementById("editLoanModal").style.display = "block";
  });
}

document.getElementById("editLoanForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const docId = formData.get("docId");

  await db.collection("Loans").doc(docId).update({
    Eid: Number(formData.get("Eid")),
    LoanAmount: Number(formData.get("LoanAmount")),
    Date: formData.get("Date")
  });

  closeEditLoanModal();
  loadLoans();
});

async function deleteLoan(docId) {
  if (confirm("Delete this loan?")) {
    await db.collection("Loans").doc(docId).delete();
    loadLoans();
  }
}

//Department
async function loadDepartment() {
  const tableBody = document.querySelector("#departmentTable tbody");
  tableBody.innerHTML = "";

  const snapshot = await db.collection("Departments").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.Department}</td>
      <td>${data.DepartmentName}</td>
      <td>
        <button onclick="editDepartment('${doc.id}')">Edit</button>
        <button onclick="deleteDepartment('${doc.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

//Add Department
document.getElementById("departmentForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  await db.collection("Departments").add(data);
  closeDepartmentModal();
  loadDepartment();
});

//Edit/Delete Department
function editDepartment(docId) {
  db.collection("Departments").doc(docId).get().then(doc => {
    const dept = doc.data();
    const form = document.getElementById("editDepartmentForm");
    form.docId.value = docId;
    form.Department.value = dept.Department;
    form.DepartmentName.value = dept.DepartmentName;
    document.getElementById("editDepartmentModal").style.display = "block";
  });
}

document.getElementById("editDepartmentForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const docId = formData.get("docId");

  await db.collection("Departments").doc(docId).update({
    Department: formData.get("Department"),
    DepartmentName: formData.get("DepartmentName")
  });

  closeEditDepartmentModal();
  loadDepartment();
});

async function deleteDepartment(docId) {
  if (confirm("Delete this department?")) {
    await db.collection("Departments").doc(docId).delete();
    loadDepartment();
  }
}

// Employee Modals
function openAddModal() {
  document.getElementById("addModal").style.display = "block";
}
function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

// Loan Modals
function openLoanModal() {
  document.getElementById("loanModal").style.display = "block";
}
function closeLoanModal() {
  document.getElementById("loanModal").style.display = "none";
}
function closeEditLoanModal() {
  document.getElementById("editLoanModal").style.display = "none";
}

// Department Modals
function openDepartmentModal() {
  document.getElementById("departmentModal").style.display = "block";
}
function closeDepartmentModal() {
  document.getElementById("departmentModal").style.display = "none";
}
function closeEditDepartmentModal() {
  document.getElementById("editDepartmentModal").style.display = "none";
}


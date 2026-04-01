const API_URL = '/api';
let currentMemberId = null;
let currentYear = null;
let currentMonth = null;
let membersList = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadMembers();
  populateMonthsDropdown();
  populateMembersSelect();
  loadCurrentNepaliDate();
});

// Navigation
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  if (sectionId === 'dashboard') {
    loadDashboard();
  } else if (sectionId === 'members') {
    loadMembers();
  }
}

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/dashboard`);
    const data = await response.json();

    document.getElementById('stat-members').textContent = data.total_members;
    document.getElementById('stat-savings').textContent = `₨ ${formatNumber(data.total_savings)}`;
    document.getElementById('stat-loans').textContent = `₨ ${formatNumber(data.total_loans)}`;
    document.getElementById('stat-interest').textContent = `₨ ${formatNumber(data.total_interest)}`;

    // Update current date
    const dateStr = `${data.current_date.monthName} ${data.current_date.year} (BS)`;
    document.getElementById('current-date').textContent = `Current Nepali Date: ${dateStr}`;

    // Display unpaid loans
    const unpaidList = document.getElementById('unpaid-loans-list');
    if (data.members_with_unpaid_loans.length === 0) {
      unpaidList.innerHTML = '<p class="text-center">No unpaid loans</p>';
    } else {
      unpaidList.innerHTML = data.members_with_unpaid_loans.map(member => `
        <div class="list-item">
          <div>
            <strong>${member.name}</strong><br>
            <small>Loan Balance: ₨ ${formatNumber(member.loan_balance)}</small><br>
            <small>Late Fee: ₨ ${formatNumber(member.late_fee)}</small>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('Failed to load dashboard data');
  }
}

function loadCurrentNepaliDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  let nepaliYear = year + 57;
  if (month < 3) nepaliYear--;
  
  let nepaliMonth = ((month + 9) % 12) + 1;
  
  const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 
                  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  
  return { year: nepaliYear, month: nepaliMonth, monthName: months[nepaliMonth - 1] };
}

// ============ MEMBERS ============
async function loadMembers() {
  try {
    const response = await fetch(`${API_URL}/members`);
    const data = await response.json();
    membersList = data;
    displayMembers(data);
    populateMembersSelect();
  } catch (error) {
    console.error('Error loading members:', error);
  }
}

function displayMembers(members) {
  const membersList = document.getElementById('members-list');
  if (members.length === 0) {
    membersList.innerHTML = '<tr><td colspan="5" class="text-center">No members found</td></tr>';
    return;
  }

  membersList.innerHTML = members.map(member => `
    <tr>
      <td>${member.name}</td>
      <td>${member.citizenship_number}</td>
      <td>${member.address || '-'}</td>
      <td>₨ ${formatNumber(member.entry_fee)}</td>
      <td>
        <button class="btn-warning" onclick="editMemberModal(${member.id})">Edit</button>
        <button class="btn-danger" onclick="deleteMember(${member.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function addMember(e) {
  e.preventDefault();
  
  const name = document.getElementById('member-name').value;
  const citizenship = document.getElementById('member-citizenship').value;
  const address = document.getElementById('member-address').value;
  const fee = parseFloat(document.getElementById('member-fee').value) || 0;

  try {
    const response = await fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, citizenship_number: citizenship, address, entry_fee: fee })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    alert('Member added successfully!');
    document.getElementById('member-form').reset();
    loadMembers();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function editMemberModal(memberId) {
  const member = membersList.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('edit-member-id').value = member.id;
  document.getElementById('edit-member-name').value = member.name;
  document.getElementById('edit-member-citizenship').value = member.citizenship_number;
  document.getElementById('edit-member-address').value = member.address || '';
  document.getElementById('edit-member-fee').value = member.entry_fee;

  document.getElementById('editModal').style.display = 'block';
}

async function updateMember(e) {
  e.preventDefault();

  const memberId = document.getElementById('edit-member-id').value;
  const name = document.getElementById('edit-member-name').value;
  const citizenship = document.getElementById('edit-member-citizenship').value;
  const address = document.getElementById('edit-member-address').value;
  const fee = parseFloat(document.getElementById('edit-member-fee').value) || 0;

  try {
    const response = await fetch(`${API_URL}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, citizenship_number: citizenship, address, entry_fee: fee })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    alert('Member updated successfully!');
    closeModal();
    loadMembers();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function deleteMember(memberId) {
  if (!confirm('Are you sure you want to delete this member? This cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/members/${memberId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    alert('Member deleted successfully!');
    loadMembers();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function searchMembers() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    loadMembers();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/members/search/${query}`);
    const data = await response.json();
    displayMembers(data);
  } catch (error) {
    console.error('Error searching members:', error);
  }
}

function resetSearch() {
  document.getElementById('search-input').value = '';
  loadMembers();
}

function closeModal() {
  document.getElementById('editModal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// ============ RECORDS ============
function populateMonthsDropdown() {
  const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 
                  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  
  const monthSelect = document.getElementById('record-month');
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
}

function populateMembersSelect() {
  const select = document.getElementById('record-member');
  select.innerHTML = '<option value="">-- Select Member --</option>';
  
  membersList.forEach(member => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    select.appendChild(option);
  });
}

async function loadMemberRecords() {
  const memberId = document.getElementById('record-member').value;
  const year = document.getElementById('record-year').value;
  const month = document.getElementById('record-month').value;

  if (!memberId || !year || !month) {
    alert('Please select member, year, and month');
    return;
  }

  currentMemberId = memberId;
  currentYear = year;
  currentMonth = month;

  try {
    const response = await fetch(`${API_URL}/records/member/${memberId}/year/${year}/month/${month}`);
    const record = await response.json();

    // Populate form with existing data
    document.getElementById('record-savings').value = record.savings || 0;
    document.getElementById('record-loan-taken').value = record.loan_taken || 0;
    document.getElementById('record-interest-rate').value = record.interest_rate || 0;
    document.getElementById('record-late-fee').value = record.late_fee || 0;
    document.getElementById('record-notes').value = record.notes || '';

    // Update summary
    document.getElementById('summary-loan-balance').textContent = `₨ ${formatNumber(record.loan_balance || 0)}`;
    document.getElementById('summary-interest').textContent = `₨ ${formatNumber(record.interest_monthly || 0)}`;
    document.getElementById('summary-total-interest').textContent = `₨ ${formatNumber(record.total_interest || 0)}`;
    document.getElementById('summary-service-charge').textContent = `₨ ${formatNumber(record.service_charge || 0)}`;

    // Get member name
    const member = membersList.find(m => m.id == memberId);
    const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 
                    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
    
    document.getElementById('record-header').textContent = `${member.name} - ${months[month - 1]} ${year} (BS)`;
    document.getElementById('records-display').style.display = 'block';
  } catch (error) {
    console.error('Error loading records:', error);
    alert('Error loading records');
  }
}

async function saveRecord(e) {
  e.preventDefault();

  const savings = parseFloat(document.getElementById('record-savings').value) || 0;
  const loanTaken = parseFloat(document.getElementById('record-loan-taken').value) || 0;
  const interestRate = parseFloat(document.getElementById('record-interest-rate').value) || 0;
  const lateFee = parseFloat(document.getElementById('record-late-fee').value) || 0;
  const notes = document.getElementById('record-notes').value;

  try {
    const response = await fetch(
      `${API_URL}/records/member/${currentMemberId}/year/${currentYear}/month/${currentMonth}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savings,
          loan_taken: loanTaken,
          interest_rate: interestRate,
          late_fee: lateFee,
          notes
        })
      }
    );

    if (!response.ok) throw new Error('Failed to save record');

    alert('Record saved successfully!');
    loadMemberRecords();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function recordRepayment(e) {
  e.preventDefault();

  const repaymentAmount = parseFloat(document.getElementById('repayment-amount').value);

  try {
    const response = await fetch(
      `${API_URL}/records/member/${currentMemberId}/year/${currentYear}/month/${currentMonth}/repay`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repayment_amount: repaymentAmount })
      }
    );

    if (!response.ok) throw new Error('Failed to record repayment');

    alert('Repayment recorded successfully!');
    document.getElementById('repayment-form').reset();
    loadMemberRecords();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

// ============ UTILITIES ============
function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

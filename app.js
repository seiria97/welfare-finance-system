// 1. Setup the connection
const supabaseUrl = 'https://pqocyfdmloudfeyfxdbu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb2N5ZmRtbG91ZGZleWZ4ZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTQ1MDUsImV4cCI6MjA5MDU5MDUwNX0.yIHqIZD04jbC56vLerUh-qNT5YahW8lko6J56pvxHxs'; 
const _supabase = supabase.createClient('https://pqocyfdmloudfeyfxdbu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb2N5ZmRtbG91ZGZleWZ4ZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTQ1MDUsImV4cCI6MjA5MDU5MDUwNX0.yIHqIZD04jbC56vLerUh-qNT5YahW8lko6J56pvxHxs');

let membersList = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadMembers();
    populateMonthsDropdown();
    loadCurrentNepaliDateDisplay();
});

// Toggle Section Display
function showSection(sectionId, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) {
        // If the element clicked is inside a dropdown, highlight the parent dropdown-container
        const parentNav = element.closest('.dropdown-container') || element;
        parentNav.classList.add('active');
    }
}

// Logic to hide/show Entry Fee based on Member Type
function toggleEntryFeeGroup() {
    const memberType = document.getElementById('member-type').value;
    const feeGroup = document.getElementById('entry-fee-group');
    const feeInput = document.getElementById('member-fee');
    
    if (memberType === 'old') {
        feeGroup.style.display = 'none';
        feeInput.value = 0;
    } else {
        feeGroup.style.display = 'block';
        feeInput.value = 500; // Default new member fee
    }
}

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        const { data, count, error } = await _supabase
            .from('members')
            .select('*', { count: 'exact' });

        if (error) throw error;

        // Ensure these IDs exist in your HTML dashboard stats
        if(document.getElementById('stat-members')) document.getElementById('stat-members').textContent = count || 0;
        
        const totalSavings = data.reduce((sum, member) => sum + (member.entry_fee || 0), 0);
        if(document.getElementById('stat-savings')) {
            document.getElementById('stat-savings').textContent = `₨ ${formatNumber(totalSavings)}`;
        }

        loadCurrentNepaliDateDisplay();
    } catch (error) {
        console.error('Dashboard error:', error.message);
    }
}

function loadCurrentNepaliDateDisplay() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    let nepaliYear = year + 57;
    if (month < 3) nepaliYear--;
    let nepaliMonth = ((month + 9) % 12) + 1;
    
    const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 
                    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
    
    const dateStr = `${months[nepaliMonth - 1]} ${nepaliYear} (BS)`;
    const dateEl = document.getElementById('current-date-display');
    if (dateEl) dateEl.textContent = dateStr;
}

// ============ MEMBERS ============
async function loadMembers() {
    try {
        const { data, error } = await _supabase
            .from('members')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        membersList = data;
        displayMembers(data);
        populateMembersSelect();
    } catch (error) {
        console.error('Error loading members:', error.message);
    }
}

function displayMembers(members) {
    const membersListBody = document.getElementById('members-list');
    if (members.length === 0) {
        membersListBody.innerHTML = '<tr><td colspan="5" class="text-center">No members found</td></tr>';
        return;
    }

    membersListBody.innerHTML = members.map(member => `
        <tr>
            <td>${member.name}</td>
            <td>${member.citizenship_number || '-'}</td>
            <td>${member.address || '-'}</td>
            <td>₨ ${formatNumber(member.entry_fee || 0)}</td>
            <td>
                <button class="btn-warning" onclick="editMemberModal(${member.id})">Edit</button>
                <button class="btn-danger" onclick="deleteMember(${member.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}
    async function addMember(event) {
    console.log("ADD MEMBER CLICKED");
    event.preventDefault();
    event.preventDefault();
    const name = document.getElementById('member-name').value;
    const type = document.getElementById('member-type').value;
    const citizenship = document.getElementById('member-citizenship').value;
    const address = document.getElementById('member-address').value;
    const fee = parseFloat(document.getElementById('member-fee').value) || 0;

    const { error } = await _supabase
        .from('members')
        .insert([{ 
            name: name, 
            citizenship_number: citizenship, 
            address: address, 
            entry_fee: fee,
            member_type: type // Ensure this column exists in Supabase
        }]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Member added successfully!");
        document.getElementById('member-form').reset();
        loadMembers();
        loadDashboard();
    }
}

// ============ TRANSACTIONS ============

async function addSavings(event) {
    event.preventDefault();
    const name = document.getElementById('savings-name').value;
    const citizenship = document.getElementById('savings-citizenship').value;
    const amount = parseFloat(document.getElementById('savings-amount').value);
    const date = document.getElementById('savings-date').value;
    const reason = document.getElementById('savings-reason').value;

    const { error } = await _supabase
        .from('deposit')
        .insert([{ name, citizenship_number: citizenship, amount, date, reason }]);

    if (error) alert("Error: " + error.message);
    else {
        alert("Savings deposited!");
        document.getElementById('deposit-form').reset();
    }
}

async function withdrawSavings(event) {
    event.preventDefault();
    const name = document.getElementById('withdraw-name').value;
    const citizenship = document.getElementById('withdraw-citizenship').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const date = document.getElementById('withdraw-date').value;

    const { error } = await _supabase
        .from('withdraw')
        .insert([{ name, citizenship_number: citizenship, amount, date }]);

    if (error) alert("Error: " + error.message);
    else {
        alert("Withdrawal recorded!");
        document.getElementById('withdraw-form').reset();
    }
}

async function addLoan(event) {
    event.preventDefault();
    const name = document.getElementById('loan-name').value;
    const citizenship = document.getElementById('loan-citizenship').value;
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const date = document.getElementById('loan-date').value;
    const reason = document.getElementById('loan-reason').value;

    const { error } = await _supabase
        .from('loan')
        .insert([{ name, citizenship_number: citizenship, amount, date, reason }]);

    if (error) alert("Error: " + error.message);
    else {
        alert("Loan disbursed!");
        document.getElementById('loan-form').reset();
    }
}

async function repayLoan(event) {
    event.preventDefault();
    const name = document.getElementById('repay-name').value;
    const citizenship = document.getElementById('repay-citizenship').value;
    const amount = parseFloat(document.getElementById('repay-amount').value);
    const date = document.getElementById('repay-date').value;

    const { error } = await _supabase
        .from('loan repayments')
        .insert([{ name, citizenship_number: citizenship, amount, date }]);

    if (error) alert("Error: " + error.message);
    else {
        alert("Repayment recorded!");
        document.getElementById('repay-form').reset();
    }
}

// ============ UTILITIES ============

async function searchMembers() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) { loadMembers(); return; }

    const { data, error } = await _supabase
        .from('members')
        .select('*')
        .or(`name.ilike.%${query}%,citizenship_number.ilike.%${query}%`);

    if (!error) displayMembers(data);
}

function resetSearch() {
    document.getElementById('search-input').value = '';
    loadMembers();
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function populateMonthsDropdown() {
    const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 
                    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
    const monthSelect = document.getElementById('record-month');
    if (!monthSelect) return;
    monthSelect.innerHTML = '<option value="">-- Select Month --</option>';
    months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i + 1;
        opt.textContent = m;
        monthSelect.appendChild(opt);
    });
}

function populateMembersSelect() {
    const select = document.getElementById('record-member');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select Member --</option>';
    membersList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        select.appendChild(opt);
    });
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

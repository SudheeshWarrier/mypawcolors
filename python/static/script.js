// ============== GLOBAL STATE ==============
let currentEditId = null;
let currentEditType = null;
let allData = {
    catalog: [],
    students: [],
    hobby: []
};
let filteredData = {
    catalog: [],
    students: [],
    hobby: []
};
let lazyLoadState = {
    catalog: { loaded: 0, perPage: 10 },
    students: { loaded: 0, perPage: 10 },
    hobby: { loaded: 0, perPage: 10 }
};

// ============== INITIALIZATION ==============
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    setupSearchListeners();
    setupLazyLoading();
    loadAllData();
    setupModalOverlay();
});

// ============== MODAL MANAGEMENT ==============
function openFormModal(type, isEdit = false) {
    currentEditType = type;
    const formTitle = document.getElementById('formTitle');
    const typeName = type === 'catalog' ? 'Item' : type === 'students' ? 'Student' : 'Hobby';
    formTitle.textContent = isEdit ? `Edit ${typeName}` : `Add New ${typeName}`;
    
    generateFormFields(type);
    setupImagePreview();
    
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('formModal').classList.remove('hidden');
}

function closeFormModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('formModal').classList.add('hidden');
    document.getElementById('formContainer').innerHTML = '';
    currentEditId = null;
    currentEditType = null;
}

function setupModalOverlay() {
    const overlay = document.getElementById('modalOverlay');
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeFormModal();
        }
    });
}

// ============== FORM GENERATION & POPULATION ==============
function generateFormFields(type) {
    const container = document.getElementById('formContainer');
    container.innerHTML = '';
    
    // Get a sample item to understand the schema
    const items = allData[type] || [];
    let sampleSchema = {};
    
    if (items.length > 0) {
        // Build schema from first item
        sampleSchema = Object.keys(items[0]).reduce((acc, key) => {
            acc[key] = typeof items[0][key];
            return acc;
        }, {});
    } else {
        // Default schema based on unified structure
        sampleSchema = {
            id: 'number',
            title: 'string',
            artist: 'string',
            category: 'string',
            image: 'string',
            price: 'string',
            status: 'string',
            specifications: 'object',
            hero: 'boolean',
            dimension: 'object'
        };
    }
    
    // Generate form fields for top-level properties only
    Object.keys(sampleSchema).forEach(key => {
        if (key === 'id') {
            // ID field is auto-generated
            container.innerHTML += `
                <div class="form-group">
                    <label>ID</label>
                    <input type="number" data-field="id" readonly placeholder="Auto-generated">
                </div>
            `;
        } else if (key === 'specifications' || key === 'dimension') {
            // Handle nested objects
            generateNestedFields(type, key, container, items.length > 0 ? items[0][key] : {});
        } else if (key === 'hero') {
            // Handle boolean
            container.innerHTML += `
                <div class="form-group checkbox">
                    <label>
                        <input type="checkbox" data-field="hero">
                        Hero Item
                    </label>
                </div>
            `;
        } else if (key === 'status') {
            // Handle status dropdown
            container.innerHTML += `
                <div class="form-group">
                    <label>${capitalizeField(key)}</label>
                    <select data-field="status">
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            `;
        } else {
            // Regular text input
            const fieldType = key === 'image' ? 'url' : key === 'price' ? 'text' : 'text';
            if (key === 'image') {
                container.innerHTML += `
                    <div class="form-group image-preview-wrap">
                        <label>${capitalizeField(key)}</label>
                        <input type="${fieldType}" data-field="${key}" placeholder="https://...">
                        <img id="imagePreview" class="image-preview" alt="Image preview">
                    </div>
                `;
            } else {
                container.innerHTML += `
                    <div class="form-group">
                        <label>${capitalizeField(key)}</label>
                        <input type="${fieldType}" data-field="${key}">
                    </div>
                `;
            }
        }
    });
}

function generateNestedFields(type, nestedKey, container, nestedData = {}) {
    const keys = Object.keys(nestedData).length > 0 ? Object.keys(nestedData) : 
                 (nestedKey === 'specifications' ? ['medium', 'size', 'year', 'frame'] : 
                  nestedKey === 'dimension' ? ['width', 'height', 'unit', 'aspectRatio', 'orientation'] : []);
    
    const headerLabel = nestedKey === 'specifications' ? '📋 Specifications' : '📐 Dimensions';
    container.innerHTML += `<div class="form-group"><label><strong>${headerLabel}</strong></label></div>`;
    
    keys.forEach(key => {
        const fieldKey = `${nestedKey}.${key}`;
        if ((nestedKey === 'dimension' && key === 'aspectRatio')) {
            // Skip aspectRatio, it's auto-calculated
            return;
        }
        const fieldType = (nestedKey === 'dimension' && (key === 'width' || key === 'height')) ? 'number' : 'text';
        const step = fieldType === 'number' ? 'step="0.01"' : '';
        container.innerHTML += `
            <div class="form-group">
                <label>${capitalizeField(key)}</label>
                <input type="${fieldType}" data-field="${fieldKey}" ${step}>
            </div>
        `;
    });
}

function capitalizeField(field) {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

function populateFormWithData(type, item) {
    currentEditId = item.id;
    
    // Populate top-level fields
    Object.keys(item).forEach(key => {
        if (key === 'specifications' || key === 'dimension') {
            // Handle nested objects
            if (item[key]) {
                Object.keys(item[key]).forEach(nestedKey => {
                    const fieldKey = `${key}.${nestedKey}`;
                    const input = document.querySelector(`[data-field="${fieldKey}"]`);
                    if (input) {
                        input.value = item[key][nestedKey] || '';
                    }
                });
            }
        } else if (key === 'hero') {
            const checkbox = document.querySelector('[data-field="hero"]');
            if (checkbox) checkbox.checked = item[key] || false;
        } else {
            const input = document.querySelector(`[data-field="${key}"]`);
            if (input) input.value = item[key] || '';
        }
    });

    updateImagePreview(item.image || '');
}

function setupImagePreview() {
    const imageInput = document.querySelector('[data-field="image"]');
    if (!imageInput) {
        return;
    }

    imageInput.addEventListener('input', function() {
        updateImagePreview(this.value);
    });

    updateImagePreview(imageInput.value || '');
}

function updateImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
    if (!preview) {
        return;
    }

    const url = (imageUrl || '').trim();
    if (!url) {
        preview.removeAttribute('src');
        preview.classList.remove('visible');
        return;
    }

    preview.src = url;
    preview.classList.add('visible');

    preview.onerror = function() {
        preview.removeAttribute('src');
        preview.classList.remove('visible');
    };
}

// ============== TAB NAVIGATION ==============
function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ============== SEARCH FUNCTIONALITY ==============
function setupSearchListeners() {
    document.getElementById('catalogSearch').addEventListener('input', function() {
        performSearch('catalog', this.value);
    });
    
    document.getElementById('studentsSearch').addEventListener('input', function() {
        performSearch('students', this.value);
    });
    
    document.getElementById('hobbySearch').addEventListener('input', function() {
        performSearch('hobby', this.value);
    });
}

function performSearch(type, searchTerm) {
    if (!searchTerm.trim()) {
        filteredData[type] = [...allData[type]];
    } else {
        const term = searchTerm.toLowerCase();
        filteredData[type] = allData[type].filter(item => {
            const searchableText = JSON.stringify(item).toLowerCase();
            return searchableText.includes(term);
        });
    }
    
    lazyLoadState[type].loaded = 0;
    displayInitialItems(type);
    document.getElementById(`${type}SearchResults`).textContent = `${filteredData[type].length} results`;
}

// ============== LAZY LOADING ==============
function setupLazyLoading() {
    window.addEventListener('scroll', maybeLoadMoreOnScroll, { passive: true });
    window.addEventListener('resize', maybeLoadMoreOnScroll, { passive: true });
}

function getActiveTabType() {
    const activeTab = document.querySelector('.tab-content.active');
    return activeTab ? activeTab.id : 'catalog';
}

function maybeLoadMoreOnScroll() {
    const type = getActiveTabType();
    const state = lazyLoadState[type];
    const data = filteredData[type] || [];

    if (!state || state.loaded >= data.length) {
        return;
    }

    const scrollBottom = window.scrollY + window.innerHeight;
    const threshold = document.documentElement.scrollHeight - 240;

    if (scrollBottom >= threshold) {
        loadMoreItems(type);
    }
}

function displayInitialItems(type) {
    lazyLoadState[type].loaded = 0;
    loadMoreItems(type);

    // If the page is still short after first batch, load additional chunks automatically.
    setTimeout(maybeLoadMoreOnScroll, 0);
}

function loadMoreItems(type) {
    const container = document.getElementById(
        type === 'catalog' ? 'catalogList' : 
        type === 'students' ? 'studentsList' : 
        'hobbyList'
    );
    
    const state = lazyLoadState[type];
    const data = filteredData[type];
    const startIdx = state.loaded;
    const endIdx = Math.min(state.loaded + state.perPage, data.length);
    
    if (startIdx >= data.length) {
        return;
    }
    
    // Clear on first load
    if (startIdx === 0) {
        container.innerHTML = '';
    }
    
    const itemsToDisplay = data.slice(startIdx, endIdx);
    
    if (itemsToDisplay.length === 0) {
        if (startIdx === 0) {
            container.innerHTML = '<div class="empty-message">No items found.</div>';
        }
        return;
    }
    
    const htmlContent = itemsToDisplay.map(item => 
        generateItemHtml(type, item)
    ).join('');
    
    container.innerHTML += htmlContent;
    state.loaded = endIdx;
    
    // Show/hide loading indicator
    const loadingEl = document.getElementById(`${type}Loading`);
    if (endIdx < data.length) {
        loadingEl.classList.remove('hidden');
    } else {
        loadingEl.classList.add('hidden');
    }

    // Keep loading if there is still room in viewport and more items remain.
    setTimeout(maybeLoadMoreOnScroll, 0);
}

function generateItemHtml(type, item) {
    // Generic item display - renders all fields uniformly
    let htmlContent = `
        <div class="item-card">
            <div class="item-card-content">
    `;
    
    // Display image if available
    if (item.image) {
        htmlContent += `<img src="${item.image}" alt="${item.title || 'Item'}" class="item-card-image">`;
    }
    
    // Display all top-level fields
    Object.keys(item).forEach(key => {
        if (key === 'specifications' || key === 'dimension') {
            // Handle nested objects
            if (item[key]) {
                const sectionTitle = key === 'specifications' ? '📋 Specifications' : '📐 Dimensions';
                htmlContent += `<div class="item-detail"><strong>${sectionTitle}</strong></div>`;
                Object.keys(item[key]).forEach(nestedKey => {
                    if (nestedKey !== 'aspectRatio') { // Skip internal fields
                        htmlContent += `
                            <div class="item-detail">
                                <span class="item-detail-label">${capitalizeField(nestedKey)}:</span>
                                <span class="item-detail-value">${item[key][nestedKey] || 'N/A'}</span>
                            </div>
                        `;
                    }
                });
            }
        } else if (key === 'hero' || key === 'image') {
            // Skip these fields in the detail display
        } else if (key === 'title') {
            htmlContent += `<div class="item-title">${item.title}</div>`;
        } else if (key === 'id') {
            htmlContent += `
                <div class="item-detail">
                    <span class="item-detail-label">ID:</span>
                    <span class="item-detail-value"><strong>${item.id}</strong></span>
                </div>
            `;
        } else if (key === 'status') {
            htmlContent += `
                <div class="item-detail">
                    <span class="item-detail-label">Status:</span>
                    <span class="status-badge status-${item.status || 'available'}">${item.status || 'N/A'}</span>
                </div>
            `;
        } else {
            htmlContent += `
                <div class="item-detail">
                    <span class="item-detail-label">${capitalizeField(key)}:</span>
                    <span class="item-detail-value">${item[key] || 'N/A'}</span>
                </div>
            `;
        }
    });
    
    htmlContent += `
            </div>
            <div class="item-actions">
                <button class="btn btn-primary btn-small" onclick="editItem('${type}', ${item.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteItem('${type}', ${item.id})">🗑️ Delete</button>
            </div>
        </div>
    `;
    
    return htmlContent;
}

// ============== NOTIFICATION SYSTEM ==============
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// ============== UNIFIED CRUD OPERATIONS ==============
function showAddForm(type) {
    currentEditId = null;
    openFormModal(type, false);
}

async function loadData(type) {
    try {
        const response = await fetch(`/api/${type}`);
        const data = await response.json();
        allData[type] = data;
        filteredData[type] = [...data];
        displayInitialItems(type);
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        showNotification(`Error loading ${type}`, 'error');
    }
}

async function saveItem(event) {
    event.preventDefault();
    
    const type = currentEditType;
    const formData = {};
    let specifications = {};
    let dimension = {};
    
    // Collect form data
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.getAttribute('data-field');
        let value = input.type === 'checkbox' ? input.checked : input.value;
        
        if (field.includes('.')) {
            // Nested field
            const [parentKey, nestedKey] = field.split('.');
            if (parentKey === 'specifications') {
                specifications[nestedKey] = value;
            } else if (parentKey === 'dimension') {
                dimension[nestedKey] = isNaN(value) ? value : parseFloat(value);
            }
        } else if (field !== 'id') {
            // Top-level field (skip id, it's auto-generated)
            if (field === 'price' || field === 'hero') {
                formData[field] = value;
            } else {
                formData[field] = value;
            }
        }
    });
    
    // Add nested objects if they have content
    if (Object.keys(specifications).length > 0) {
        formData.specifications = specifications;
    }
    if (Object.keys(dimension).length > 0) {
        // Calculate aspect ratio if width and height available
        if (dimension.width && dimension.height) {
            dimension.aspectRatio = parseFloat(dimension.width) / parseFloat(dimension.height);
        }
        formData.dimension = dimension;
    }
    
    try {
        let response;
        if (currentEditId) {
            response = await fetch(`/api/${type}/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            showNotification('Item updated successfully', 'success');
        } else {
            response = await fetch(`/api/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            showNotification('Item added successfully', 'success');
        }
        
        if (response.ok) {
            closeFormModal();
            loadData(type);
        } else {
            showNotification('Error saving item', 'error');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Error saving item', 'error');
    }
}

async function editItem(type, id) {
    try {
        const response = await fetch(`/api/${type}`);
        const items = await response.json();
        const item = items.find(i => i.id === id);
        if (item) {
            openFormModal(type, true);
            populateFormWithData(type, item);
        }
    } catch (error) {
        console.error('Error loading item:', error);
        showNotification('Error loading item', 'error');
    }
}

async function deleteItem(type, id) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
            showNotification('Item deleted successfully', 'success');
            loadData(type);
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('Error deleting item', 'error');
        }
    }
}

async function loadAllData() {
    await loadData('catalog');
    await loadData('students');
    await loadData('hobby');
}

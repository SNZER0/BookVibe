let booksData = [];
let readBooksData = [];
let toReadBooksData = [];
let isDarkMode = true; // Set to true for dark mode by default
let timeChart = null;
let monthlyDataByYear = {};
let selectedYear = "all";
let areSectionsExpanded = true;

// Create floating books animation
function createFloatingBooks() {
    const bookEmojis = ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📔', '✏️', '🖋️', '📜', '📒'];
    const container = document.querySelector('.floating-books');
    
    // Create 15 floating books
    for (let i = 0; i < 15; i++) {
        const book = document.createElement('div');
        book.className = 'floating-book';
        book.textContent = bookEmojis[Math.floor(Math.random() * bookEmojis.length)];
        book.style.left = Math.random() * 100 + '%';
        book.style.animationDelay = Math.random() * 20 + 's';
        book.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(book);
    }
}

// Initialize floating books when page loads
document.addEventListener('DOMContentLoaded', createFloatingBooks);

// Theme toggle
function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        document.querySelector('.theme-toggle').textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        document.querySelector('.theme-toggle').textContent = '🌙';
    }
    
    // Recreate chart with updated theme colors
    if (booksData.length > 0) {
        createTimeChart(selectedYear);
    }
}

// Tab switching
function showTab(tabName) {
    // Hide all tab content
    document.getElementById('books-read').classList.add('hidden');
    document.getElementById('to-read').classList.add('hidden');
    document.getElementById('authors').classList.add('hidden');
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab and mark as active
    document.getElementById(tabName).classList.remove('hidden');
    event.target.classList.add('active');
}

// Modal functionality
function showAuthorModal(authorName) {
    const modal = document.getElementById('authorModal');
    document.body.classList.add('modal-open'); // Prevent background scroll

    const authorBooks = booksData.filter(book => 
        book['Author'] && book['Author'].split(',').map(a => a.trim()).includes(authorName)
    );
    
    const readBooks = authorBooks.filter(book => book['Exclusive Shelf'] === 'read');
    const toReadBooks = authorBooks.filter(book => book['Exclusive Shelf'] === 'to-read');
    
    // Update modal content
    document.getElementById('modalAuthorName').textContent = authorName;
    document.getElementById('modalAuthorStats').textContent = 
        `${readBooks.length} books read • ${toReadBooks.length} books to read`;
    
    // Populate read books
    document.getElementById('modalReadBooks').innerHTML = readBooks.length === 0 ? 
        '<div style="text-align: center; color: #666; padding: 20px;">No books read from this author yet</div>' :
        readBooks.map(book => {
            const stars = book['My Rating'] ? '★'.repeat(book['My Rating']) + '☆'.repeat(5 - book['My Rating']) : '';
            const dateRead = book['Date Read'] ? new Date(book['Date Read']).toLocaleDateString() : '';
            const goodreadsUrl = generateGoodreadsUrl(book['Title'], book['Author']);
            
            return `
                <div class="modal-book-item">
                    <div class="book-info">
                        <h4><a href="${goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="modal-book-title">${book['Title']}</a></h4>
                        <p>${dateRead ? `Read in ${dateRead}` : 'Date not available'}</p>
                    </div>
                    <div class="book-rating">
                        ${book['My Rating'] ? `<span class="stars">${stars}</span><span>${book['My Rating']}/5</span>` : '<span>Not rated</span>'}
                    </div>
                </div>
            `;
        }).join('');
    
    // Populate to-read books
    document.getElementById('modalToReadBooks').innerHTML = toReadBooks.length === 0 ? 
        '<div style="text-align: center; color: #666; padding: 20px;">No books in to-read list from this author</div>' :
        toReadBooks.map(book => {
            const pages = book['Number of Pages'] ? `${book['Number of Pages']} pages` : '';
            const dateAdded = book['Date Added'] ? `Added ${new Date(book['Date Added']).toLocaleDateString()}` : '';
            const goodreadsUrl = generateGoodreadsUrl(book['Title'], book['Author']);
            
            return `
                <div class="modal-book-item">
                    <div class="book-info">
                        <h4><a href="${goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="modal-book-title">${book['Title']}</a></h4>
                        <p>${[pages, dateAdded].filter(Boolean).join(' • ') || 'No additional info'}</p>
                    </div>
                    <div class="book-rating">
                        <span style="color: #667eea; font-weight: 600;">📚 To Read</span>
                    </div>
                </div>
            `;
        }).join('');
    
    // Reset to read books tab
    showModalTab('read');
    modal.style.display = 'block';
}

function showModalTab(tabType) {
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    
    if (tabType === 'read') {
        document.getElementById('modalReadBooks').style.display = 'block';
        document.getElementById('modalToReadBooks').style.display = 'none';
        document.querySelector('.modal-tab:first-child').classList.add('active');
    } else {
        document.getElementById('modalReadBooks').style.display = 'none';
        document.getElementById('modalToReadBooks').style.display = 'block';
        document.querySelector('.modal-tab:last-child').classList.add('active');
    }
}

// Close modal when clicking outside or on close button
window.onclick = function(event) {
    const modal = document.getElementById('authorModal');
    if (event.target === modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open'); // Re-enable background scroll
    }
}

document.querySelector('.close').onclick = function() {
    document.getElementById('authorModal').style.display = 'none';
    document.body.classList.remove('modal-open'); // Re-enable background scroll
}

// Toggle both sections at the same time
function toggleBothSections() {
    const chartContent = document.getElementById('chartContent');
    const insightsContent = document.getElementById('insightsContent');
    const chartArrow = document.getElementById('chartArrow');
    const insightsArrow = document.getElementById('insightsArrow');
    
    areSectionsExpanded = !areSectionsExpanded;
    
    if (areSectionsExpanded) {
        chartContent.classList.remove('collapsed');
        insightsContent.classList.remove('collapsed');
        chartArrow.classList.remove('expanded');
        insightsArrow.classList.remove('expanded');
    } else {
        chartContent.classList.add('collapsed');
        insightsContent.classList.add('collapsed');
        chartArrow.classList.add('expanded');
        insightsArrow.classList.add('expanded');
    }
}

// Generate Goodreads URL for a book
function generateGoodreadsUrl(title, author) {
    const baseUrl = 'https://www.goodreads.com/search?q=';
    const query = encodeURIComponent(`${title} ${author}`);
    return `${baseUrl}${query}`;
}

// Process uploaded CSV file
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show loading state
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    // Parse CSV
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            booksData = results.data;
            setTimeout(() => {
                processData(booksData);
            }, 1000);
        }
    });
});

// Drag and drop functionality
const dropZone = document.querySelector('.upload-zone');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('dragover');
}

function unhighlight() {
    dropZone.classList.remove('dragover');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    
    if (file && file.name.endsWith('.csv')) {
        document.getElementById('fileInput').files = dt.files;
        document.getElementById('fileInput').dispatchEvent(new Event('change'));
    } else {
        alert('Please upload a valid CSV file from Goodreads.');
    }
}

// Process the data and update the UI
function processData(data) {
    // Hide loading, show dashboard
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Filter out books without a title
    const validBooks = data.filter(book => book['Title'] && book['Title'].trim() !== '');
    
    // Calculate statistics
    readBooksData = validBooks.filter(book => book['Exclusive Shelf'] === 'read');
    toReadBooksData = validBooks.filter(book => book['Exclusive Shelf'] === 'to-read');
    
    // Total books read
    document.getElementById('totalBooks').textContent = readBooksData.length;
    
    // Total pages read
    const totalPages = readBooksData.reduce((sum, book) => {
        const pages = parseInt(book['Number of Pages']) || 0;
        return sum + pages;
    }, 0);
    document.getElementById('totalPages').textContent = totalPages.toLocaleString();
    
    // Average rating
    const ratedBooks = readBooksData.filter(book => book['My Rating'] && parseInt(book['My Rating']) > 0);
    const avgRating = ratedBooks.length > 0 ? 
        (ratedBooks.reduce((sum, book) => sum + parseInt(book['My Rating']), 0) / ratedBooks.length).toFixed(2) : 
        0;
    document.getElementById('avgRating').textContent = avgRating;
    
    // Unique authors (from read books only)
    const readAuthors = new Set();
    readBooksData.forEach(book => {
        if (book['Author']) {
            book['Author'].split(',').forEach(author => {
                readAuthors.add(author.trim());
            });
        }
    });
    document.getElementById('totalAuthors').textContent = readAuthors.size;
    
    // Populate books read
    document.getElementById('readBooks').innerHTML = readBooksData.map(book => {
        const stars = book['My Rating'] ? '★'.repeat(book['My Rating']) + '☆'.repeat(5 - book['My Rating']) : '';
        const dateRead = book['Date Read'] ? new Date(book['Date Read']).toLocaleDateString() : '';
        const goodreadsUrl = generateGoodreadsUrl(book['Title'], book['Author']);
        
        return `
            <div class="book-item">
                <div class="book-info">
                    <h4><a href="${goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="book-title">${book['Title']}</a></h4>
                    <p>by ${book['Author'] || 'Unknown'} • ${dateRead || 'Date not available'}</p>
                </div>
                <div class="book-rating">
                    ${book['My Rating'] ? `<span class="stars">${stars}</span><span>${book['My Rating']}/5</span>` : '<span>Not rated</span>'}
                </div>
            </div>
        `;
    }).join('');
    
    // Populate to-read books
    document.getElementById('toReadBooks').innerHTML = toReadBooksData.map(book => {
        const pages = book['Number of Pages'] ? `${book['Number of Pages']} pages` : '';
        const dateAdded = book['Date Added'] ? `Added ${new Date(book['Date Added']).toLocaleDateString()}` : '';
        const goodreadsUrl = generateGoodreadsUrl(book['Title'], book['Author']);
        
        return `
            <div class="book-item">
                <div class="book-info">
                    <h4><a href="${goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="book-title">${book['Title']}</a></h4>
                    <p>by ${book['Author'] || 'Unknown'} • ${[pages, dateAdded].filter(Boolean).join(' • ') || 'No additional info'}</p>
                </div>
                <div class="book-rating">
                    <span style="color: #667eea; font-weight: 600;">📚 To Read</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Populate authors (both read and to-read)
    populateAuthors(readBooksData, toReadBooksData);
    
    // Generate insights
    generateInsights(readBooksData, toReadBooksData);
    
    // Create time chart
    prepareMonthlyData(readBooksData);
    createYearSelector();
    createTimeChart("all");
}

// Populate authors sections
function populateAuthors(readBooks, toReadBooks) {
    // Authors from read books
    const readAuthorCounts = {};
    readBooks.forEach(book => {
        if (book['Author']) {
            const authors = book['Author'].split(',').map(a => a.trim());
            authors.forEach(author => {
                readAuthorCounts[author] = (readAuthorCounts[author] || 0) + 1;
            });
        }
    });
    
    // Sort authors by count
    const sortedReadAuthors = Object.entries(readAuthorCounts)
        .sort((a, b) => b[1] - a[1]);
    
    document.getElementById('readAuthorsList').innerHTML = sortedReadAuthors.map(([author, count]) => {
        return `
            <div class="author-card" onclick="showAuthorModal('${author.replace(/'/g, "\\'")}')">
                <div class="author-name">${author}</div>
                <div class="author-stats">${count} book${count > 1 ? 's' : ''} read</div>
            </div>
        `;
    }).join('');
    
    // Authors from to-read books
    const toReadAuthorCounts = {};
    toReadBooks.forEach(book => {
        if (book['Author']) {
            const authors = book['Author'].split(',').map(a => a.trim());
            authors.forEach(author => {
                toReadAuthorCounts[author] = (toReadAuthorCounts[author] || 0) + 1;
            });
        }
    });
    
    // Remove authors that are already in the read list
    Object.keys(readAuthorCounts).forEach(author => {
        if (toReadAuthorCounts[author]) {
            delete toReadAuthorCounts[author];
        }
    });
    
    // Sort authors by count
    const sortedToReadAuthors = Object.entries(toReadAuthorCounts)
        .sort((a, b) => b[1] - a[1]);
    
    document.getElementById('toReadAuthorsList').innerHTML = sortedToReadAuthors.length > 0 ? 
        sortedToReadAuthors.map(([author, count]) => {
            return `
                <div class="author-card" onclick="showAuthorModal('${author.replace(/'/g, "\\'")}')">
                    <div class="author-name">${author}</div>
                    <div class="author-stats">${count} book${count > 1 ? 's' : ''} to read</div>
                </div>
            `;
        }).join('') :
        '<div class="author-card"><div class="author-name">No authors found</div><div class="author-stats">All authors in your to-read list are also in your read list</div></div>';
}

// Prepare monthly data by year
function prepareMonthlyData(readBooks) {
    monthlyDataByYear = {};
    
    // Initialize all years with empty monthly data
    const allYears = new Set();
    readBooks.forEach(book => {
        if (book['Date Read']) {
            const date = new Date(book['Date Read']);
            allYears.add(date.getFullYear());
        }
    });
    
    // Add "all" option
    monthlyDataByYear["all"] = {};
    
    // Initialize monthly data for each year
    allYears.forEach(year => {
        monthlyDataByYear[year] = {};
        for (let month = 0; month < 12; month++) {
            monthlyDataByYear[year][month] = 0;
        }
    });
    
    // Count books by month and year
    readBooks.forEach(book => {
        if (book['Date Read']) {
            const date = new Date(book['Date Read']);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            // Add to specific year
            monthlyDataByYear[year][month] = (monthlyDataByYear[year][month] || 0) + 1;
            
            // Add to "all" collection
            monthlyDataByYear["all"][month] = (monthlyDataByYear["all"][month] || 0) + 1;
        }
    });
}

// Create year selector buttons
function createYearSelector() {
    const yearSelector = document.getElementById('yearSelector');
    const years = Object.keys(monthlyDataByYear).filter(year => year !== "all").sort((a, b) => b - a);
    
    // Add "All Years" button
    yearSelector.innerHTML = `
        <button class="year-button active" data-year="all" onclick="changeYear('all')">All Years</button>
    `;
    
    // Add buttons for each year
    years.forEach(year => {
        yearSelector.innerHTML += `
            <button class="year-button" data-year="${year}" onclick="changeYear('${year}')">${year}</button>
        `;
    });
}

// Change the selected year for the chart
function changeYear(year) {
    selectedYear = year;
    
    // Update active button
    document.querySelectorAll('.year-button').forEach(button => {
        if (button.dataset.year === year) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update chart
    createTimeChart(year);
}

// Create time chart
function createTimeChart(year) {
    const ctx = document.getElementById('timeChart').getContext('2d');
    
    // Get data for selected year
    const monthlyData = monthlyDataByYear[year] || {};
    
    // Prepare labels and data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = monthNames.map((_, index) => monthlyData[index] || 0);
    
    // Create chart
    if (timeChart) {
        timeChart.destroy();
    }
    
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    timeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Books Read',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.5)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 5,
                hoverBackgroundColor: 'rgba(102, 126, 234, 0.7)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: `Monthly Reading Trend - ${year === "all" ? "All Years" : year}`,
                    color: textColor,
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        stepSize: 1
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

function refreshInsights(event) {
    event.stopPropagation(); // Prevent the section from collapsing
    generateInsights(readBooksData, toReadBooksData);
}

// Generate insights
function generateInsights(readBooks, toReadBooks) {
    const insights = [];
    
    // Total books insight
    insights.push(`You've read <strong>${readBooks.length}</strong> books in total. That's impressive!`);
    
    // Longest book
    const longestBook = readBooks.reduce((longest, book) => {
        const pages = parseInt(book['Number of Pages']) || 0;
        return pages > (parseInt(longest['Number of Pages']) || 0) ? book : longest;
    }, readBooks[0] || {});
    
    if (longestBook['Title']) {
        insights.push(`Your longest read was <strong>${longestBook['Title']}</strong> with <strong>${longestBook['Number of Pages'] || 'unknown'}</strong> pages.`);
    }
    
    // Most read author
    const authorCounts = {};
    readBooks.forEach(book => {
        if (book['Author']) {
            const authors = book['Author'].split(',').map(a => a.trim());
            authors.forEach(author => {
                authorCounts[author] = (authorCounts[author] || 0) + 1;
            });
        }
    });
    
    const mostReadAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostReadAuthor) {
        insights.push(`Your most-read author is <strong>${mostReadAuthor[0]}</strong> with <strong>${mostReadAuthor[1]}</strong> books.`);
    }
    
    // To-read list size
    insights.push(`You have <strong>${toReadBooks.length}</strong> books on your to-read list. Keep going!`);
    
    // Average rating
    const ratedBooks = readBooks.filter(book => book['My Rating'] && parseInt(book['My Rating']) > 0);
    const avgRating = ratedBooks.length > 0 ? 
        (ratedBooks.reduce((sum, book) => sum + parseInt(book['My Rating']), 0) / ratedBooks.length).toFixed(2) : 
        0;
    insights.push(`Your average rating is <strong>${avgRating}</strong> out of 5 stars.`);
    
    // Best reading month
    if (Object.keys(monthlyDataByYear).length > 0) {
        let bestMonthCount = 0;
        let bestMonth = '';
        let bestYear = '';
        
        Object.keys(monthlyDataByYear).forEach(year => {
            if (year !== "all") {
                for (let month = 0; month < 12; month++) {
                    if (monthlyDataByYear[year][month] > bestMonthCount) {
                        bestMonthCount = monthlyDataByYear[year][month];
                        bestMonth = month;
                        bestYear = year;
                    }
                }
            }
        });
        
        if (bestMonthCount > 0) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                      'July', 'August', 'September', 'October', 'November', 'December'];
            insights.push(`Your best reading month was <strong>${monthNames[bestMonth]} ${bestYear}</strong> with <strong>${bestMonthCount}</strong> books.`);
        }
    }
    
    // Shuffle and display a subset of insights
    const shuffledInsights = insights.sort(() => 0.5 - Math.random());
    const insightsToShow = shuffledInsights.slice(0, 4); // Show 4 random insights

    document.getElementById('insightsList').innerHTML = insightsToShow.map(insight => 
        `<div class="insight-item">${insight}</div>`
    ).join('');
}